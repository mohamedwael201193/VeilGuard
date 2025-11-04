# VeilGuard Wave 2 - Current Status

**Date**: November 4, 2025  
**Status**: Contracts Deployed ✅ | Frontend Integration In Progress 🔄

---

## ✅ COMPLETED

### Smart Contracts (Amoy Testnet - Chain ID 80002)

| Contract            | Address                                      | Status      | Explorer                                                                                |
| ------------------- | -------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| **InvoiceRegistry** | `0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10` | ✅ Deployed | [View](https://amoy.polygonscan.com/address/0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10) |
| **StealthHelper**   | `0xB0324Dd39875185658f48aB78473d288d8f9B52e` | ✅ Deployed | [View](https://amoy.polygonscan.com/address/0xB0324Dd39875185658f48aB78473d288d8f9B52e) |
| **ReceiptStore**    | `0xa4e554b54cF94BfBca0682c34877ee7C96aC9261` | ✅ Deployed | [View](https://amoy.polygonscan.com/address/0xa4e554b54cF94BfBca0682c34877ee7C96aC9261) |
| **TestUSDC**        | `0x3156F6E761D7c9dA0a88A6165864995f2b58854f` | ✅ Deployed | [View](https://amoy.polygonscan.com/address/0x3156F6E761D7c9dA0a88A6165864995f2b58854f) |

**Deployer Wallet**: `0x1dF8e57ea7A6A3bB554E13412b27d4d26BBA851B`  
**TestUSDC Minted**: 1,000,000 tUSDC to deployer

### Infrastructure Files

- ✅ `.gitignore` - Protects secrets and artifacts
- ✅ `README.md` - Complete project documentation
- ✅ `DEPLOY.md` - Deployment guide with addresses
- ✅ `.vscode/tasks.json` - VS Code task automation
- ✅ `contracts/` - All 4 Solidity contracts compiled
- ✅ `shared/abi/` - Exported contract ABIs
- ✅ `web/src/abi/` - ABIs copied to web folder
- ✅ `scripts/export-abi.js` - ABI export automation

### Frontend Libraries Created

- ✅ `web/src/lib/stealthGen.ts` - ERC-5564 stealth address generation
- ✅ `web/src/lib/announce.ts` - StealthHelper.announce() caller
- ✅ `web/src/lib/usePaymentWatcher.ts` - USDC Transfer event watcher
- ✅ `web/src/lib/contractHelpers.ts` - Wallet client utilities
- ✅ `web/src/config/contracts.ts` - Contract address config
- ✅ `web/src/chains/polygonAmoy.ts` - Amoy chain definition
- ✅ `web/.env.local` - Environment config with addresses

---

## 🔄 IN PROGRESS

### NPM Dependencies Issue

**Problem**: `npm install` in web folder failing with EPERM error  
**Cause**: Windows permission issue or antivirus blocking  
**Solutions to try**:

1. **Run PowerShell as Administrator**:

   ```powershell
   cd d:\app\route\VeilGuard\web
   npm install --legacy-peer-deps
   ```

2. **Close VS Code** and run from external terminal:

   ```powershell
   cd d:\app\route\VeilGuard\web
   npm install --legacy-peer-deps
   ```

3. **Disable antivirus temporarily** and retry

4. **Clear npm cache**:
   ```powershell
   npm cache clean --force
   npm install --legacy-peer-deps
   ```

---

## ❌ NOT STARTED

### Polygon Mainnet Deployment

Contracts NOT yet deployed to Polygon mainnet (Chain ID 137):

- ❌ InvoiceRegistry
- ❌ StealthHelper
- ❌ ReceiptStore

**To deploy**:

```bash
cd contracts
npm run deploy:polygon
```

**Then verify**:

```bash
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

### Frontend Pages Wiring

Existing pages need integration with deployed contracts:

1. **`web/src/pages/NewInvoice.tsx`** ❌

   - Replace mock stealth generation with real `stealthGen.ts`
   - Add contract ABI imports
   - Call `announceStealth()` from `announce.ts`
   - Call `InvoiceRegistry.createInvoice()` with wagmi
   - Show transaction confirmation

2. **`web/src/pages/InvoiceView.tsx`** ❌

   - Import contract ABIs
   - Read invoice from `InvoiceRegistry.getInvoice()`
   - Generate QR code with EIP-681 payment URI
   - Start `usePaymentWatcher` for USDC transfers
   - Add "Mark Paid" button → `InvoiceRegistry.markPaid()`
   - Show confetti on payment confirmation

3. **`web/src/pages/Dashboard.tsx`** ❌

   - Query `InvoiceCreated` events using viem
   - Query `InvoicePaid` events
   - Calculate GMV (sum of amounts)
   - Calculate success rate (paid / created)
   - Calculate median time-to-pay from timestamps
   - Cache in localStorage

4. **`web/src/components/layout/Footer.tsx`** ❌
   - Add explorer links for current chain
   - Show contract addresses from env
   - Add GitHub/docs links

### Contract Verification

Run verification on PolygonScan:

**Amoy Testnet**:

```bash
npx hardhat verify --network amoy 0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10
npx hardhat verify --network amoy 0xB0324Dd39875185658f48aB78473d288d8f9B52e
npx hardhat verify --network amoy 0xa4e554b54cF94BfBca0682c34877ee7C96aC9261
npx hardhat verify --network amoy 0x3156F6E761D7c9dA0a88A6165864995f2b58854f
```

**Polygon Mainnet** (after deployment):

```bash
npx hardhat verify --network polygon <INVOICE_REGISTRY_ADDRESS>
npx hardhat verify --network polygon <STEALTH_HELPER_ADDRESS>
npx hardhat verify --network polygon <RECEIPT_STORE_ADDRESS>
```

---

## 🎯 NEXT STEPS (Priority Order)

1. **Fix npm install issue** - Run as Administrator or try solutions above
2. **Verify Amoy contracts** on PolygonScan
3. **Wire InvoiceNew page** - Complete invoice creation flow
4. **Wire InvoiceView page** - Add QR code and payment detection
5. **Wire Dashboard page** - Event querying and stats
6. **Test full flow on Amoy** - Create → Pay → Detect → Mark Paid
7. **Deploy to Polygon mainnet** - All 3 contracts
8. **Update .env.local** with mainnet addresses
9. **Final testing** on mainnet
10. **Deploy frontend** to Vercel/Netlify

---

## 🔧 Quick Commands

### Contracts

```bash
cd contracts
npm run build              # Compile contracts
npm run deploy:amoy        # Deploy to Amoy
npm run deploy:polygon     # Deploy to Polygon
npm run export-abi         # Export ABIs
```

### Web (after npm install fixed)

```bash
cd web
npm run dev                # Start dev server
npm run build              # Production build
```

### VS Code Tasks

- `Ctrl+Shift+B` → "contracts:build"
- `Ctrl+Shift+P` → "Tasks: Run Task" → Select task

---

**Current Blocker**: npm install permission error  
**Solution**: Run PowerShell as Administrator and retry npm install
