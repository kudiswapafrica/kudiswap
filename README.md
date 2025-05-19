# kudiSwap - USSD-Based Starknet wallet

### USSD Crypto Wallet System Architecture (Text Diagram)
```rust

[User Phone (USSD)] 
    |
    v
[USSD Gateway (Africa's Talking)]
    |
    v
[Backend Server (Node.js + Express)]
    |    |    |
    |    |    +--> [Postgres (User Data Storage)]
    |    |
    |    +--> [Relayer Service (StarkNet Transactions)]
    |    |
    |    +--> [Mobile Money API (MOMO)]
    |
    v
[Custom Wallet API]
    |
    v
[StarkNet Blockchain]


```
# KudiSwap Smart Contracts

This project contains the Cairo 2.0 smart contracts for the KudiSwap platform on StarkNet.

## Overview

KudiSwap is a USSD-Based DeFi platform built on StarkNet that provides the following features:
- Account Abstraction for better user experience
- ERC20 token transfers and approvals
- DEX integration for token swaps
- Meta-transaction support for gasless transactions
- Factory pattern for wallet creation

## Architecture

The project consists of the following main contracts:

### KudiAccount
An account abstraction contract that serves as a smart contract wallet for users. It supports:
- ECDSA signature verification
- Transaction batching
- Guardian-based recovery
- Meta-transaction execution

### KudiWalletFactory
A factory contract that deploys KudiAccount instances for users. Each account is linked to a user identifier (e.g., hashed phone number).

### KudiDexInterface
A contract that interfaces with external DEXes (e.g., Ekudo, JediSwap) to facilitate token swaps.

### KudiTokenManager
A contract that manages ERC20 token interactions, including transfers and approvals.

### KudiMetaTransactionRelayer
A contract that helps execute meta-transactions on behalf of users, enabling gasless transactions.

### KudiSecurityModule
A security module that implements safety measures like transaction limits and daily limits.

## Security Features

The contracts implement several security features:
- Reentrancy protection
- Input validation
- Transaction limits
- Daily spending limits
- Emergency pause functionality

## Gas Optimization

The contracts are optimized for gas efficiency through:
- Minimizing storage operations
- Efficient data structures
- Avoiding unnecessary computations

## Extensibility

The system is designed to be modular and extensible to support future DeFi primitives like:
- Staking
- Lending
- Yield farming
- Additional security features

## Testing

The contracts include comprehensive tests in the `integration_tests` directory.


# StarkNet Contract Deployment Guide for KudiSwap

## Prerequisites

Before deployment, ensure you have:

1. A StarkNet wallet with sufficient ETH for transaction fees
2. The Starknet CLI or SDK installed (starknet-py, starkli, or similar)
3. Cairo 2.0 compiler installed

## Deployment Steps

### 1. Compile the Cairo Contracts

First, compile all your Cairo files to generate Sierra and CASM files:

```bash
scarb build
```

This will output compiled files in your `target` directory.

### 2. Deploy the Base Contracts

#### Step 1: Deploy the KudiAccount Implementation

First, declare the class hash for the KudiAccount:

```bash
starkli declare --account 0x04b3f4ba8c00a02b66142a4b1dd41a4dfab4f92650922a3280977b0f03c75ee1 target/release/contracts_KudiAccount.cpntarct_class.json
```

Save the resulting class hash, you'll need it later.

#### Step 2: Deploy the KudiWalletFactory

Deploy the factory contract using the account class hash from step 1:

```bash
starkli deploy \
  --class-hash <WALLET_FACTORY_CLASS_HASH> \
  --inputs <ACCOUNT_CLASS_HASH> <OWNER_ADDRESS>
```

- `WALLET_FACTORY_CLASS_HASH`: The class hash from declaring KudiWalletFactory
- `ACCOUNT_CLASS_HASH`: Class hash of the KudiAccount contract  
- `OWNER_ADDRESS`: Your wallet address that will own the factory

Save the factory contract address.

#### Step 3: Deploy the KudiTokenManager

```bash
starkli deploy \
  --class-hash <TOKEN_MANAGER_CLASS_HASH> \
  --inputs <OWNER_ADDRESS>
```

Save the token manager contract address.

#### Step 4: Deploy the KudiDexInterface

```bash
starkli deploy \
  --class-hash <DEX_INTERFACE_CLASS_HASH> \
  --inputs <OWNER_ADDRESS>
```

Save the DEX interface contract address.

#### Step 5: Deploy the KudiMetaTransactionRelayer

```bash
starkli deploy \
  --class-hash <META_TX_RELAYER_CLASS_HASH> \
  --inputs <OWNER_ADDRESS> <INITIAL_GAS_PRICE>
```

Where `INITIAL_GAS_PRICE` is a value like "1000000000" (wei).

Save the meta transaction relayer contract address.

#### Step 6: Deploy the KudiSecurityModule

```bash
starkli deploy \
  --class-hash <SECURITY_MODULE_CLASS_HASH> \
  --inputs <OWNER_ADDRESS>
```

Save the security module contract address.

### 3. Configure the Deployed Contracts

#### Step 1: Approve DEXes in the DEX Interface

```bash
starkli invoke \
  <DEX_INTERFACE_ADDRESS> approve_dex \
  <DEX_ADDRESS>
```

Repeat for each DEX you want to integrate with (like JediSwap).

#### Step 2: Add Tokens to the Token Manager

```bash
starkli invoke \
  <TOKEN_MANAGER_ADDRESS> add_token \
  <TOKEN_ADDRESS>
```

Repeat for each token you want to support.

#### Step 3: Add Relayers to Meta-Transaction System

```bash
starkli invoke \
  <META_TX_RELAYER_ADDRESS> add_relayer \
  <RELAYER_ADDRESS>
```

### 4. Create User Wallets

To create a wallet for a user:

```bash
starkli invoke \
  <WALLET_FACTORY_ADDRESS> create_wallet \
  <USER_PUBLIC_KEY> <USER_ID>
```

Where:
- `USER_PUBLIC_KEY`: The user's ECDSA public key in felt252 format
- `USER_ID`: A unique identifier for the user (can be a hashed phone number)

This will deploy a new KudiAccount instance for the user with the appropriate configuration.

### 5. Verify Deployment

To verify everything is deployed correctly:

1. Check if the wallet exists for a user:
```bash
starkli call \
  <WALLET_FACTORY_ADDRESS> wallet_exists \
  <USER_ID>
```

2. Get a user's wallet address:
```bash
starkli call \
  <WALLET_FACTORY_ADDRESS> get_wallet_address \
  <USER_ID>
```

3. Test a simple transaction through the user's wallet (requires signing):
```bash
# This would require signature generation off-chain
starkli invoke \
  <USER_WALLET_ADDRESS> execute_meta_transaction \
  <CALLS_ARRAY> <SIGNATURE_ARRAY> <NONCE>
```

## Important Notes

1. Always verify transaction success in a block explorer after each step
2. Transaction execution might require proper signature generation for account abstraction
3. For meta-transactions, you'll need to integrate with your frontend to handle signature creation
4. Gas costs on StarkNet can vary, so ensure your wallet has sufficient funds

Would you like more specific details on any of these steps or help with generating signatures for account abstraction operations?

I'll help you understand how to use the contract addresses after deployment by showing you the key endpoints of each contract in the KudiSwap system.

## Using Contract Addresses After Deployment

After deploying the KudiSwap contracts, you'll need to interact with various endpoints. Here's how to use each contract:

### 1. KudiWalletFactory

This is the first contract you'd interact with to create user wallets.

```cairo
// Create a new wallet for a user
fn create_wallet(ref self: TContractState, public_key: felt252, user_id: felt252) -> ContractAddress;

// Get the wallet address for a specific user
fn get_wallet_address(self: @TContractState, user_id: felt252) -> ContractAddress;

// Check if a wallet exists for a specific user
fn wallet_exists(self: @TContractState, user_id: felt252) -> bool;
```

Example usage:
```typescript
// JavaScript/TypeScript example using starknet.js
const walletFactory = new Contract(walletFactoryAbi, walletFactoryAddress, provider);

// Create a new wallet
const walletAddress = await walletFactory.create_wallet(userPublicKey, userId);

// Check if a wallet exists
const exists = await walletFactory.wallet_exists(userId);

// Get existing wallet address
const existingWallet = await walletFactory.get_wallet_address(userId);
```

### 2. KudiAccount (User Wallet)

After obtaining a user's wallet address, you interact with their wallet like this:

```cairo
// Execute transactions
fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>>;

// Update the public key
fn update_public_key(ref self: ContractState, new_public_key: felt252);

// Set a guardian for recovery
fn set_guardian(ref self: ContractState, new_guardian: ContractAddress);

// Execute meta-transactions (gasless)
fn execute_meta_transaction(
    ref self: ContractState, 
    calls: Array<Call>, 
    signature: Array<felt252>,
    nonce: u128
) -> Array<Span<felt252>>;

// Get wallet information
fn get_public_key(self: @ContractState) -> felt252;
fn get_nonce(self: @ContractState) -> u128;
fn get_user_id(self: @ContractState) -> felt252;
fn get_guardian(self: @ContractState) -> ContractAddress;
```

Example usage:
```typescript
// JavaScript/TypeScript example using starknet.js
const userWallet = new Contract(kudiAccountAbi, userWalletAddress, provider);

// Get wallet info
const publicKey = await userWallet.get_public_key();
const nonce = await userWallet.get_nonce();

// Update public key
await userWallet.update_public_key(newPublicKey);

// Set a guardian
await userWallet.set_guardian(guardianAddress);
```

### 3. KudiTokenManager

For token transfers and approvals:

```cairo
// Transfer tokens
fn transfer_tokens(
    ref self: ContractState,
    token_address: ContractAddress,
    recipient: ContractAddress,
    amount: u256
) -> bool;

// Get token balance
fn get_token_balance(
    self: @ContractState,
    token_address: ContractAddress,
    account: ContractAddress
) -> u256;

// Approve tokens
fn approve_tokens(
    ref self: ContractState,
    token_address: ContractAddress,
    spender: ContractAddress,
    amount: u256
) -> bool;

// Check if token is supported
fn is_token_supported(self: @ContractState, token_address: ContractAddress) -> bool;
```

Example usage:
```typescript
const tokenManager = new Contract(tokenManagerAbi, tokenManagerAddress, provider);

// Transfer tokens
await tokenManager.transfer_tokens(tokenAddress, recipientAddress, amount);

// Check balance
const balance = await tokenManager.get_token_balance(tokenAddress, userAddress);

// Approve tokens
await tokenManager.approve_tokens(tokenAddress, spenderAddress, amount);
```

### 4. KudiDexInterface

For swapping tokens:

```cairo
// Approve DEX to spend tokens
fn approve_dex(
    ref self: ContractState, 
    token_address: ContractAddress, 
    dex_address: ContractAddress, 
    amount: u256
) -> bool;

// Swap tokens
fn swap_tokens(
    ref self: ContractState,
    dex_address: ContractAddress,
    token_in: ContractAddress,
    token_out: ContractAddress,
    amount_in: u256,
    min_amount_out: u256
) -> u256;
```

Example usage:
```typescript
const dexInterface = new Contract(dexInterfaceAbi, dexInterfaceAddress, provider);

// Approve DEX
await dexInterface.approve_dex(tokenAddress, jediswapAddress, amount);

// Swap tokens
const amountReceived = await dexInterface.swap_tokens(
    jediswapAddress,
    tokenInAddress,
    tokenOutAddress,
    amountToSwap,
    minAmountOut
);
```

### 5. KudiMetaTransactionRelayer

For gasless transactions:

```cairo
// Execute meta-transaction
fn execute_meta_transaction(
    ref self: ContractState,
    user_wallet: ContractAddress,
    calls: Array<Call>,
    signature: Array<felt252>,
    user_nonce: u128
) -> Array<Span<felt252>>;

// Get current gas price
fn get_gas_price(self: @ContractState) -> u256;
```

Example usage:
```typescript
const relayer = new Contract(relayerAbi, relayerAddress, provider);

// Get current nonce from the user's wallet
const nonce = await userWallet.get_nonce();

// Create transaction calls
const calls = [...]; // Array of Call objects

// Sign the transaction (client-side)
const signature = await signTransaction(userPrivateKey, calls, nonce);

// Execute the transaction (by a relayer)
await relayer.execute_meta_transaction(
    userWalletAddress,
    calls,
    signature,
    nonce
);
```

### 6. KudiSecurityModule

For security checks:

```cairo
// Check transaction safety
fn check_transaction_safety(
    ref self: ContractState,
    user: ContractAddress,
    transaction_value: u256,
    timestamp: u64
) -> bool;

// Get transaction limits
fn get_transaction_limit(self: @ContractState, user: ContractAddress) -> u256;
fn get_daily_limit(self: @ContractState, user: ContractAddress) -> u256;
```

Example usage:
```typescript
const securityModule = new Contract(securityModuleAbi, securityModuleAddress, provider);

// Check if transaction is safe
const currentTimestamp = Math.floor(Date.now() / 1000);
const isSafe = await securityModule.check_transaction_safety(
    userWalletAddress,
    transactionValue,
    currentTimestamp
);

// Get user limits
const txLimit = await securityModule.get_transaction_limit(userWalletAddress);
const dailyLimit = await securityModule.get_daily_limit(userWalletAddress);
```

## Integration Flow Example

Here's a typical flow for a new user:

1. Create a wallet for the user:
   ```typescript
   const walletAddress = await walletFactory.create_wallet(userPublicKey, userId);
   ```

2. Transfer tokens to the user's wallet (can be done directly using ERC20 contracts)

3. User can now:
   - Transfer tokens: `tokenManager.transfer_tokens(...)`
   - Swap tokens: `dexInterface.swap_tokens(...)`
   - Use gasless transactions: `relayer.execute_meta_transaction(...)`

4. For wallet management:
   - Set a guardian: `userWallet.set_guardian(...)`
   - Update public key: `userWallet.update_public_key(...)`

This shows how all the contract addresses work together in a complete DeFi system, providing account abstraction, token management, DEX integration, and security features.