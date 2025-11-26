/**
 * Wave 3 Deployment Script
 * 
 * Deploys updated contracts and links them together:
 * 1. Deploy ReceiptStore v2 (with access control)
 * 2. Deploy InvoiceRegistry v2 (with expiry support)
 * 3. Link: InvoiceRegistry.setReceiptStore(receiptStore)
 * 4. Link: ReceiptStore.setAuthorizedWriter(invoiceRegistry, true)
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  VeilGuard Wave 3 Deployment");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("Deployer:", await deployer.getAddress());
  console.log("");

  // Step 1: Deploy ReceiptStore v2
  console.log("📜 Deploying ReceiptStore v2...");
  const Receipt = await ethers.getContractFactory("ReceiptStore");
  const receipt = await Receipt.deploy();
  await receipt.waitForDeployment();
  const receiptAddr = await receipt.getAddress();
  console.log("   ReceiptStore:", receiptAddr);

  // Step 2: Deploy InvoiceRegistry v2
  console.log("📋 Deploying InvoiceRegistry v2...");
  const Invoice = await ethers.getContractFactory("InvoiceRegistry");
  const invoice = await Invoice.deploy();
  await invoice.waitForDeployment();
  const invoiceAddr = await invoice.getAddress();
  console.log("   InvoiceRegistry:", invoiceAddr);

  // Step 3: Deploy StealthHelper (unchanged)
  console.log("🔐 Deploying StealthHelper...");
  const Stealth = await ethers.getContractFactory("StealthHelper");
  const stealth = await Stealth.deploy();
  await stealth.waitForDeployment();
  const stealthAddr = await stealth.getAddress();
  console.log("   StealthHelper:", stealthAddr);

  // Step 4: Link contracts together
  console.log("");
  console.log("🔗 Linking contracts...");

  // Link InvoiceRegistry -> ReceiptStore
  console.log("   Setting ReceiptStore on InvoiceRegistry...");
  const setReceiptTx = await invoice.setReceiptStore(receiptAddr);
  await setReceiptTx.wait();
  console.log("   ✓ InvoiceRegistry.setReceiptStore done");

  // Authorize InvoiceRegistry to write to ReceiptStore
  console.log("   Authorizing InvoiceRegistry as writer on ReceiptStore...");
  const authTx = await receipt.setAuthorizedWriter(invoiceAddr, true);
  await authTx.wait();
  console.log("   ✓ ReceiptStore.setAuthorizedWriter done");

  // Summary
  console.log("");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Deployment Complete!");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("");
  console.log("Contract Addresses:");
  console.log(`  INVOICE_REGISTRY: ${invoiceAddr}`);
  console.log(`  STEALTH_HELPER:   ${stealthAddr}`);
  console.log(`  RECEIPT_STORE:    ${receiptAddr}`);
  console.log("");
  // Get network info
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);
  const suffix = chainId === 137 ? "137" : "80002";
  const networkName = chainId === 137 ? "Polygon Mainnet" : "Polygon Amoy";

  console.log(`Environment Variables for ${networkName} (copy to .env.local):`);
  console.log(`  VITE_INVOICE_REGISTRY_${suffix}=${invoiceAddr}`);
  console.log(`  VITE_STEALTH_HELPER_${suffix}=${stealthAddr}`);
  console.log(`  VITE_RECEIPT_STORE_${suffix}=${receiptAddr}`);
  console.log("");

  // Verify setup
  console.log("🔍 Verifying setup...");
  const storedReceiptStore = await invoice.receiptStore();
  const isAuthorized = await receipt.authorizedWriters(invoiceAddr);
  console.log(`   InvoiceRegistry.receiptStore = ${storedReceiptStore}`);
  console.log(`   ReceiptStore.authorizedWriters[InvoiceRegistry] = ${isAuthorized}`);

  if (storedReceiptStore === receiptAddr && isAuthorized) {
    console.log("   ✓ All links verified!");
  } else {
    console.log("   ⚠ Warning: Links may not be correctly set");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
