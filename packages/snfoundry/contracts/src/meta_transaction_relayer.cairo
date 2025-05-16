#[starknet::contract]
mod KudiMetaTransactionRelayer {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::IAccountDispatcherTrait;
    use super::IAccountDispatcher;
    use array::ArrayTrait;
    use option::OptionTrait;
    use starknet::account::Call;
    use zeroable::Zeroable;

    #[storage]
    struct Storage {
        // Owner of the contract
        owner: ContractAddress,
        // List of authorized relayers
        authorized_relayers: LegacyMap<ContractAddress, bool>,
        // Nonce for each account (to prevent replay attacks)
        relayer_nonces: LegacyMap<(ContractAddress, ContractAddress), u128>,
        // Gas price oracle
        gas_price: u256,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        RelayerAdded: RelayerAdded,
        RelayerRemoved: RelayerRemoved,
        MetaTransactionExecuted: MetaTransactionExecuted,
        GasPriceUpdated: GasPriceUpdated,
    }

    #[derive(Drop, starknet::Event)]
    struct RelayerAdded {
        relayer_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct RelayerRemoved {
        relayer_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct MetaTransactionExecuted {
        user_wallet: ContractAddress,
        relayer: ContractAddress,
        success: bool
    }

    #[derive(Drop, starknet::Event)]
    struct GasPriceUpdated {
        new_gas_price: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, initial_gas_price: u256) {
        self.owner.write(owner);
        self.gas_price.write(initial_gas_price);
        
        // Add the owner as an authorized relayer
        self.authorized_relayers.write(owner, true);
        self.emit(RelayerAdded { relayer_address: owner });
    }

    #[external(v0)]
    #[generate_trait]
    impl RelayerImpl of IRelayer {
        /// Execute a meta-transaction on behalf of a user
        fn execute_meta_transaction(
            ref self: ContractState,
            user_wallet: ContractAddress,
            calls: Array<Call>,
            signature: Array<felt252>,
            user_nonce: u128
        ) -> Array<Span<felt252>> {
            // Check if the relayer is authorized
            let relayer = get_caller_address();
            assert(self.authorized_relayers.read(relayer), 'Unauthorized relayer');
            
            // Create a dispatcher to interact with the user's wallet
            let wallet = IAccountDispatcher { contract_address: user_wallet };
            
            // Execute the meta-transaction on behalf of the user
            let result = wallet.execute_meta_transaction(calls, signature, user_nonce);
            
            // Emit event for tracking
            self.emit(MetaTransactionExecuted { 
                user_wallet, 
                relayer, 
                success: true 
            });
            
            result
        }
        
        /// Get the current gas price
        fn get_gas_price(self: @ContractState) -> u256 {
            self.gas_price.read()
        }
        
        /// Check if a relayer is authorized
        fn is_authorized_relayer(self: @ContractState, relayer: ContractAddress) -> bool {
            self.authorized_relayers.read(relayer)
        }
    }

    #[external(v0)]
    #[generate_trait]
    impl AdminImpl of IAdmin {
        /// Add a relayer to the authorized list
        fn add_relayer(ref self: ContractState, relayer_address: ContractAddress) {
            self.assert_only_owner();
            assert(!relayer_address.is_zero(), 'Invalid relayer address');
            
            self.authorized_relayers.write(relayer_address, true);
            self.emit(RelayerAdded { relayer_address });
        }
        
        /// Remove a relayer from the authorized list
        fn remove_relayer(ref self: ContractState, relayer_address: ContractAddress) {
            self.assert_only_owner();
            
            self.authorized_relayers.write(relayer_address, false);
            self.emit(RelayerRemoved { relayer_address });
        }
        
        /// Update the gas price
        fn update_gas_price(ref self: ContractState, new_gas_price: u256) {
            self.assert_only_owner();
            assert(new_gas_price > 0, 'Gas price must be positive');
            
            self.gas_price.write(new_gas_price);
            self.emit(GasPriceUpdated { new_gas_price });
        }
        
        /// Transfer ownership of the contract
        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            self.assert_only_owner();
            assert(!new_owner.is_zero(), 'New owner cannot be zero');
            
            self.owner.write(new_owner);
        }
        
        /// Get the current owner of the contract
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        /// Check if the caller is the owner of the contract
        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner can call');
        }
    }
}
