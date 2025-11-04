# VeilGuard - Private Invoice System

**VeilGuard** is a merchant-grade private invoicing system powered by ERC-5564 stealth addresses on Polygon. Create privacy-preserving invoices with selective disclosure, self-custodial fund management, and cryptographic receipts.

## 🌟 Wave 2 Features

### Merchant-First Privacy Features

1. **Spec Mode vs Demo Mode** - Toggle between ERC-5564 compliant stealth derivation and simplified demo mode
2. **View-Key Inbox** - Scan incoming payments with only your view key (never expose spend keys)
3. **Self-Custodial Sweeper** - Locally derive stealth private keys and sweep funds to your merchant safe
4. **One-Click Refunds** - Refund original payers directly from stealth addresses
5. **Selective-Disclosure Receipts** - Generate cryptographic on-chain commitments, reveal only when needed

## 🔐 Security Model

- **Client-Side Only**: All private keys stay in your browser, never sent to any server
- **View-Only Mode**: Scan for incoming payments without exposing spend keys
- **Least Privilege**: Separate viewing and spending capabilities
- **No Custody**: You control your keys, we never see them

## 🚀 Quick Start

### Installation

```bash
# Clone and install dependencies
git clone <YOUR_GIT_URL>
cd web
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your contract addresses
```

### Environment Variables

```bash
# Chain Configuration
VITE_CHAIN_DEFAULT=80002  # 137 for Polygon mainnet, 80002 for Amoy testnet

# Stealth Mode (NEW in Wave 2)
VITE_STEALTH_MODE=spec    # "spec" for ERC-5564 compliant, "demo" for legacy

# Merchant Safe Address (NEW in Wave 2)
VITE_MERCHANT_SAFE=0xYourSafeAddress  # Where swept funds go

# Contract Addresses
VITE_INVOICE_REGISTRY_80002=0x...
VITE_STEALTH_HELPER_80002=0x...
VITE_RECEIPT_STORE_80002=0x...

# RPC & API Keys
VITE_ALCHEMY_API_KEY=your_key
VITE_WALLETCONNECT_PROJECT_ID=your_id
```

### Development

```bash
npm run dev  # Start dev server at http://localhost:8080
```

## 📖 Usage Guide

### 1. Generate Merchant Keys

1. Go to `/security`
2. Click "Generate Keys"
3. **CRITICAL**: Export and backup your keys offline
4. Keys control all funds sent to your stealth addresses

### 2. Create an Invoice

1. Go to `/invoice/new`
2. Enter amount, token, and memo
3. System generates unique stealth address (ERC-5564 compliant in spec mode)
4. Share invoice link or QR code with payer

### 3. Scan for Incoming Payments (Inbox)

1. Go to `/inbox`
2. Import your view and spend private keys (session only)
3. Click "Scan for My Payments"
4. View all incoming payments to your stealth addresses
5. **View key alone** is sufficient for detection (view-only mode)

### 4. Sweep Funds to Safe

1. Open paid invoice
2. Click "Sweep to Safe" (merchant only, spec mode)
3. Enter spend + view private keys in modal
4. Keys derive stealth private key locally
5. Funds transferred to `VITE_MERCHANT_SAFE`

### 5. Refund a Payer

1. Open paid invoice
2. Click "Refund Payer" (if payer address detected)
3. Enter spend + view keys
4. Funds returned to original payer address

### 6. Create Selective-Disclosure Receipt

1. After marking invoice as paid
2. Click "Create On-Chain Receipt"
3. Commitment hash stored in ReceiptStore contract
4. Share verification link with auditors
5. Proves payment without revealing stealth address or payer identity

### 7. Verify a Receipt

1. Open receipt link: `/verify?invoiceId=0x...&txHash=0x...`
2. System recomputes commitment: `keccak256(invoiceId || txHash)`
3. Checks against on-chain `receiptOf[invoiceId]`
4. ✅ Green check if valid, ❌ red X if invalid

## 🏗️ Architecture

### Spec Mode (ERC-5564 Compliant)

**Key Derivation:**

```
stealthPriv = (H(ECDH(viewPriv, ephPub)) + spendPriv) mod n
stealthAddress = address(pubkey(stealthPriv))
```

**Announcement Event:**

```solidity
event Announcement(
  uint256 schemeId,
  address indexed stealthAddress,
  bytes ephemeralPubKey,  // 65 bytes uncompressed
  bytes metadata          // View tag for scanning
)
```

**Receipt Commitment:**

```
commitment = keccak256(abi.encodePacked(invoiceId, txHash))
```

### Demo Mode (Legacy)

Simplified stealth derivation for backward compatibility. Uses basic ECDH without modular arithmetic.

## 🎬 Demo Script (60-90 seconds)

### Setup (10s)

1. Show `/security` - Generate merchant keys
2. Show environment: `VITE_STEALTH_MODE=spec`

### Invoice Creation (15s)

1. Create invoice for 100 USDC
2. Show generated stealth address
3. Show Announcement event on block explorer

### View-Only Inbox (20s)

1. Go to `/inbox`
2. Import **view key only** (not spend key)
3. Scan blockchain
4. Show detected payment

### Self-Custodial Sweep (20s)

1. Open paid invoice
2. Click "Sweep to Safe"
3. Enter keys (modal shows they're temporary)
4. Show funds moved to merchant safe

### Receipt & Verification (15s)

1. Click "Create On-Chain Receipt"
2. Show commitment hash
3. Open verification link
4. Show ✅ green verification

### Refund (Optional 10s)

1. Click "Refund Payer"
2. Show refund to original payer address

## 🏆 Why This is Different

### vs Generic Private Transfers

- **Invoice-specific**: Designed for merchant payments, not just transfers
- **Selective disclosure**: Prove payment without revealing identities
- **Refund capability**: One-click refunds to actual payers

### vs POL-Stealth (Wave 1)

- **View-key inbox**: True view-only scanning (they don't have this)
- **Self-custodial sweeper**: Local key derivation, no backend needed
- **Receipt system**: On-chain commitments for auditing
- **Spec compliant**: Full ERC-5564 support with modular arithmetic

### Merchant Value Proposition

1. **Regulatory Compliance**: Selective disclosure for audits
2. **Operational Safety**: Sweep to multi-sig safe automatically
3. **Customer Service**: Easy refunds without manual key management
4. **Privacy by Default**: Stealth addresses for all invoices

## 🔧 Technical Stack

- **Frontend**: React + TypeScript + Vite
- **Wallet**: wagmi v2 + WalletConnect
- **Crypto**: @noble/secp256k1 v3.0.0
- **Blockchain**: Polygon (mainnet + Amoy testnet)
- **Contracts**: Solidity 0.8.20, Foundry
- **UI**: shadcn/ui + Tailwind CSS

## 📝 Contract Addresses

### Polygon Amoy (Testnet)

- InvoiceRegistry: `0x3b1d0D011f1eD49a1b6CEaB634d39E60BeB3F83a`
- StealthHelper: `0xEFDf0BC0DEa0EEB4dE86F99Ed13f3c7afB39B25F`
- ReceiptStore: `0xa4e554E2BCA46339F61c8D2Ed0BC4B685E0C9261`
- TestUSDC: `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582`

### Polygon Mainnet

- InvoiceRegistry: `0x5dEa96e4DA067d0dBE084a42d7E70C0Ae0Dd8C62`
- StealthHelper: `0xed04A8AAcf1eEF1AeC6e4Cf2b40ce4F55C27D6b0`
- ReceiptStore: `0x6cF36A20C85Ba0B86cD5e3eEAa7Af9a1C3e73A2E`
- USDC: `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`

## 🧪 Testing on Amoy

1. Get testnet POL from [Polygon Faucet](https://faucet.polygon.technology/)
2. Mint test USDC: Call `mint()` on TestUSDC contract
3. Create invoice in VeilGuard
4. Pay from a second wallet
5. Use Inbox to detect payment
6. Sweep or refund using merchant keys

## 📚 Additional Documentation

- [DEPLOY.md](../../DEPLOY.md) - Deployment guide
- [Security Best Practices](./docs/SECURITY.md) - Key management tips
- [ERC-5564 Spec](https://eips.ethereum.org/EIPS/eip-5564) - Stealth address standard

## 🤝 Contributing

This project is part of the Polygon Protocol Fellowship cohort. Issues and PRs welcome!

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with 💜 for merchant privacy on Polygon**
