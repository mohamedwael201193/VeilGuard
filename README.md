# VeilGuard — Private Payment Infrastructure on Polygon

**9 smart contracts deployed on Polygon mainnet. ERC-5564 stealth addresses, trustless escrow, on-chain subscriptions, split payments, dispute resolution, and cryptographic receipts.**

[![Live App](https://img.shields.io/badge/App-Live-success)](https://veil-guard.vercel.app)
[![Polygon Mainnet](https://img.shields.io/badge/Network-Polygon%20137-8247E5)](https://polygonscan.com)
[![Contracts](https://img.shields.io/badge/Contracts-9%20Deployed-brightgreen)]()
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

VeilGuard is a privacy-first payment infrastructure protocol on Polygon. Every invoice generates a **unique one-time stealth address** using the **ERC-5564 standard** — payments are cryptographically unlinkable to the merchant's real address, while remaining fully verifiable on-chain.

9 smart contracts are live on Polygon mainnet covering the full payments stack: invoicing, receipts, escrow, subscriptions, split payments, batch transfers, dispute arbitration, and merchant registration.

### Why VeilGuard?

| Feature | Description |
|---------|-------------|
| 🔐 **Stealth Privacy** | One-time addresses via ERC-5564 — payments can't be linked to the merchant |
| 📜 **On-Chain Receipts** | `ReceiptStore` auto-stores a cryptographic receipt on every `markPaid` |
| 🤝 **Trustless Escrow** | Deposit → release / refund / dispute, fully on-chain |
| 🔄 **Subscriptions** | On-chain recurring billing with pause, resume, cancel |
| ✂️ **Split Pay** | Single-tx payment split to up to 50 recipients |
| ⚡ **Batch Transfers** | Up to 100 ERC-20 transfers in one transaction |
| 🏪 **Merchant Index** | On-chain merchant registry with invoice enumeration |
| ⚖️ **Disputes** | Evidence submission + arbitrator resolution with % splits |
| 🪙 **10+ Tokens** | USDC, USDC.e, USDT, DAI, WETH, WPOL, BRZ, EUROC, CADC, XSGD |
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
| **VeilSubscription** | [`0xc956722c004d8Be4B1482Faf99d95ad472F7BD5a`](https://polygonscan.com/address/0xc956722c004d8Be4B1482Faf99d95ad472F7BD5a) | Recurring subscription payments |
| **VeilSplitPay** | [`0x5195ED6bB28293080A430F1bE2f3965F0d8ad083`](https://polygonscan.com/address/0x5195ED6bB28293080A430F1bE2f3965F0d8ad083) | Multi-recipient payment splitting |
| **VeilBatchProcessor** | [`0x350AAB21f7644399235D8176E4ac8aB2CB58448b`](https://polygonscan.com/address/0x350AAB21f7644399235D8176E4ac8aB2CB58448b) | Gas-optimized batch ERC-20 transfers |
| **VeilMerchantIndex** | [`0xBAb80eb01777A0AD6d84FB378F385871bcAC3d5a`](https://polygonscan.com/address/0xBAb80eb01777A0AD6d84FB378F385871bcAC3d5a) | On-chain merchant registry & invoice index |
| **VeilDispute** | [`0x7Be337472D64b387d6f34c530A8a1aa1Ce7DDd41`](https://polygonscan.com/address/0x7Be337472D64b387d6f34c530A8a1aa1Ce7DDd41) | Escrow dispute arbitration system |

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

#### VeilSubscription.sol (Wave 6)
- `createSubscription()` — Create recurring payment with token, amount, interval
- `charge()` — Execute scheduled charge (if interval elapsed)
- `cancel()` / `pause()` / `resume()` — Lifecycle management
- `updateAmount()` — Merchant updates charge amount
- Events: `SubscriptionCreated`, `SubscriptionCharged`, `SubscriptionCancelled`

#### VeilSplitPay.sol (Wave 6)
- `createAndExecute()` — One-call create + execute multi-recipient split
- `createSplit()` / `executeSplit()` — Two-step flow
- Max 50 recipients per split

#### VeilBatchProcessor.sol (Wave 6)
- `batchTransfer()` — Bulk ERC-20 transfers (max 100 per batch)
- `batchPayInvoices()` — Batch-pay multiple invoices via InvoiceRegistry
- `estimateTotal()` — View helper to sum amounts

#### VeilMerchantIndex.sol (Wave 6)
- `registerMerchant()` — Self-register with name + metadata URI
- `indexInvoice()` / `markInvoicePaid()` — Authorized writer functions
- `getMerchantInvoices()` — Paginated invoice enumeration
- Access-controlled via `authorizedWriters` pattern

#### VeilDispute.sol (Wave 6)
- `openDispute()` — Open dispute on escrowed payment
- `submitEvidence()` — Buyer/seller submits evidence
- `resolveDispute()` — Arbitrator resolves with percentage split
- `claimExpiredDispute()` — Claim after 30-day deadline
- Resolution types: BuyerWins, SellerWins, Split, Expired

---

## ✨ Features

### Privacy & Invoicing
- **ERC-5564 stealth addresses** — secp256k1 key derivation, one unique address per invoice, unlinkable payments
- **ECIES encrypted memos** — AES-GCM encrypted invoice descriptions using ECDH key agreement
- **EIP-681 payment URIs** — QR-compatible deep-link payment requests
- **On-chain receipts** — `ReceiptStore` auto-stores a `keccak256` hash on every `markPaid` call
- **Receipt verification** — `/verify` reads `receiptOf[invoiceId]` to confirm payment on-chain, no trust required
- **Batch invoicing** — Create or mark up to 20 invoices in a single transaction

### Payments & Escrow
- **Trustless Escrow** — Buyer deposits ERC-20 tokens; full lifecycle: create → release / refund / dispute
- **On-chain Subscriptions** — Create recurring billing on-chain; merchants charge on any interval; payers can pause, resume, cancel
- **Split Pay** — Split to up to 50 recipients in one tx; manual entry or CSV import (`address,amount`)
- **Batch Processor** — Up to 100 bulk ERC-20 transfers or batch-pay multiple invoices in one call
- **POS Terminal** — Fixed-amount QR terminal with shareable payment links and live payment detection

### Merchant Tools
- **Merchant Index** — On-chain self-registration, paginated invoice enumeration via `authorizedWriters` pattern
- **Dispute Resolution** — Open disputes on escrow payments, submit text/IPFS evidence, multi-arbitrator pool, configurable buyer/seller % splits
- **Stealth Inbox** — Scan the blockchain for stealth payments addressed to your ephemeral key
- **Smart Gas Manager** — Auto-calculates exact POL needed to fund a stealth sweep
- **Analytics** — Revenue by token, invoice conversion rates, GMV over time

### Token Support
All payment flows support all major Polygon mainnet tokens:
`USDC` · `USDC.e` · `USDT` · `DAI` · `WETH` · `WPOL` · `BRZ` · `EUROC` · `CADC` · `XSGD`

---

## 🗺️ Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Home | Landing page |
| `/dashboard` | Dashboard | Invoice management, merchant panel, yield stats |
| `/invoice/new` | NewInvoice | Create invoice with stealth address + encrypted memo |
| `/invoice/:id` | InvoiceView | View invoice, mark as paid, get on-chain receipt |
| `/pay/:invoiceId` | PayInvoice | Pay an invoice via stealth payment flow |
| `/pos` | POS | Point-of-sale QR terminal |
| `/pay/pos` | POSPay | Pay via POS share link |
| `/escrow` | Escrow | Create and manage trustless escrows |
| `/subscriptions` | Subscriptions | On-chain recurring subscription management |
| `/split` | SplitPay | Multi-recipient payment splitting |
| `/disputes` | Disputes | Open disputes, submit evidence, view resolutions |
| `/receipts` | Receipts | View receipts + on-chain lookup by invoice ID |
| `/verify` | VerifyReceipt | Verify on-chain receipt authenticity |
| `/inbox` | Inbox | Stealth address inbox scanner |
| `/analytics` | Analytics | Revenue analytics and payment trends |
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
│   │   ├── VeilSubscription.sol  # Recurring payments engine
│   │   ├── VeilSplitPay.sol      # Multi-recipient splitting
│   │   ├── VeilBatchProcessor.sol# Batch ERC-20 transfers
│   │   ├── VeilMerchantIndex.sol # Merchant registry
│   │   ├── VeilDispute.sol       # Dispute arbitration
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
│       │   ├── subscriptionManager.ts  # Subscription CRUD
│       │   ├── splitPayManager.ts      # Split pay operations
│       │   ├── disputeManager.ts       # Dispute operations
│       │   ├── merchantIndex.ts        # Merchant registry ops
│       │   └── ...               # More utilities
        ├── pages/                # Route pages (18 pages)
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

All 9 contracts are already deployed on Polygon mainnet — no action needed to use the live app.

To re-deploy or deploy to a new network:
```bash
cd contracts
# Core contracts
npx hardhat run --network polygon scripts/deploy.js

# Wave 6 contracts (one at a time to avoid RPC timeouts)
DEPLOY_STEP=1 npx hardhat run --network polygon scripts/deployW6Step.js
DEPLOY_STEP=2 npx hardhat run --network polygon scripts/deployW6Step.js
# ... steps 3-5
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
VITE_SUBSCRIPTION_137=0xc956722c004d8Be4B1482Faf99d95ad472F7BD5a
VITE_SPLITPAY_137=0x5195ED6bB28293080A430F1bE2f3965F0d8ad083
VITE_BATCH_PROCESSOR_137=0x350AAB21f7644399235D8176E4ac8aB2CB58448b
VITE_MERCHANT_INDEX_137=0xBAb80eb01777A0AD6d84FB378F385871bcAC3d5a
VITE_DISPUTE_137=0x7Be337472D64b387d6f34c530A8a1aa1Ce7DDd41
```

---

## 📜 License

MIT — Built for the Polygon ecosystem.
