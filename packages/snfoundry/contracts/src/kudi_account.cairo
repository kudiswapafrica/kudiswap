use starknet::ContractAddress;

#[starknet::interface]
trait IAccount {
    /// Updates the public key associated with this account
    fn update_public_key(ref self: TContractState, new_public_key: felt252);
    
    /// Set or update guardian address for account recovery
    fn set_guardian(ref self: TContractState, new_guardian: ContractAddress);
    
    /// Execute a transaction with signature (for meta-transactions)
    fn execute_meta_transaction(
        ref self: TContractState, 
        calls: Array<Call>, 
        signature: Array<felt252>,
        nonce: u128
    ) -> Array<Span<felt252>>;
    
    /// Returns the current public key of the account
    fn get_public_key(self: @TContractState) -> felt252;
    
    /// Returns the current nonce of the account
    fn get_nonce(self: @TContractState) -> u128;
    
    /// Returns the user ID associated with this account
    fn get_user_id(self: @TContractState) -> felt252;
    
    /// Returns the guardian address for account recovery
    fn get_guardian(self: @TContractState) -> ContractAddress;
}

#[starknet::contract]
mod KudiAccount {
    use core::array::ArrayTrait;
    use core::option::OptionTrait;
    use ecdsa::check_ecdsa_signature;
    use starknet::{
        get_tx_info, get_caller_address, ContractAddress, account::Call,
        syscalls::call_contract_syscall, 
        ClassHash, 
        syscalls::replace_class_syscall, StorageAddress
    };
    use core::num::traits::Zero;

    // Constants
    const TRANSACTION_VERSION: felt252 = 1;
    // QUERY_VERSION is a constant used for query-based transactions
    const QUERY_VERSION: felt252 = 0;
    // Used for validating account version
    const SRC6_TRAIT_ID: felt252 = 1767482159;

    #[storage]
    struct Storage {
        // Public key used for transaction validation
        public_key: felt252,
        // User identifier (hashed phone number)
        user_id: felt252,
        // Guardian address for social recovery
        guardian: ContractAddress,
        // Nonce for transaction ordering
        nonce: u128,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        PublicKeyRotated: PublicKeyRotated,
        GuardianUpdated: GuardianUpdated,
        TransactionExecuted: TransactionExecuted,
    }

    #[derive(Drop, starknet::Event)]
    struct PublicKeyRotated {
        new_public_key: felt252
    }

    #[derive(Drop, starknet::Event)]
    struct GuardianUpdated {
        new_guardian: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct TransactionExecuted {
        hash: felt252,
        response: Span<felt252>
    }

    #[constructor]
    fn constructor(ref self: ContractState, public_key: felt252, user_id: felt252) {
        self.public_key.write(public_key);
        self.user_id.write(user_id);
        self.nonce.write(0);
    }

    #[external(v0)]
    impl SRC6Impl of starknet::account::SRC6 {
        /// Validate transaction signature
        fn __validate__(ref self: ContractState, calls: Array<Call>) -> felt252 {
            self.validate_transaction()
        }

        /// Execute a list of calls
        fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            // Validate transaction first
            self.validate_transaction();
            
            // Increment nonce
            let current_nonce = self.nonce.read();
            self.nonce.write(current_nonce + 1);
            
            // Execute calls
            let mut results = ArrayTrait::new();
            let mut calls_span = calls.span();
            
            loop {
                match calls_span.pop_front() {
                    Option::Some(call) => {
                        let result = self.execute_single_call(call);
                        results.append(result);
                    },
                    Option::None(_) => {
                        break;
                    },
                };
            };
            
            results
        }
        
        /// Check if a specified interface is supported
        fn is_valid_signature(
            self: @ContractState, hash: felt252, signature: Array<felt252>
        ) -> felt252 {
            if self._is_valid_signature(hash, signature.span()) {
                return starknet::VALIDATED;
            }
            return 0;
        }
    }

    #[external(v0)]
    impl AccountImpl of super::IAccount<TContractState> {
        /// Updates the public key associated with this account
        fn update_public_key(ref self: ContractState, new_public_key: felt252) {
            self.assert_only_self();
            self.public_key.write(new_public_key);
            self.emit(PublicKeyRotated { new_public_key });
        }

        /// Set or update guardian address for account recovery
        fn set_guardian(ref self: ContractState, new_guardian: ContractAddress) {
            self.assert_only_self();
            self.guardian.write(new_guardian);
            self.emit(GuardianUpdated { new_guardian });
        }

        /// Execute a transaction with signature (for meta-transactions)
        fn execute_meta_transaction(
            ref self: ContractState, 
            calls: Array<Call>, 
            signature: Array<felt252>,
            nonce: u128
        ) -> Array<Span<felt252>> {
            // Validate the nonce
            let current_nonce = self.nonce.read();
            assert(nonce == current_nonce, 'Invalid nonce');
            
            // Increment nonce
            self.nonce.write(current_nonce + 1);
            
            // Validate signature
            let mut call_data = ArrayTrait::new();
            let mut calls_span = calls.span();
            
            // Hash the transaction data for signature verification
            let tx_hash = self.compute_meta_tx_hash(calls_span, nonce);
            
            // Verify signature
            assert(self._is_valid_signature(tx_hash, signature.span()), 'Invalid signature');
            
            // Execute the calls
            let mut results = ArrayTrait::new();
            let mut calls_span = calls.span();
            
            loop {
                match calls_span.pop_front() {
                    Option::Some(call) => {
                        let result = self.execute_single_call(call);
                        results.append(result);
                    },
                    Option::None(_) => {
                        break;
                    },
                };
            };
            
            results
        }
        
        /// Returns the current public key of the account
        fn get_public_key(self: @ContractState) -> felt252 {
            self.public_key.read()
        }
        
        /// Returns the current nonce of the account
        fn get_nonce(self: @ContractState) -> u128 {
            self.nonce.read()
        }
        
        /// Returns the user ID associated with this account
        fn get_user_id(self: @ContractState) -> felt252 {
            self.user_id.read()
        }
        
        /// Returns the guardian address for account recovery
        fn get_guardian(self: @ContractState) -> ContractAddress {
            self.guardian.read()
        }
    }

    #[external(v0)]
    #[generate_trait]
    impl GuardianRecoveryImpl of IGuardianRecovery {
        /// Recover account by setting a new public key (requires guardian signature)
        fn recover_account(
            ref self: ContractState, 
            new_public_key: felt252, 
            guardian_signature: Array<felt252>
        ) {
            let guardian = self.guardian.read();
            assert(guardian.is_non_zero(), 'Guardian not set');
            
            // Create recovery message hash
            let recovery_hash = self._compute_recovery_hash(new_public_key);
            
            // Verify guardian signature
            // TODO: Implement guardian signature verification
            // This is a placeholder until we implement guardian signature verification
            // which may require different logic based on the guardian type
            
            // Update the public key
            self.public_key.write(new_public_key);
            self.emit(PublicKeyRotated { new_public_key });
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        /// Execute a single contract call
        fn execute_single_call(
            self: @ContractState, call: Call
        ) -> Span<felt252> {
            let res = call_contract_syscall(
                address: call.to,
                entry_point_selector: call.selector,
                calldata: call.calldata.span()
            );
            
            match res {
                Result::Ok(ret_data) => {
                    ret_data
                },
                Result::Err(revert_reason) => {
                    panic(revert_reason)
                }
            }
        }
        
        /// Validate a transaction signature
        fn validate_transaction(ref self: ContractState) -> felt252 {
            let tx_info = get_tx_info().unbox();
            
            // Check transaction version
            let version = tx_info.version;
            if version != TRANSACTION_VERSION && version != QUERY_VERSION {
                return 0;
            }
            
            // If query transaction, skip nonce validation
            if version == TRANSACTION_VERSION {
                // For exec txs, verify nonce
                let given_nonce = tx_info.nonce;
                let current_nonce = self.nonce.read();
                
                if given_nonce != current_nonce {
                    return 0;
                }
            }
            
            // Verify signature
            self._is_valid_signature(tx_info.transaction_hash, tx_info.signature)
        }
        
        /// Verify if a signature is valid
        fn _is_valid_signature(
            self: @ContractState, hash: felt252, signature: Span<felt252>
        ) -> bool {
            if signature.len() != 2 {
                return false;
            }
            
            // Get signature components
            let r = *signature.at(0);
            let s = *signature.at(1);
            
            // Verify ECDSA signature
            let public_key = self.public_key.read();
            check_ecdsa_signature(hash, public_key, r, s)
        }
        
        /// Compute hash for meta-transaction
        fn compute_meta_tx_hash(
            self: @ContractState, calls: Span<Call>, nonce: u128
        ) -> felt252 {
            // TODO: Implement proper hashing of calls array and nonce
            // This is a placeholder - real implementation should hash call data properly
            let contract_address = starknet::get_contract_address();
            let mut hash = contract_address.into();
            
            // Simple implementation - proper hashing should be more robust
            let mut calls_hash = 0;
            let mut idx = 0;
            
            loop {
                if idx >= calls.len() {
                    break;
                }
                
                let call = *calls.at(idx);
                calls_hash += call.to.into() + call.selector;
                
                idx += 1;
            };
            
            hash + calls_hash + nonce.into()
        }
        
        /// Compute hash for account recovery
        fn _compute_recovery_hash(self: @ContractState, new_public_key: felt252) -> felt252 {
            // Simple hash for recovery request
            // TODO: Implement proper hashing for recovery
            let contract_address = starknet::get_contract_address();
            let contract_addr_felt = contract_address.into();
            contract_addr_felt + new_public_key
        }
        
        /// Ensure caller is the account itself
        fn assert_only_self(self: @ContractState) {
            let caller = get_caller_address();
            let self_address = starknet::get_contract_address();
            assert(caller == self_address, 'Only self can call');
        }
    }
}
