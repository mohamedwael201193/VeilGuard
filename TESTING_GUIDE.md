# 🧪 VeilGuard Testing Quick Reference

## 🚀 Start Testing in 5 Minutes

### Prerequisites:

- ✅ MetaMask or WalletConnect-compatible wallet
- ✅ Polygon Amoy testnet added to wallet
- ✅ Test POL for gas (get from https://faucet.polygon.technology)
- ✅ TestUSDC tokens (mint from contract)

---

## 📝 Step-by-Step Test Flow

### 1. Get Test Tokens (2 minutes)

**Get POL for gas:**

```
1. Visit: https://faucet.polygon.technology
2. Select "Polygon Amoy"
3. Paste your wallet address
4. Click "Submit"
5. Wait ~30 seconds
```

**Mint TestUSDC:**

```
Contract: 0x3156F6E761D7c9dA0a88A6165864995f2b58854f
Network: Polygon Amoy (80002)

Method: mint(address to, uint256 amount)
Example: mint(0xYourAddress, 100000000)  // 100 USDC (6 decimals)
```

### 2. Start Development Server (30 seconds)

```bash
cd d:\app\route\VeilGuard\web
npm run dev
```

Open: http://localhost:5173

### 3. Connect Wallet (10 seconds)

```
1. Click "Connect Wallet" button
2. Select MetaMask (or your wallet)
3. Approve connection
4. Ensure network is Polygon Amoy
```

### 4. Create Invoice (1 minute)

```
1. Click "Create Invoice" or navigate to /invoice/new
2. Enter amount: 10
3. Select token: TestUSDC
4. Add memo: "Test invoice for Wave 2"
5. Click "Create Invoice"
6. Approve transaction in wallet
7. Wait for confirmation (~5 seconds)
8. You'll be redirected to invoice view
```

**Expected Console Output:**

```
✅ Stealth address announced!
✅ Invoice created! Waiting for confirmation...
✅ Invoice created successfully!
```

### 5. View Invoice (30 seconds)

```
You'll see:
- Invoice amount (10 TestUSDC)
- QR code with payment URI
- Stealth address (unique per invoice)
- Copy buttons for address and link
- "Open in Wallet" button
- "Mark as Paid" button (if you're the merchant)
```

### 6. Make Payment (1 minute)

**Option A: Use Another Wallet**

```
1. Copy the stealth address
2. Switch to another wallet with TestUSDC
3. Send exactly 10 TestUSDC to stealth address
4. Wait for confirmation
```

**Option B: Scan QR Code**

```
1. Use mobile wallet with QR scanner
2. Scan the QR code
3. Confirm payment
```

### 7. Mark as Paid (30 seconds)

```
1. Go back to invoice view page
2. Click "Mark as Paid" button
3. Approve transaction in wallet
4. Wait for confirmation
5. See confetti animation! 🎉
6. Invoice status updates to "Paid"
```

### 8. Check Dashboard (10 seconds)

```
1. Navigate to /dashboard
2. Verify stats:
   - Total Invoices: 1
   - Total GMV: $10.00
   - Success Rate: 100%
   - Median Time to Pay: X minutes
3. See invoice in recent list
```

---

## 🔍 What to Verify

### Invoice Creation

- [ ] Stealth address is unique (changes every time)
- [ ] Ephemeral public key is generated
- [ ] Transaction appears on Amoy PolygonScan
- [ ] InvoiceCreated event emitted
- [ ] Announcement event emitted

### Invoice View

- [ ] QR code displays correctly
- [ ] Payment URI starts with `ethereum:0x...`
- [ ] Stealth address is copyable
- [ ] Invoice link is shareable
- [ ] Status badge shows "Awaiting Payment"

### Payment Detection

- [ ] Mark as Paid button visible to merchant only
- [ ] Transaction succeeds on-chain
- [ ] Invoice status updates in UI
- [ ] Confetti animation plays
- [ ] paidAt timestamp recorded

### Dashboard Stats

- [ ] Total Invoices count accurate
- [ ] GMV calculates sum correctly
- [ ] Success Rate percentage correct
- [ ] Time to Pay calculated from timestamps
- [ ] Invoice cards display properly

---

## 🐛 Troubleshooting

### "Please connect your wallet"

- Ensure MetaMask is unlocked
- Check you're on Polygon Amoy (80002)
- Refresh page and reconnect

### "Transaction failed"

- Check you have enough POL for gas
- Verify network is correct (80002)
- Increase gas limit if needed

### "Token not found"

- Verify TestUSDC address in .env.local
- Check VITE_ALLOWED_TOKENS_80002 config
- Refresh page

### QR Code not showing

- Check payment URI is generated
- Verify tokenConfig exists
- Check browser console for errors

### Mark as Paid fails

- Ensure you're the invoice creator
- Check wallet is connected
- Verify invoice is still pending

---

## 📊 Expected Transaction Costs (Amoy)

| Action           | Estimated Gas | POL Cost    |
| ---------------- | ------------- | ----------- |
| Create Invoice   | ~150,000      | ~0.001 POL  |
| Announce Stealth | ~100,000      | ~0.0007 POL |
| Mark Paid        | ~80,000       | ~0.0005 POL |
| Mint TestUSDC    | ~50,000       | ~0.0003 POL |

**Total for full flow:** ~0.0025 POL (~$0.002 USD)

---

## 🔗 Useful Contract Links

### Amoy Testnet Contracts:

```
InvoiceRegistry:
https://amoy.polygonscan.com/address/0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10

StealthHelper:
https://amoy.polygonscan.com/address/0xB0324Dd39875185658f48aB78473d288d8f9B52e

ReceiptStore:
https://amoy.polygonscan.com/address/0xa4e554b54cF94BfBca0682c34877ee7C96aC9261

TestUSDC:
https://amoy.polygonscan.com/address/0x3156F6E761D7c9dA0a88A6165864995f2b58854f
```

---

## 🎯 Success Criteria

✅ **Test Passed If:**

- Created invoice appears on dashboard
- QR code generates successfully
- Payment to stealth address succeeds
- Mark as paid transaction confirms
- Dashboard stats update correctly
- No console errors
- All transactions visible on PolygonScan

---

## 📸 Screenshot Checklist

Take screenshots of:

- [ ] Invoice creation form
- [ ] Transaction confirmation popup
- [ ] Invoice view with QR code
- [ ] Payment transaction in wallet
- [ ] Mark as paid confirmation
- [ ] Confetti animation
- [ ] Dashboard with stats
- [ ] PolygonScan transaction pages

---

## ⏱️ Time Estimates

| Phase                   | Duration        |
| ----------------------- | --------------- |
| Setup (wallet + tokens) | 2-3 minutes     |
| Start dev server        | 30 seconds      |
| Create invoice          | 1 minute        |
| View invoice            | 30 seconds      |
| Make payment            | 1 minute        |
| Mark paid               | 30 seconds      |
| Check dashboard         | 10 seconds      |
| **Total**               | **5-6 minutes** |

---

## 🎉 Test Complete!

If all steps pass, you've successfully verified:

- ✅ Smart contract deployment
- ✅ Frontend integration
- ✅ Stealth address generation
- ✅ Payment flow
- ✅ Merchant dashboard
- ✅ End-to-end functionality

**VeilGuard Wave 2 is production-ready!** 🚀

---

**Quick Commands:**

```bash
# Start dev server
cd web && npm run dev

# Build for production
cd web && npm run build

# Check for errors
cd web && npm run type-check

# Deploy contracts (if needed)
cd contracts && npx hardhat run scripts/deployPolygon.js --network amoy
```

---

Generated: November 4, 2025  
Last Updated: Wave 2 completion  
Status: Ready for testing ✅
