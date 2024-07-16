# QuoteSphere: Decentralized Quote Sharing Platform

QuoteSphere is a decentralized application (dApp) built on the Aptos blockchain that allows users to share, discover, and interact with quotes in a secure and transparent manner.

## Project Purpose

The primary purpose of QuoteSphere is to create a decentralized platform where users can:
- Share their favorite quotes
- Discover quotes from others
- Interact with quotes through likes
- Maintain ownership and control over their shared content

## Key Features

- **Quote Creation**: Users can add custom quotes or fetch random quotes from an external API
- **Quote Storage**: All quotes are stored on the Aptos blockchain
- **Like System**: Users can like/unlike quotes, with the data stored on-chain
- **Search Functionality**: Search for quotes by user address
- **Wallet Integration**: Seamless integration with Aptos wallets (in this case Petra Wallet) for user authentication
- **Decentralized Ownership**: Each user owns their quotes on the blockchain

## Tech Stack

- **Blockchain**: Aptos
- **Smart Contract Language**: Move
- **Frontend Framework**: React
- **State Management**: React Context API
- **Wallet Integration**: @aptos-labs/wallet-adapter-react
- **UI Components**: Ant Design (antd)
- **Network Interaction**: Aptos SDK (Provider, Types)
- **External API**: quotable.io (for random quotes)

## Smart Contract Overview

The Move smart contract (`Quotes.move`) provides the following functionality:
- Initialize the quote system for a user
- Add new quotes
- Toggle likes on quotes
- Retrieve quotes for a specific address
- Search quotes by address

## Frontend Overview

The React frontend (`QuoteProvider.tsx`) offers:
- Context for managing global state
- Functions to interact with the smart contract
- User interface for adding, viewing, and interacting with quotes

## Getting Started

### Smart Contract Deployment

1. Install the Aptos CLI following the [official documentation](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli).
2. Generate your module address and initialize your account:
   ```
   aptos init
   ```
   Choose `testnet` when prompted.
3. Compile the Move module:
   ```
   aptos move compile
   ```
4. Publish the module:
   ```
   aptos move publish
   ```
   Confirm the transaction when prompted.
5. Note the account address output during initialization. You'll use this as your `REACT_APP_MODULE_ADDRESS` and `my_addr`.

### Frontend Setup

1. Clone the repository and install dependencies:
   ```
   git clone <repository-url>
   cd <repository-name>
   npm install
   ```
2. Create a `.env` file in the project root:
   ```
   REACT_APP_MODULE_ADDRESS=<your-account-address>
   ```
3. Set up your Aptos wallet (Petra) and connect to the Testnet.
4. Run the application:
   ```
   npm run start
   ```

Your dApp is now connected to your deployed smart contract on the Aptos testnet.

## Usage

- Connect your Aptos wallet to the dApp
- Add custom quotes or fetch random ones
- View quotes from other users
- Like/unlike quotes
- Search for quotes by user address

## License

[MIT License](LICENSE)
