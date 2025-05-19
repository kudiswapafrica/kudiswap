use starknet::{ContractAddress, ClassHash};

#[starknet::interface]
trait IWalletFactory <TContractState>{
    /// Create a new wallet for a user
    fn create_wallet(
        ref self: TContractState, 
        public_key: felt252, 
        user_id: felt252
    ) -> ContractAddress;
    
    /// Get the wallet address for a specific user
    fn get_wallet_address(self: @TContractState, user_id: felt252) -> ContractAddress;
    
    /// Check if a wallet exists for a specific user
    fn wallet_exists(self: @TContractState, user_id: felt252) -> bool;
    
    /// Return the class hash of account implementation
    fn get_account_class_hash(self: @TContractState) -> ClassHash;
    
    /// Update the class hash for future deployments
    fn update_account_class_hash(ref self: TContractState, new_class_hash: ClassHash);
}

#[starknet::contract]
mod KudiWalletFactory {
    use starknet::{
        ContractAddress, 
        syscalls::deploy_syscall, 
        ClassHash,
        get_caller_address
    };
    use core::array::ArrayTrait;
    use core::num::traits::Zero;
    use starknet::storage::{
        Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    
    // Default salt value for address calculation
    const DEFAULT_SALT: felt252 = 0;

    #[storage]
    struct Storage {
        // Mapping of user identifiers to their wallet addresses
        wallets: Map<felt252, ContractAddress>,
        // Class hash of the account implementation
        account_class_hash: ClassHash,
        // Owner of the factory contract
        owner: ContractAddress,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        WalletCreated: WalletCreated,
        ClassHashUpdated: ClassHashUpdated,
        OwnershipTransferred: OwnershipTransferred,
    }

    #[derive(Drop, starknet::Event)]
    struct WalletCreated {
        user_id: felt252,
        wallet_address: ContractAddress,
        deployer: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct ClassHashUpdated {
        old_class_hash: ClassHash,
        new_class_hash: ClassHash
    }

    #[derive(Drop, starknet::Event)]
    struct OwnershipTransferred {
        previous_owner: ContractAddress,
        new_owner: ContractAddress
    }

    #[constructor]
    fn constructor(ref self: ContractState, account_class_hash: ClassHash, owner: ContractAddress) {
        self.account_class_hash.write(account_class_hash);
        self.owner.write(owner);
    }

    #[abi(embed_v0)]
    impl WalletFactoryImpl of super::IWalletFactory<ContractState> {
        /// Create a new wallet for a user
        fn create_wallet(
            ref self: ContractState, 
            public_key: felt252, 
            user_id: felt252
        ) -> ContractAddress {
            // Check if wallet already exists
            let existing_wallet = self.wallets.read(user_id);
            if !existing_wallet.is_zero() {
                return existing_wallet;
            }
            
            // Prepare constructor calldata for the account
            let mut constructor_calldata = ArrayTrait::new();
            constructor_calldata.append(public_key);
            constructor_calldata.append(user_id);
            
            // Calculate a unique salt for the deployment
            // The salt is derived from the user_id for uniqueness
            let salt = user_id;
            
            // Deploy the account contract
            let class_hash = self.account_class_hash.read();
            let (wallet_address, _) = deploy_syscall(
                class_hash,
                salt,
                constructor_calldata.span(),
                false
            ).unwrap();
            
            // Store the mapping of user_id to wallet_address
            self.wallets.write(user_id, wallet_address);
            
            // Emit wallet creation event
            let deployer = get_caller_address();
            self.emit(WalletCreated { user_id, wallet_address, deployer });
            
            wallet_address
        }
        
        /// Get the wallet address for a specific user
        fn get_wallet_address(self: @ContractState, user_id: felt252) -> ContractAddress {
            self.wallets.read(user_id)
        }
        
        /// Check if a wallet exists for a specific user
        fn wallet_exists(self: @ContractState, user_id: felt252) -> bool {
            let wallet_address = self.wallets.read(user_id);
            !wallet_address.is_zero()
        }
        
        /// Return the class hash of account implementation
        fn get_account_class_hash(self: @ContractState) -> ClassHash {
            self.account_class_hash.read()
        }
        
        /// Update the class hash for future deployments
        fn update_account_class_hash(ref self: ContractState, new_class_hash: ClassHash) {
            // Only the owner can update the class hash
            self.assert_only_owner();
            
            let old_class_hash = self.account_class_hash.read();
            self.account_class_hash.write(new_class_hash);
            
            self.emit(ClassHashUpdated { old_class_hash, new_class_hash });
        }
    }

    #[generate_trait]
    impl OwnershipImpl of IOwnership {
        /// Transfer ownership of the factory contract
        fn transfer_ownership(ref self: ContractState, new_owner: ContractAddress) {
            self.assert_only_owner();
            assert(!new_owner.is_zero(), 'New owner cannot be zero');
            
            let previous_owner = self.owner.read();
            self.owner.write(new_owner);
            
            self.emit(OwnershipTransferred { previous_owner, new_owner });
        }
        
        /// Get the current owner of the factory contract
        fn get_owner(self: @ContractState) -> ContractAddress {
            self.owner.read()
        }
    }

    #[generate_trait]
    impl InternalFunctions of InternalFunctionsTrait {
        /// Check if the caller is the owner of the factory contract
        fn assert_only_owner(self: @ContractState) {
            let caller = get_caller_address();
            let owner = self.owner.read();
            assert(caller == owner, 'Only owner can call');
        }
    }
}