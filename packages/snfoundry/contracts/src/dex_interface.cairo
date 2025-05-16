#[starknet::interface]
trait IDexInterface {
    /// Submit an approve transaction to a DEX
    fn approve_dex(
        ref self: TContractState, 
        token_address: ContractAddress, 
        dex_address: ContractAddress, 
        amount: u256
    ) -> bool;
    
    /// Perform a token swap through a DEX
    fn swap_tokens(
        ref self: TContractState,
        dex_address: ContractAddress,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
        min_amount_out: u256
    ) -> u256;
}

#[starknet::interface]
trait IJediSwap {
    fn swap_exact_tokens_for_tokens(
        ref self: TContractState,
        amount_in: u256,
        amount_out_min: u256,
        path: Array<ContractAddress>,
        to: ContractAddress,
        deadline: u64
    ) -> Array<u256>;
}

#[starknet::interface]
trait IERC20 {
    fn name(self: @TContractState) -> felt252;
    fn symbol(self: @TContractState) -> felt252;
    fn decimals(self: @TContractState) -> u8;
    fn total_supply(self: @TContractState) -> u256;
    fn balance_of(self: @TContractState, account: ContractAddress) -> u256;
    fn allowance(self: @TContractState, owner: ContractAddress, spender: ContractAddress) -> u256;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn approve(ref self: TContractState, spender: ContractAddress, amount: u256) -> bool;
}

#[starknet::contract]
mod KudiDexInterface {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use core::array::ArrayTrait;
    use core::option::OptionTrait;
    use super::IERC20DispatcherTrait;
    use super::IERC20Dispatcher;
    use super::IJediSwapDispatcherTrait;
    use super::IJediSwapDispatcher;
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    #[storage]
    struct Storage {
        // Owner of the contract
        owner: ContractAddress,
        // List of approved DEX addresses
        approved_dexes: Map<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        DexApproved: DexApproved,
        DexRemoved: DexRemoved,
        SwapExecuted: SwapExecuted,
    }

    #[derive(Drop, starknet::Event)]
    struct DexApproved {
        dex_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct DexRemoved {
        dex_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct SwapExecuted {
        user: ContractAddress,
        token_in: ContractAddress,
        token_out: ContractAddress,
        amount_in: u256,
        amount_out: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl DexInterfaceImpl of super::IDexInterface {
        /// Submit an approve transaction to a DEX
        fn approve_dex(
            ref self: ContractState, 
            token_address: ContractAddress, 
            dex_address: ContractAddress, 
            amount: u256
        ) -> bool {
            // Check if the DEX is approved
            assert(self.approved_dexes.read(dex_address), 'DEX not approved');
            
            // Get the caller (user's wallet)
            let caller = get_caller_address();
            
            // Create a dispatcher to interact with the token contract
            let token = IERC20Dispatcher { contract_address: token_address };
            
            // Approve the DEX to spend tokens on behalf of the caller
            token.approve(dex_address, amount)
        }
        
        /// Perform a token swap through a DEX
        fn swap_tokens(
            ref self: ContractState,
            dex_address: ContractAddress,
            token_in: ContractAddress,
            token_out: ContractAddress,
            amount_in: u256,
            min_amount_out: u256
        ) -> u256 {
            // Check if the DEX is approved
            assert(self.approved_dexes.read(dex_address), 'DEX not approved');
            
            // Get the caller (user's wallet)
            let caller = get_caller_address();
            
            // Create a dispatcher to interact with the JediSwap contract
            let dex = IJediSwapDispatcher { contract_address: dex_address };
            
            // Create a path array for the swap
            let mut path = ArrayTrait::new();
            path.append(token_in);
            path.append(token_out);
            
            // Execute the swap
            // Using a simple deadline (current + 1 hour)
            // In a production environment, this should be passed from the frontend
            let deadline = 0xffffffffffffffff; // Max u64 value as placeholder
            
            let amounts = dex.swap_exact_tokens_for_tokens(
                amount_in,
                min_amount_out,
                path,
                caller, // Tokens are sent directly to the caller
                deadline
            );
            
            // The output amount is the last element in the returned array
            let amounts_span = amounts.span();
            let amount_out = *amounts_span.at(amounts_span.len() - 1);
            
            // Emit swap event
            self.emit(SwapExecuted { user: caller, token_in, token_out, amount_in, amount_out });
            
            amount_out
        }
    }
 
    #[generate_trait]
    impl AdminImpl of IAdmin {
        /// Add a DEX to the approved list
        fn approve_dex(ref self: ContractState, dex_address: ContractAddress) {
            self.assert_only_owner();
            assert(!dex_address.is_zero(), 'Invalid DEX address');
            
            self.approved_dexes.write(dex_address, true);
            self.emit(DexApproved { dex_address });
        }
        
        /// Remove a DEX from the approved list
        fn remove_dex(ref self: ContractState, dex_address: ContractAddress) {
            self.assert_only_owner();
            
            self.approved_dexes.write(dex_address, false);
            self.emit(DexRemoved { dex_address });
        }
        
        /// Check if a DEX is approved
        fn is_dex_approved(self: @ContractState, dex_address: ContractAddress) -> bool {
            self.approved_dexes.read(dex_address)
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