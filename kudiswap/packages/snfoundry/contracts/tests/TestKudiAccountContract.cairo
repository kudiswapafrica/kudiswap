#[cfg(test)]
mod tests {
    use super::{
        IAccountDispatcher, IAccountDispatcherTrait, 
        IGuardianRecoveryDispatcher, IGuardianRecoveryDispatcherTrait
    };
    use starknet::{
        ContractAddress, contract_address_const, contract_address_from_felt,
        SyscallResultTrait, get_contract_address
    };
    use core::array::ArrayTrait;
    use core::ecdsa::sign;
    use core::felt252::new;
    use core::traits::{Into, TryInto};
    use starknet::account::Call;

    #[test]
    #[available_gas(2000000000)]
    fn test_initialization() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        
        assert(dispatcher.get_public_key() == public_key, 'Incorrect public key');
        assert(dispatcher.get_user_id() == user_id, 'Incorrect user ID');
        assert(dispatcher.get_nonce() == 0, 'Nonce should start at 0');
        assert(dispatcher.get_guardian().is_zero(), 'Guardian should be unset');
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_update_public_key() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        
        // Only self can update public key - this should fail
        let mut mock_caller = 123;
        let result = dispatcher.update_public_key(54321);
        assert(result.is_err(), 'Should fail when not called by self');

        // TODO: Need to mock self-call to properly test this
        // For now, we'll skip the successful case as it requires more complex setup
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_set_guardian() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        let guardian_dispatcher = IGuardianRecoveryDispatcher { contract_address: get_contract_address() };
        
        let new_guardian = contract_address_from_felt(98765);
        
        // Only self can set guardian - this should fail
        let result = dispatcher.set_guardian(new_guardian);
        assert(result.is_err(), 'Should fail when not called by self');

        // TODO: Need to mock self-call to properly test this
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_execute_meta_transaction() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        
        // Create a mock call
        let mut calls = ArrayTrait::new();
        let mock_call = Call {
            to: contract_address_from_felt(11111),
            selector: 22222,
            calldata: array![33333, 44444].span()
        };
        calls.append(mock_call);
        
        let nonce = 0;
        
        // Create a mock signature (in reality this would be properly signed)
        let mut signature = ArrayTrait::new();
        signature.append(55555); // r
        signature.append(66666); // s
        
        // This will fail because the signature is invalid
        let result = dispatcher.execute_meta_transaction(calls, signature, nonce);
        assert(result.is_err(), 'Should fail with invalid signature');
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_recover_account() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        let guardian_dispatcher = IGuardianRecoveryDispatcher { contract_address: get_contract_address() };
        
        let new_public_key = 54321;
        let mut guardian_signature = ArrayTrait::new();
        guardian_signature.append(77777); // r
        guardian_signature.append(88888); // s
        
        // This will fail because guardian is not set
        let result = guardian_dispatcher.recover_account(new_public_key, guardian_signature);
        assert(result.is_err(), 'Should fail when guardian not set');

        // TODO: Need to set guardian first and test successful recovery
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_nonce_increment() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        
        assert(dispatcher.get_nonce() == 0, 'Initial nonce should be 0');
        
        // TODO: After executing a transaction, nonce should increment
        // Need to implement successful transaction execution first
    }

    #[test]
    #[available_gas(2000000000)]
    fn test_signature_validation() {
        let public_key = 12345;
        let user_id = 67890;
        let contract = KudiAccount::unsafe_new_contract_state();
        KudiAccount::constructor(ref contract, public_key, user_id);

        let dispatcher = IAccountDispatcher { contract_address: get_contract_address() };
        
        // TODO: Need to implement proper signature generation and validation tests
        // This would involve:
        // 1. Creating a valid message hash
        // 2. Generating a proper ECDSA signature with the private key
        // 3. Verifying it works with the contract's public key
    }
}