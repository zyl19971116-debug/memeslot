# MEME SLOT

MEME SLOT keeps AI generation offchain and uses Robinhood Chain for wallet identity, ERC-721 ownership, mint records, provenance, and collection ownership.

> **UNAUDITED SOFTWARE.** The V1 contract has not received an independent security audit. Test on testnet before considering mainnet.

## Web3 setup

Copy `.env.example` to `.env.local` and fill values locally. Never expose a deployer private key in chat, source control, or any `NEXT_PUBLIC_` variable.

```env
FAL_KEY=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_ROBINHOOD_RPC_URL=
ROBINHOOD_RPC_URL=
DEPLOYER_PRIVATE_KEY=
NEXT_PUBLIC_MEME_SLOT_CONTRACT_ADDRESS=
```

`NEXT_PUBLIC_ROBINHOOD_RPC_URL` falls back to the official public mainnet RPC. WalletConnect requires a WalletConnect Cloud project ID.

Permanent storage is intentionally an adapter boundary in `src/lib/storage/permanent.ts`. Until a real decentralized provider is implemented, `/api/v2/publish-meme` stops before any wallet transaction and reports `STORAGE_NOT_CONFIGURED`; temporary fal.ai URLs are never minted. The V2 route prepares permanent image and metadata URIs, while the connected wallet submits the existing `mintMeme` ERC-721 contract call on Robinhood Chain mainnet (chain ID 4663).

## Robinhood testnet (first)

- Chain ID: `46630`
- RPC: `https://rpc.testnet.chain.robinhood.com`
- Explorer: `https://explorer.testnet.chain.robinhood.com`

```bash
npm run contracts:compile
npm run contracts:test
npm run deploy:robinhood:testnet
```

The deployment command runs only when explicitly invoked and writes `deployment/robinhood-testnet.json`. Put its address in `NEXT_PUBLIC_MEME_SLOT_CONTRACT_ADDRESS`, restart Next.js, configure permanent storage, then test.

## Robinhood mainnet

- Chain ID: `4663` (`0x1237`)
- Currency: ETH
- RPC: `https://rpc.mainnet.chain.robinhood.com`
- Explorer: `https://robinhoodchain.blockscout.com`

Only after every checklist item below passes:

```bash
npm run deploy:robinhood
```

## WalletConnect setup

Create a project in WalletConnect Cloud and set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. RainbowKit provides injected wallet, Coinbase Wallet, and WalletConnect paths; compatible Robinhood Wallet connections use those standard EVM paths.

## Contract test

```bash
npm run contracts:compile
npm run contracts:test
```

Tests cover minting, ownership, URI/data persistence, the event, duplicate rejection, multiple users/tokens, and transfers.

## Contract deploy

The deploy script prints network, chain ID, deployer address, ETH balance, and contract name before submitting. It never runs automatically.

```bash
npm run deploy:robinhood:testnet
npm run deploy:robinhood
```

## Contract verify

Replace the address with the matching deployment record:

```bash
npx hardhat verify --network robinhoodTestnet <CONTRACT_ADDRESS>
npx hardhat verify --network robinhood <CONTRACT_ADDRESS>
```

## Frontend contract address

Set `NEXT_PUBLIC_MEME_SLOT_CONTRACT_ADDRESS`, then restart the app. Address and ABI are centralized in `src/lib/contracts/memeSlot.ts`.

## Test mint

1. Configure WalletConnect and a permanent decentralized-storage adapter.
2. Deploy to testnet and set the frontend contract address.
3. Generate an AI meme, connect, switch networks, and choose **MINT MEME**.
4. Confirm permanent metadata/image resolution, collection ownership, and explorer links.

## Mainnet checklist

- [ ] Contract compilation and tests pass.
- [ ] Testnet deployment and mint succeed.
- [ ] Wallet connect, disconnect, and switching work.
- [ ] Image and metadata URIs resolve permanently.
- [ ] Onchain collection ownership works after mint and transfer.
- [ ] Explorer link works.
- [ ] Frontend address matches the deployment and chain.
- [ ] No keys or secrets are committed or browser-exposed.
- [ ] Production typecheck and build pass.
- [ ] Audit status remains clearly disclosed.
