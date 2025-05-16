#[starknet::contract]
mod KudiSecurityModule {
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use zeroable::Zeroable;

    // Constants for security thresholds
    const MAX_TRANSACTION_VALUE: u256 = 10000000000000000000; // 10 ETH in wei
    const MAX_DAILY_TRANSACTION_LIMIT: u256 = 50000000000000000000; // 50 ETH in wei
    const TRANSACTION_TIMEOUT: u64 = 3600; // 1 hour in seconds

    #[storage]
    struct Storage {
        // Owner of the contract
        owner: ContractAddress,
        // Daily transaction amount for each user
        daily_transaction_amounts: LegacyMap<(ContractAddress, u64), u256>,
        // Last transaction timestamp for each user
        last_transaction_timestamp: LegacyMap<ContractAddress, u64>,
        // Custom transaction limits for each user
        custom_transaction_limits: LegacyMap<ContractAddress, u256>,
        // Custom daily limits for each user
        custom_daily_limits: LegacyMap<ContractAddress, u256>,
        // Pause status
        paused: bool,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TransactionLimitUpdated: TransactionLimitUpdated,
        DailyLimitUpdated: DailyLimitUpdated,
        SecurityCheckFailed: SecurityCheckFailed,
        ContractPaused: ContractPaused,
        ContractUnpaused: ContractUnpaused,
    }

    #[derive(Drop, starknet::Event)]
    struct TransactionLimitUpdated {
        user: ContractAddress,
        new_limit: u256
    }

    #[derive(Drop, starknet::Event)]
    struct DailyLimitUpdated {
        user: ContractAddress,
        new_limit: u256
    }

    #[derive(Drop, starknet::Event)]
    struct SecurityCheckFailed {
        user: ContractAddress,
        reason: felt252
    }

    #[derive(Drop, starknet::Event)]
    struct ContractPaused {}

    #[derive(Drop, starknet::Event)]
    struct ContractUnpaused {}

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.owner.write(owner);
        self.paused.write(false);
    }

    #[external(v0)]
    #[generate_trait]
    impl SecurityModuleImpl of ISecurityModule {
        /// Check if a transaction is safe to execute
        fn check_transaction_safety(
            ref self: ContractState,
            user: ContractAddress,
            transaction_value: u256,
            timestamp: u64
        ) -> bool {
            // Check if contract is paused
            assert(!self.paused.read(), 'Contract is paused');
            
            // Get transaction limit for the user
            let tx_limit = self.get_transaction_limit(user);
            
            // Check if transaction exceeds the limit
            if transaction_value > tx_limit {
                self.emit(SecurityCheckFailed { user, reason: 'Transaction limit exceeded' });
                return false;
            }
            
            // Get the current day (timestamp / 86400 = days since epoch)
            let current_day = timestamp / 86400;
            
            // Get current daily total
            let daily_total = self.daily_transaction_amounts.read((user, current_day));
            
            // Get daily limit for the user
            let daily_limit = self.get_daily_limit(user);
            
            // Check if daily limit would be exceeded
            if daily_total + transaction_value > daily_limit {
                self.emit(SecurityCheckFailed { user, reason: 'Daily limit exceeded' });
                return false;
            }
            
            // Check for transaction timeout
            let last_timestamp = self.last_transaction_timestamp.read(user);
            if last_timestamp > 0 && timestamp - last_timestamp < TRANSACTION_TIMEOUT {
                // Check if there's a reasonable time gap between transactions
                // This is a simple anti-MEV protection
            }
            
            // Update daily total
            self.daily_transaction_amounts.write((user, current_day), daily_total + transaction_value);
            
            // Update last transaction timestamp
            self.last_transaction_timestamp.write(user, timestamp);
            
            true
        }
        
        /// Get transaction limit for a user
        fn get_transaction_limit(self: @ContractState, user: ContractAddress) -> u256 {
            let custom_limit = self.custom_transaction_limits.read(user);
            if custom_limit > 0 {
                return custom_limit;
            }
            MAX_TRANSACTION_VALUE
        }
        
        /// Get daily limit for a user
        fn get_daily_limit(self: @ContractState, user: ContractAddress) -> u256 {
            let custom_limit = self.custom_daily_limits.read(user);
            if custom_limit > 0 {
                return custom_limit;
            }
            MAX_DAILY_TRANSACTION_LIMIT
        }
        
        /// Check if the contract is paused
        fn is_paused(self: @ContractState) -> bool {
            self.paused.read()
        }
    }

    #[external(v0)]
    #[generate_trait]
    impl AdminImpl of IAdmin {
        /// Set custom transaction limit for a user
        fn set_transaction_limit(ref self: ContractState, user: ContractAddress, limit: u256) {
            self.assert_only_owner();
            assert(!user.is_zero(), 'Invalid user address');
            
            self.custom_transaction_limits.write(user, limit);
            self.emit(TransactionLimitUpdated { user, new_limit: limit });
        }
        
        /// Set custom daily limit for a user
        fn set_daily_limit(ref self: ContractState, user: ContractAddress, limit: u256) {
            self.assert_only_owner();
            assert(!user.is_zero(), 'Invalid user address');
            
            self.custom_daily_limits.write(user, limit);
            self.emit(DailyLimitUpdated { user, new_limit: limit });
        }
        
        /// Pause the contract in emergency
        fn pause(ref self: ContractState) {
            self.assert_only_owner();
            self.paused.write(true);
            self.emit(ContractPaused {});
        }
        
        /// Unpause the contract
        fn unpause(ref self: ContractState) {
            self.assert_only_owner();
            self.paused.write(false);
            self.emit(ContractUnpaused {});
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