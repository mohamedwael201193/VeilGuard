# VeilGuard Deployment Guide

## 🚀 Deployed Contract Addresses

### Polygon Amoy Testnet (Chain ID: 80002)

| Contract            | Address                                      | Explorer                                                                                |
| ------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| **InvoiceRegistry** | `0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10` | [View](https://amoy.polygonscan.com/address/0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10) |
| **StealthHelper**   | `0xB0324Dd39875185658f48aB78473d288d8f9B52e` | [View](https://amoy.polygonscan.com/address/0xB0324Dd39875185658f48aB78473d288d8f9B52e) |
| **ReceiptStore**    | `0xa4e554b54cF94BfBca0682c34877ee7C96aC9261` | [View](https://amoy.polygonscan.com/address/0xa4e554b54cF94BfBca0682c34877ee7C96aC9261) |
| **TestUSDC**        | TBD                                          | TBD                                                                                     |

### Polygon Mainnet (Chain ID: 137)

| Contract            | Address | Explorer |
| ------------------- | ------- | -------- |
| **InvoiceRegistry** | TBD     | TBD      |
| **StealthHelper**   | TBD     | TBD      |
| **ReceiptStore**    | TBD     | TBD      |

## 📦 Frontend Deployment (Vercel/Netlify)

### Required Environment Variables

Add these to your Vercel/Netlify dashboard:

```bash
# Default chain (80002 = Amoy testnet, 137 = Polygon mainnet)
VITE_CHAIN_DEFAULT=80002

# Amoy Testnet Addresses
VITE_INVOICE_REGISTRY_80002=0x77F97D9a76F4c262c2235FD9b7F418A7c0C75D10
VITE_STEALTH_HELPER_80002=0xB0324Dd39875185658f48aB78473d288d8f9B52e
VITE_RECEIPT_STORE_80002=0xa4e554b54cF94BfBca0682c34877ee7C96aC9261
VITE_ALLOWED_TOKENS_80002=tUSDC:0xTBD_TESTUSDC_ADDRESS

# Polygon Mainnet Addresses (after mainnet deployment)
VITE_INVOICE_REGISTRY_137=
VITE_STEALTH_HELPER_137=
VITE_RECEIPT_STORE_137=
VITE_ALLOWED_TOKENS_137=USDC:0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359;USDCe:0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```

### Vercel Deployment

1. **Import Repository**

   ```bash
   vercel import
   ```

2. **Set Root Directory** to `web`

3. **Build Settings**

   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables** (see above)

5. **Deploy**
   ```bash
   vercel --prod
   ```

### Netlify Deployment

1. **Connect Repository** via Netlify dashboard

2. **Build Settings**

   - Base directory: `web`
   - Build command: `npm run build`
   - Publish directory: `web/dist`

3. **Add Environment Variables** in Site Settings → Environment Variables

4. **Deploy**

## 🔄 Update Workflow

When deploying new contract versions:

1. Deploy contracts to testnet/mainnet
2. Update `.env.local` in `web/` with new addresses
3. Update this `DEPLOY.md` with verified addresses
4. Update environment variables in Vercel/Netlify
5. Trigger new frontend deployment

## 🧪 Testing Checklist

- [ ] Connect wallet on Amoy testnet
- [ ] Create test invoice
- [ ] Generate stealth address
- [ ] Verify Announcement event on explorer
- [ ] Send test USDC to stealth address
- [ ] Verify payment detection
- [ ] Mark invoice as paid
- [ ] Check dashboard stats update

## 📊 Monitoring

- **Amoy Explorer**: https://amoy.polygonscan.com
- **Polygon Explorer**: https://polygonscan.com
- **Frontend**: TBD (after Vercel/Netlify deploy)

## 🆘 Troubleshooting

### Contract Not Found

- Verify chain ID matches deployed network
- Check environment variables are set correctly
- Ensure wallet is connected to correct network

### Transaction Failures

- Check wallet has sufficient MATIC for gas
- Verify contract addresses are correct
- Check token approvals if using ERC20

### Payment Not Detected

- Ensure correct token address
- Verify transfer event fired on-chain
- Check polling interval (default 5000ms)

---

**Last Updated**: November 4, 2025  
**Wave**: 2 - Core Implementation  
**Status**: Amoy Testnet Deployed ✅
