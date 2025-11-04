const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "POL");
  
  console.log("\n--- Deploying to Polygon Mainnet ---\n");

  // Deploy InvoiceRegistry
  console.log("1/3 Deploying InvoiceRegistry...");
  const Invoice = await ethers.getContractFactory("InvoiceRegistry");
  const invoice = await Invoice.deploy({ gasLimit: 1000000 }); 
  console.log("   TX sent, waiting for confirmation...");
  await invoice.waitForDeployment();
  const invoiceAddr = await invoice.getAddress(); 
  console.log("   ✅ InvoiceRegistry:", invoiceAddr);

  // Deploy StealthHelper
  console.log("\n2/3 Deploying StealthHelper...");
  const Stealth = await ethers.getContractFactory("StealthHelper");
  const stealth = await Stealth.deploy({ gasLimit: 500000 }); 
  console.log("   TX sent, waiting for confirmation...");
  await stealth.waitForDeployment();
  const stealthAddr = await stealth.getAddress(); 
  console.log("   ✅ StealthHelper:", stealthAddr);

  // Deploy ReceiptStore
  console.log("\n3/3 Deploying ReceiptStore...");
  const Receipt = await ethers.getContractFactory("ReceiptStore");
  const receipt = await Receipt.deploy({ gasLimit: 500000 }); 
  console.log("   TX sent, waiting for confirmation...");
  await receipt.waitForDeployment();
  const receiptAddr = await receipt.getAddress(); 
  console.log("   ✅ ReceiptStore:", receiptAddr);

  console.log("\n--- Deployment Complete ---\n");
  console.log("VITE_INVOICE_REGISTRY_137=" + invoiceAddr);
  console.log("VITE_STEALTH_HELPER_137=" + stealthAddr);
  console.log("VITE_RECEIPT_STORE_137=" + receiptAddr);
  console.log("\nCopy these addresses to your .env.local file!");
}

main().catch((e) => { 
  console.error("\n❌ Deployment failed:", e.message); 
  process.exit(1); 
});
