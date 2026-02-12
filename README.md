# 🛡️ VeilGuard — Private Payments & Invoicing on Polygon

**Privacy-first invoicing, escrow, and POS payments on Polygon with ERC-5564 stealth addresses, cryptographic receipts, and trustless escrow.**

[![Live App](https://img.shields.io/badge/App-Live-success)](https://veil-guard.vercel.app)
[![Polygon Mainnet](https://img.shields.io/badge/Network-Polygon%20137-8247E5)](https://polygonscan.com)
[![Wave](https://img.shields.io/badge/Wave-5-purple)]()
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://react.dev)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Deployment](#-live-deployment)
- [Smart Contracts](#-smart-contracts)
- [Features](#-features)
- [Pages & Routes](#-pages--routes)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [License](#-license)

---

## 🎯 Overview

VeilGuard enables merchants and freelancers to receive crypto payments without exposing their transaction history. Each invoice generates a **unique stealth address** using the **ERC-5564 standard**, making payments unlinkable and private while maintaining full on-chain verifiability.

### Why VeilGuard?

| Feature | Description |
|---------|-------------|
| 🔐 **True Privacy** | Cryptographically unlinkable addresses via ERC-5564 |
| 🔑 **Self-Custodial** | Full user control, no intermediaries |
| 📜 **Verifiable Receipts** | On-chain cryptographic proof of payment |
| 🤝 **Trustless Escrow** | On-chain escrow with release, refund & dispute |
| 💳 **POS Terminal** | Point-of-sale with QR codes & share links |
| 💱 **Fiat On-Ramp** | Buy crypto via MoonPay, Coinbase, Binance |
| 🪙 **10+ Tokens** | USDC, USDC.e, USDT, DAI, WETH, WPOL, BRZ, EUROC, CADC, XSGD |
| ⚡ **Low Cost** | ~$0.006 per transaction on Polygon |
| 💰 **Yield** | Earn APY on idle funds via Aave V3 routing |
| 📊 **Analytics** | Revenue charts, payment trends, token breakdown |

---

## 🚀 Live Deployment

- **App:** [https://veil-guard.vercel.app](https://veil-guard.vercel.app)
- **GitHub:** [https://github.com/mohamedwael201193/VeilGuard](https://github.com/mohamedwael201193/VeilGuard)
- **Network:** Polygon Mainnet (Chain ID: 137)

---

## 📄 Smart Contracts (Polygon Mainnet — Chain 137)

All contracts are deployed on Polygon Mainnet:

| Contract | Address | Purpose |
|----------|---------|---------|
| **InvoiceRegistry** | [`0x241D6923036aD1888734ca6C0E5DEdDC044CF1FC`](https://polygonscan.com/address/0x241D6923036aD1888734ca6C0E5DEdDC044CF1FC) | Invoice creation, status tracking, batch operations |
| **StealthHelper** | [`0x25A435D4bfF2729639C2937854372Ba099F4bf42`](https://polygonscan.com/address/0x25A435D4bfF2729639C2937854372Ba099F4bf42) | ERC-5564 stealth address announcements |
| **ReceiptStore** | [`0x24DcE95d6DcC3101256B787a6c19569672260B5E`](https://polygonscan.com/address/0x24DcE95d6DcC3101256B787a6c19569672260B5E) | On-chain cryptographic payment receipts |
| **VeilEscrow** | [`0x4675f8567d1D6236F76Fe48De2450D5599156af1`](https://polygonscan.com/address/0x4675f8567d1D6236F76Fe48De2450D5599156af1) | Trustless escrow with release/refund/dispute |

### Contract Details

#### InvoiceRegistry.sol
- `createInvoice()` — Create an invoice with stealth address, token, amount, memo
- `markPaid()` — Mark invoice as paid with tx hash
- `cancelInvoice()` — Cancel an active invoice
- `batchCreateInvoices()` — Create multiple invoices in one transaction
- `batchMarkPaid()` — Mark multiple invoices paid at once
- Events: `InvoiceCreated`, `InvoicePaid`, `InvoiceCancelled`

#### StealthHelper.sol
- `announce()` — Announce stealth address with ephemeral public key
- Event: `Announcement` (ERC-5564 compliant)

#### ReceiptStore.sol
- `storeReceipt()` — Store cryptographic receipt hash on-chain
- `verifyReceipt()` — Verify a receipt's existence and validity

#### VeilEscrow.sol
- `createEscrow(seller, token, amount, deadline, description)` — Buyer deposits tokens
- `release(escrowId)` — Buyer releases funds to seller
- `refund(escrowId)` — Buyer reclaims funds
- `dispute(escrowId)` — Buyer flags escrow as disputed
- `claimExpired(escrowId)` — Seller claims after deadline passes
- Events: `EscrowCreated`, `EscrowReleased`, `EscrowRefunded`, `EscrowDisputed`

---

## ✨ Features

### Wave 1-2 — Core Privacy Invoicing
- ERC-5564 stealth address generation (secp256k1)
- Invoice creation with encrypted memos
- Stealth payment flow with gas funding
- On-chain receipt storage & verification
- Zustand state management with persistence

### Wave 3 — Multi-Token & Production
- 10+ token support across Polygon mainnet
- Token selector with @web3icons/react icons
- Smart gas manager (optimal POL funding)
- Network switcher (Amoy testnet + Polygon mainnet)
- Batch invoice operations (create & mark paid)

### Wave 5 — Payments Infrastructure
- **POS Terminal** — Amount input, QR generation, payment detection, transaction history
- **Trustless Escrow** — Full on-chain escrow lifecycle (create → release/refund/dispute)
- **Fiat On-Ramp** — Multi-provider selector (MoonPay, Coinbase, Binance, ChangeNOW)
- **Payment Sharing** — WhatsApp, Telegram, Email, Web Share API
- **Analytics Dashboard** — Revenue trends, token breakdown, payment charts
- **Payment Watcher** — Real-time on-chain payment detection
- **Yield Routing** — Aave V3 integration for idle fund APY
- **AI Invoice Intelligence** — Smart categorization & insights
- **Name Resolver** — ENS/Unstoppable Domains support
- **Cross-Chain Prep** — Chainlink CCIP framework
- **Gasless Transactions** — Meta-transaction relay framework
- **Encrypted Memos** — AES-GCM encrypted invoice descriptions
- **EIP-681 Payment URIs** — QR-compatible payment links

---

## 🗺️ Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page with feature showcase |
| `/dashboard` | Dashboard | Invoice management, create/view/cancel invoices |
| `/invoice/new` | NewInvoice | Create new invoice with stealth address |
| `/invoice/:id` | InvoiceView | View invoice details, mark as paid |
| `/pay/:invoiceId` | PayInvoice | Pay an invoice (stealth payment flow) |
| `/pos` | POS | Point-of-sale terminal with QR codes |
| `/pay/pos` | POSPay | Pay via POS shared link |
| `/escrow` | Escrow | Create and manage trustless escrows |
| `/receipts` | Receipts | View and manage payment receipts |
| `/verify` | VerifyReceipt | Verify on-chain receipt authenticity |
| `/inbox` | Inbox | Stealth address inbox scanner |
| `/analytics` | Analytics | Revenue analytics and payment trends |
| `/features` | ProFeatures | Feature showcase (Wave 5, AI, Agents, etc.) |
| `/security` | Security | Security architecture documentation |
| `/legal` | Legal | Terms of service and privacy policy |

---

## 🏗️ Architecture

```
VeilGuard/
├── contracts/                    # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── InvoiceRegistry.sol   # Invoice lifecycle management
│   │   ├── ReceiptStore.sol      # Cryptographic receipt storage
│   │   ├── StealthHelper.sol     # ERC-5564 announcements
│   │   ├── VeilEscrow.sol        # Trustless escrow system
│   │   └── TestUSDC.sol          # Test token (testnet only)
│   └── scripts/                  # Deployment scripts
├── shared/abi/                   # Shared ABI files
├── web/                          # React frontend (Vite + TypeScript)
│   └── src/
│       ├── abi/                  # Contract ABIs
│       ├── components/           # UI components
│       │   ├── ConnectButton     # WalletConnect integration
│       │   ├── TokenSelector     # Multi-token dropdown
│       │   ├── FiatOnRamp        # Fiat on-ramp modal
│       │   ├── SharePaymentLink  # Social sharing
│       │   ├── NetworkSwitcher   # Chain selector
│       │   └── ui/               # shadcn/ui primitives
│       ├── config/               # Contract addresses config
│       ├── hooks/                # Custom React hooks
│       ├── lib/                  # Core business logic
│       │   ├── stealth.ts        # ERC-5564 stealth logic
│       │   ├── contracts.ts      # Chain & token configs
│       │   ├── receipts.ts       # Receipt operations
│       │   ├── scanner.ts        # Inbox stealth scanner
│       │   ├── eip681.ts         # Payment URI generation
│       │   ├── yieldManager.ts   # Aave V3 yield routing
│       │   ├── gasManager.ts     # Smart gas funding
│       │   ├── analytics.ts      # Analytics engine
│       │   ├── encryptedMemo.ts  # AES-GCM encryption
│       │   └── ...               # More utilities
│       ├── pages/                # Route pages (16 pages)
│       ├── store/                # Zustand state store
│       └── types/                # TypeScript types
└── scripts/                      # Build utilities
```

---

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** 0.8.24
- **Hardhat** — Compilation, deployment, testing
- **OpenZeppelin** — SafeERC20, ReentrancyGuard

### Frontend
- **React** 18 + **TypeScript**
- **Vite** 5 — Build tooling (port 8080)
- **wagmi** v2 + **viem** v2 — Web3 interactions
- **WalletConnect** v2 — Wallet connectivity
- **shadcn/ui** + **Tailwind CSS** 3.4 — UI framework
- **Framer Motion** 12 — Animations
- **Zustand** 5 — State management
- **Sonner** — Toast notifications
- **@noble/curves** — ERC-5564 cryptography
- **@web3icons/react** — Token icons
- **canvas-confetti** — Celebration effects

### Infrastructure
- **Polygon Mainnet** (Chain 137) — Primary network
- **Alchemy** — RPC provider
- **Vercel** — Frontend hosting
- **Aave V3** — Yield routing

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A Polygon-compatible wallet (MetaMask, etc.)

### 1. Clone & Install

```bash
git clone https://github.com/mohamedwael201193/VeilGuard.git
cd VeilGuard

# Install contract dependencies
cd contracts && npm install

# Install web dependencies
cd ../web && npm install
```

### 2. Environment Setup

```bash
# Contracts
cp contracts/.env.example contracts/.env
# Add: PRIVATE_KEY, POLYGON_RPC_URL, POLYGONSCAN_API_KEY

# Web
cp web/.env.example web/.env.local
# Add: VITE_WALLETCONNECT_PROJECT_ID, VITE_ALCHEMY_API_KEY, contract addresses
```

### 3. Run Development Server

```bash
cd web
npm run dev
# Opens at http://localhost:8080
```

### 4. Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### 5. Deploy Contracts

```bash
# Polygon Mainnet
npx hardhat run --network polygon scripts/deploy.js

# Escrow
npx hardhat run --network polygon scripts/deployEscrow.js
```

---

## 🔒 Environment Variables

### contracts/.env
```
PRIVATE_KEY=           # Deployer private key
POLYGON_RPC_URL=       # Alchemy/Infura Polygon RPC
POLYGONSCAN_API_KEY=   # For contract verification
```

### web/.env.local
```
VITE_CHAIN_DEFAULT=137
VITE_WALLETCONNECT_PROJECT_ID=
VITE_ALCHEMY_API_KEY=
VITE_STEALTH_MODE=spec
VITE_INVOICE_REGISTRY_137=0x241D6923036aD1888734ca6C0E5DEdDC044CF1FC
VITE_STEALTH_HELPER_137=0x25A435D4bfF2729639C2937854372Ba099F4bf42
VITE_RECEIPT_STORE_137=0x24DcE95d6DcC3101256B787a6c19569672260B5E
VITE_ESCROW_137=0x4675f8567d1D6236F76Fe48De2450D5599156af1
```

---

## 📜 License

MIT — Built for the Polygon ecosystem.
