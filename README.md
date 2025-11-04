# VeilGuard Wave 2 - Private Invoice Payments on Polygon

**Privacy-focused blockchain invoicing with ERC-5564 stealth addresses and USDC payments.**

## 🎯 Project Overview

VeilGuard enables merchants to create invoices with one-time stealth addresses, ensuring payment privacy on Polygon blockchain. Wave 2 delivers the complete invoice flow with payment detection and verified smart contracts.

**Status**: Wave 2 Implementation (Nov 4-18, 2025)

## 🏗️ Architecture

```
VeilGuard/
├── contracts/        # Hardhat + Solidity smart contracts
│   ├── InvoiceRegistry.sol   # Invoice creation & payment tracking
│   ├── StealthHelper.sol     # ERC-5564 announcement events
│   ├── ReceiptStore.sol      # Receipt hash storage
│   └── TestUSDC.sol          # Amoy testnet token (6 decimals)
├── web/             # Vite + React + TypeScript frontend
├── shared/abi/      # Exported contract ABIs
└── scripts/         # Deployment & utility scripts
```

## 🌐 Networks

| Network             | Chain ID | RPC                                 | USDC Address                                          |
| ------------------- | -------- | ----------------------------------- | ----------------------------------------------------- |
| **Polygon Mainnet** | 137      | https://polygon-rpc.com             | `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (native) |
|                     |          |                                     | `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174` (USDC.e) |
| **Amoy Testnet**    | 80002    | https://rpc-amoy.polygon.technology | TestUSDC (deployed)                                   |

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ and npm
- MetaMask or WalletConnect-compatible wallet
- MATIC for gas (faucet: https://faucet.polygon.technology)

### Contracts Setup

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your PRIVATE_KEY and POLYGONSCAN_API_KEY
npm run compile
npm run deploy:amoy
npm run verify:amoy
```

### Web Setup

```bash
cd web
npm install
cp .env.example .env.local
# Edit .env.local with deployed contract addresses
npm run dev
```

## 📋 User Flow

1. **Merchant** connects wallet and creates invoice (amount, token, memo)
2. **System** generates ERC-5564 stealth address
3. **System** calls `StealthHelper.announce()` → `InvoiceRegistry.createInvoice()`
4. **Customer** scans QR code and sends USDC to stealth address
5. **System** watches USDC Transfer events and detects payment
6. **Merchant** calls `InvoiceRegistry.markPaid()` to finalize
7. **Dashboard** updates stats with confetti animation 🎉

## 📜 Smart Contracts

### Deployed Addresses

**Polygon Mainnet (137):**

- InvoiceRegistry: `TBD`
- StealthHelper: `TBD`
- ReceiptStore: `TBD`

**Amoy Testnet (80002):**

- InvoiceRegistry: `TBD`
- StealthHelper: `TBD`
- ReceiptStore: `TBD`
- TestUSDC: `TBD`

> Addresses will be updated after deployment and verification

### Contract ABIs

Exported ABIs are available in `shared/abi/` after compilation.

## 🔧 Development Scripts

### Contracts

```bash
npm run compile          # Compile Solidity contracts
npm run test            # Run contract tests
npm run deploy:amoy     # Deploy to Amoy testnet
npm run deploy:polygon  # Deploy to Polygon mainnet
npm run verify:amoy     # Verify on Amoy
npm run verify:polygon  # Verify on Polygon
```

### Web

```bash
npm run dev            # Start dev server (http://localhost:5173)
npm run build          # Production build
npm run preview        # Preview production build
npm run lint           # ESLint check
```

## 🔐 Security

**CRITICAL**: Never commit secrets to the repository.

- Contract private keys → `contracts/.env` (gitignored)
- API keys → `contracts/.env` (gitignored)
- Web environment variables → `web/.env.local` (gitignored)
- Only commit `.env.example` templates with dummy values

## 🛠️ Tech Stack

**Contracts:**

- Solidity 0.8.24
- Hardhat
- OpenZeppelin Contracts
- Ethers.js

**Frontend:**

- React 18 + TypeScript
- Vite
- Wagmi v2 + Viem
- TailwindCSS + Radix UI
- Zustand (state management)

## 📚 Resources

- [Polygon Developer Docs](https://docs.polygon.technology/)
- [ERC-5564 Stealth Addresses](https://eips.ethereum.org/EIPS/eip-5564)
- [Polygon Faucet](https://faucet.polygon.technology)
- [PolygonScan](https://polygonscan.com)
- [Amoy Testnet Explorer](https://amoy.polygonscan.com)

## 🗺️ Roadmap

- ✅ **Wave 1**: Project planning & architecture
- 🚧 **Wave 2**: Core contracts + payment detection (Nov 4-18, 2025)
- 📅 **Wave 3**: Cross-chain support (BASE, Arbitrum)
- 📅 **Wave 4**: zk-SNARK receipts
- 📅 **Wave 5**: Recurring invoices & subscriptions
- 📅 **Wave 10**: Enterprise API & SDKs

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Wave 2 is in active development. Issues and PRs welcome after initial deployment.

---

**Built with 💚 for Polygon Buildathon 2025**
