# 🛡️ VeilGuard - Private Invoice System for Web3

**Privacy-first invoicing on Polygon with ERC-5564 stealth addresses and cryptographic receipts.**

[![Live Demo](https://img.shields.io/badge/Demo-Live-success)](https://veil-guard.vercel.app)
[![Video Demo](https://img.shields.io/badge/Video-YouTube-red)](https://youtu.be/dsePu6PW_DE)
[![Contracts](https://img.shields.io/badge/Contracts-Verified-blue)](https://polygonscan.com/address/0xBcC00f328e4e917ED3c42f581D18C96B5c2d51eB)
[![Wave](https://img.shields.io/badge/Wave-3.5-purple)](./WAVE3_DOCUMENTATION.md)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Deployment](#-live-deployment)
- [Wave 3.5 Documentation](#-wave-35-documentation)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Quick Start](#-quick-start)
- [Tech Stack](#-tech-stack)
- [Roadmap](#-roadmap)
- [License](#-license)

---

## 🎯 Overview

VeilGuard enables merchants to receive payments without exposing their transaction history. Each invoice generates a **unique stealth address** using the **ERC-5564 standard**, making payments unlinkable and private while maintaining blockchain transparency.

### Why VeilGuard?

- 🔐 **True Privacy**: Cryptographically unlinkable addresses (ERC-5564)
- 🔑 **Self-Custodial**: Full user control, no intermediaries
- 📜 **Verifiable Receipts**: On-chain cryptographic commitments
- ⚡ **Low Cost**: ~$0.006 for complete flow on Polygon
- 🌐 **Production Ready**: Verified contracts, live deployment
- 🔓 **Open Source**: Fully auditable code
- 💰 **Yield Integration**: Earn ~3-5% APY on idle funds via Aave V3
- 🪙 **Multi-Token**: USDC, USDT, DAI, WETH, WPOL support

**Status:** ✅ Wave 3.5 Complete & Deployed on Polygon Mainnet (November 2025)

---

## � Live Deployment

- **🚀 App:** https://veil-guard.vercel.app
- **📺 Demo Video:** https://youtu.be/dsePu6PW_DE
- **💻 GitHub:** https://github.com/mohamedwael201193/VeilGuard

---

## 📖 Wave 3.5 Documentation

**For detailed technical review, see the comprehensive Wave 3.5 documentation:**

➡️ **[WAVE3_DOCUMENTATION.md](./WAVE3_DOCUMENTATION.md)** ⬅️

This document includes:

- Privacy+DeFi architecture with Aave V3 yield integration
- ECIES encrypted memos implementation
- Multi-token support (6 tokens on Polygon)
- Smart gas optimization
- Batch operations for merchant scale
- Analytics dashboard with metrics & CSV export
- ENS/Unstoppable Domains name resolution
- Multi-vault yield routing
- All smart contract details with mainnet addresses

**Previous documentation:** [WAVE2_COMPLETE_DOCUMENTATION.md](./WAVE2_COMPLETE_DOCUMENTATION.md)

---

## ✨ Key Features

### Wave 3.5 Achievements

#### 🔐 Privacy & Stealth Addresses

- **ERC-5564 Implementation**: Full specification compliance
- **ECIES Encrypted Memos**: End-to-end encrypted invoice memos (ECDH + AES-GCM)
- **Unique Addresses**: Every invoice = new stealth address
- **Payment Unlinkability**: Observers cannot connect payments to merchants

#### 💰 DeFi Integration

- **Aave V3 Yield**: Earn ~3-5% APY on swept funds
- **Multi-Vault Routing**: Auto-select best APY (Aave/Morpho/Compound)
- **Multi-Token Support**: USDC, USDT, DAI, WETH, WPOL
- **Smart Gas Top-up**: Dynamic gas calculation (~50% savings)

#### 📊 Merchant Tools

- **Batch Operations**: Create multiple invoices (~30% gas savings)
- **Analytics Dashboard**: Real-time metrics, conversion rates, GMV tracking
- **CSV Export**: Export data for accounting software
- **Name Resolution**: ENS/Unstoppable Domains support

#### 📜 Cryptographic Receipts

- **On-Chain Commitments**: `keccak256(invoiceId || txHash)`
- **Access Control**: Receipt v2 with authorization
- **Public Verification**: Anyone can verify without authentication
- **Shareable Links**: Easy receipt distribution

#### 🔍 Payment Discovery

- **Inbox Scanner**: Scan 10,000 blocks for incoming payments
- **Rate-Optimized**: 3 parallel requests, 200ms delays
- **View Key Matching**: Finds all payments for your keys
- **Async Memo Decryption**: Decrypt memos during scan

#### 🎨 User Experience

- **12 Functional Pages**: Complete merchant & customer flows
- **Professional UI**: shadcn/ui components, responsive design
- **Dark Mode**: Glass morphism effects, smooth animations
- **Wallet Support**: MetaMask, WalletConnect, Rainbow, Coinbase

---

## �️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  VEILGUARD WAVE 2                   │
└─────────────────────────────────────────────────────┘

┌────────────────┐      ┌──────────────────┐      ┌───────────────┐
│   FRONTEND     │      │  SMART CONTRACTS │      │  BLOCKCHAIN   │
│  React + Vite  │ ───> │  Solidity 0.8.24 │ ───> │    Polygon    │
└────────────────┘      └──────────────────┘      └───────────────┘
       │                        │                          │
       ├─ 12 Pages              ├─ InvoiceRegistry        ├─ Mainnet (137)
       ├─ ERC-5564 Crypto       ├─ StealthHelper          └─ Amoy (80002)
       ├─ Blockchain Scanner    └─ ReceiptStore
       └─ Self-Custodial Sweep
```

**Core Components:**

- **InvoiceRegistry**: Invoice creation & payment tracking
- **StealthHelper**: ERC-5564 announcement events
- **ReceiptStore**: Cryptographic receipt commitments
- **Frontend**: 12 pages (Home, Dashboard, Invoice, Payment, Inbox, etc.)
- **Crypto Library**: Full ERC-5564 implementation (ECDH + HKDF)

---

## 📜 Smart Contracts

### Deployed & Verified ✅

**Polygon PoS Mainnet (Chain ID: 137) - Wave 3.5:**

| Contract            | Address                                                                                                                    | Status      |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------- |
| **InvoiceRegistry** | [`0xBcC00f328e4e917ED3c42f581D18C96B5c2d51eB`](https://polygonscan.com/address/0xBcC00f328e4e917ED3c42f581D18C96B5c2d51eB) | ✅ Verified |
| **StealthHelper**   | [`0xc0d83ab5D1527Ef0afe3f4E55dfa4029d5029edD`](https://polygonscan.com/address/0xc0d83ab5D1527Ef0afe3f4E55dfa4029d5029edD) | ✅ Verified |
| **ReceiptStore**    | [`0x8E5105929f4AB691405eE1A53718de8413cA7e4C`](https://polygonscan.com/address/0x8E5105929f4AB691405eE1A53718de8413cA7e4C) | ✅ Verified |

**Polygon Amoy Testnet (Chain ID: 80002):**

| Contract        | Address                                      |
| --------------- | -------------------------------------------- |
| InvoiceRegistry | `0xfD77DCa7Fd43aDf34381fbfb987089FddF4d2282` |
| StealthHelper   | `0xC8FFf42f4EE3D096c260C8E6CE5fC767Dbb03abc` |
| ReceiptStore    | `0x5968f6Bd79773179453EE934193467790B9327A6` |

### Contract Features

**InvoiceRegistry.sol** (Wave 3.5 Enhanced)

- `createInvoice()` - Create new invoice with stealth address
- `createInvoiceWithExpiry()` - Create invoice with auto-expiration
- `markPaid()` - Mark invoice as paid with tx hash hint
- `getInvoice()` - Retrieve invoice details
- Multi-token support (USDC, USDT, DAI, WETH, WPOL)

**StealthHelper.sol** (ERC-5564 compliant)

- `announce()` - Emit stealth address announcement event

**ReceiptStore.sol** (Access Controlled)

- `store()` - Store receipt commitment on-chain
- `receiptOf()` - Public mapping for verification
- `setAuthorizedWriter()` - Access control for receipt creation

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MetaMask or Web3 wallet
- MATIC for gas ([Polygon Faucet](https://faucet.polygon.technology))

### 1. Clone Repository

```bash
git clone https://github.com/mohamedwael201193/VeilGuard.git
cd VeilGuard
```

### 2. Setup Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your PRIVATE_KEY and POLYGONSCAN_API_KEY
npm run compile
npm run deploy:amoy      # Deploy to testnet
npm run verify:amoy      # Verify contracts
```

### 3. Setup Frontend

```bash
cd web
npm install
cp .env.example .env.local
# Edit .env.local with contract addresses
npm run dev              # Start at http://localhost:5173
```

### 4. Try It Out!

1. Visit http://localhost:5173
2. Connect your wallet
3. Go to "Security" page → Generate demo keys
4. Create an invoice
5. Pay it from another wallet
6. Sweep funds self-custodially
7. Generate cryptographic receipt
8. Verify receipt publicly

---

## 🛠️ Tech Stack

### Smart Contracts

- **Solidity** ^0.8.24
- **Hardhat** - Development environment
- **OpenZeppelin** - Secure contract libraries
- **Ethers.js** - Blockchain interactions

### Frontend

- **React 18** + **TypeScript** - Modern UI framework
- **Vite 5** - Fast build tool
- **wagmi v2** + **viem v2** - Web3 React hooks
- **TanStack Router** - Type-safe routing
- **shadcn/ui** + **Tailwind CSS** - Component library & styling
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **@noble/curves** - Cryptographic primitives
- **@web3icons/react** - Professional token icons

### Infrastructure

- **Polygon PoS** - L2 blockchain (mainnet)
- **Polygon Amoy** - Testnet environment
- **Alchemy** - RPC provider (rate-optimized)
- **Vercel** - Frontend deployment
- **WalletConnect v2** - Universal wallet support

---

## 🗺️ Roadmap

### ✅ Wave 2 (Complete - Nov 5, 2025)

- ERC-5564 stealth addresses
- Self-custodial sweeping
- Cryptographic receipts
- Inbox scanning
- Production deployment on Polygon mainnet

### ✅ Wave 3.5 (Complete - Nov 27, 2025)

- Multi-token support (USDC, USDT, DAI, WETH, WPOL)
- ECIES encrypted memos
- Aave V3 yield integration (~3-5% APY)
- Smart gas optimization
- Batch invoice operations (~30% gas savings)
- Analytics dashboard with CSV export
- ENS/Unstoppable Domains name resolution
- Multi-vault yield routing
- New contracts deployed to Polygon Mainnet

### 📅 Wave 4 (Next)

- zk-Receipts with Noir circuits for zero-knowledge proofs
- AggLayer integration for cross-chain payments
- AgentPay SDK for programmatic invoice management
- Recurring invoices (subscription payments)

### 📅 Waves 5-8 (Advanced Privacy)

- zk-SNARKs for amount privacy
- Cross-chain support (Arbitrum, Optimism, Base)
- Stealth address pooling
- Mobile app (React Native)

### 📅 Waves 9-10 (Enterprise)

- Team accounts & role-based access
- White-label solutions
- Compliance tools (optional KYC)

---

## 📊 Performance Metrics

| Metric                          | Value              |
| ------------------------------- | ------------------ |
| **Gas Cost** (complete flow)    | ~$0.006            |
| **Invoice Creation**            | 2-3 seconds        |
| **Inbox Scanning** (10k blocks) | ~70 seconds        |
| **Bundle Size**                 | 911 KB (optimized) |
| **Page Load**                   | 1.2-1.8 seconds    |
| **Security Vulnerabilities**    | 0                  |

---

## � Security

- ✅ **Immutable Contracts**: No upgradability, no admin keys
- ✅ **Auditable Code**: Open source on GitHub
- ✅ **Verified Contracts**: All 3 verified on PolygonScan
- ✅ **Client-Side Keys**: Private keys never leave browser
- ✅ **Session Storage**: Keys cleared on page close
- ✅ **No Backend**: Fully decentralized, no server to hack

**⚠️ User Responsibilities:**

- Backup private keys securely
- Verify stealth addresses before payment
- Check transaction details carefully

---

## 📚 Resources

- **ERC-5564 Spec**: https://eips.ethereum.org/EIPS/eip-5564
- **EIP-681 Payment URIs**: https://eips.ethereum.org/EIPS/eip-681
- **Polygon Docs**: https://docs.polygon.technology/
- **Polygon Faucet**: https://faucet.polygon.technology
- **PolygonScan**: https://polygonscan.com

---

## � License

MIT License - See [LICENSE](./LICENSE) file for details.

---

## 🤝 Contributing

VeilGuard is open for contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Contact & Support

**Developer:** Mohamed Wael  
**Email:** mohamedwael201193@gmail.com  
**GitHub:** [@mohamedwael201193](https://github.com/mohamedwael201193)

---

**Built with 💚 for Web3 Privacy**  
**VeilGuard: Privacy by design, transparency by choice.**
