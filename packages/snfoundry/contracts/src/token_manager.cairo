#[starknet::contract]
mod KudiTokenManager {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::IERC20DispatcherTrait;
    use super::IERC20Dispatcher;
    use core::num::traits::Zero;

    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };

    #[storage]
    struct Storage {
        // Owner of the contract
        owner: ContractAddress,
        // Map of supported tokens
        supported_tokens: Map<ContractAddress, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TokenAdded: TokenAdded,
        TokenRemoved: TokenRemoved,
        TokenTransferred: TokenTransferred,
    }

    #[derive(Drop, starknet::Event)]
    struct TokenAdded {
        token_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct TokenRemoved {
        token_address: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct TokenTransferred {
        token_address: ContractAddress,
        from: ContractAddress,
        to: ContractAddress,
        amount: u256
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    #[generate_trait]
    impl TokenManagerImpl of ITokenManager {
        /// Transfer tokens from the caller to a recipient
        fn transfer_tokens(
            ref self: ContractState,
            token_address: ContractAddress,
            recipient: ContractAddress,
            amount: u256
        ) -> bool {
            // Check if the token is supported
            assert(self.supported_tokens.read(token_address), 'Token not supported');
            assert(!recipient.is_zero(), 'Invalid recipient');
            assert(amount > 0, 'Amount must be positive');
            
            // Get the caller (user's wallet)
            let caller = get_caller_address();
            
            // Create a dispatcher to interact with the token contract
            let token = IERC20Dispatcher { contract_address: token_address };
            
            // Transfer tokens
            let result = token.transfer(recipient, amount);
            
            // Emit transfer event if successful
            if result {
                self.emit(TokenTransferred { token_address, from: caller, to: recipient, amount });
            }
            
            result
        }
        
        /// Get token balance of an account
        fn get_token_balance(
            self: @ContractState,
            token_address: ContractAddress,
            account: ContractAddress
        ) -> u256 {
            // Check if the token is supported
            assert(self.supported_tokens.read(token_address), 'Token not supported');
            
            // Create a dispatcher to interact with the token contract
            let token = IERC20Dispatcher { contract_address: token_address };
            
            // Get the balance
            token.balance_of(account)
        }
        
        /// Approve spender to use tokens on behalf of the caller
        fn approve_tokens(
            ref self: ContractState,
            token_address: ContractAddress,
            spender: ContractAddress,
            amount: u256
        ) -> bool {
            // Check if the token is supported
            assert(self.supported_tokens.read(token_address), 'Token not supported');
            assert(!spender.is_zero(), 'Invalid spender');
            
            // Create a dispatcher to interact with the token contract
            let token = IERC20Dispatcher { contract_address: token_address };
            
            // Approve spender
            token.approve(spender, amount)
        }
        
        /// Check if a token is supported
        fn is_token_supported(self: @ContractState, token_address: ContractAddress) -> bool {
            self.supported_tokens.read(token_address)
        }
    }

    #[abi(embed_v0)]
    #[generate_trait]
    impl AdminImpl of IAdmin {
        /// Add a token to the supported list
        fn add_token(ref self: ContractState, token_address: ContractAddress) {
            self.assert_only_owner();
            assert(!token_address.is_zero(), 'Invalid token address');
            
            // Verify this is a valid ERC20 token by checking if it implements basic functions
            let token = IERC20Dispatcher { contract_address: token_address };
            
            // Try to call some basic ERC20 functions to verify it's a valid token
            // This will revert if the token doesn't implement these functions
            let _ = token.symbol();
            let _ = token.decimals();
            
            self.supported_tokens.write(token_address, true);
            self.emit(TokenAdded { token_address });
        }
        
        /// Remove a token from the supported list
        fn remove_token(ref self: ContractState, token_address: ContractAddress) {
            self.assert_only_owner();
            
            self.supported_tokens.write(token_address, false);
            self.emit(TokenRemoved { token_address });
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
