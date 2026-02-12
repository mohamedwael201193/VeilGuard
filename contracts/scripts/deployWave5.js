const { ethers } = require("hardhat");

async function main() {
  try {
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", await deployer.getAddress());
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Balance:", ethers.formatEther(balance), "POL");

    console.log("\nDeploying InvoiceRegistry...");
    const Invoice = await ethers.getContractFactory("InvoiceRegistry");
    const invoice = await Invoice.deploy();
    console.log("Waiting for InvoiceRegistry confirmation...");
    await invoice.waitForDeployment();
    const invoiceAddr = await invoice.getAddress();
    console.log("InvoiceRegistry:", invoiceAddr);

    console.log("\nDeploying StealthHelper...");
    const Stealth = await ethers.getContractFactory("StealthHelper");
    const stealth = await Stealth.deploy();
    console.log("Waiting for StealthHelper confirmation...");
    await stealth.waitForDeployment();
    const stealthAddr = await stealth.getAddress();
    console.log("StealthHelper:", stealthAddr);

    console.log("\nDeploying ReceiptStore...");
    const Receipt = await ethers.getContractFactory("ReceiptStore");
    const receipt = await Receipt.deploy();
    console.log("Waiting for ReceiptStore confirmation...");
    await receipt.waitForDeployment();
    const receiptAddr = await receipt.getAddress();
    console.log("ReceiptStore:", receiptAddr);

    // Set up ReceiptStore authorization
    console.log("\nSetting ReceiptStore in InvoiceRegistry...");
    const setTx = await invoice.setReceiptStore(receiptAddr);
    await setTx.wait();
    console.log("ReceiptStore linked to InvoiceRegistry");

    // Authorize InvoiceRegistry in ReceiptStore
    console.log("Authorizing InvoiceRegistry in ReceiptStore...");
    const authTx = await receipt.authorize(invoiceAddr);
    await authTx.wait();
    console.log("InvoiceRegistry authorized in ReceiptStore");

    console.log("\n========================================");
    console.log("Wave 5 Deployment Complete!");
    console.log("========================================");
    console.log("InvoiceRegistry:", invoiceAddr);
    console.log("StealthHelper:", stealthAddr);
    console.log("ReceiptStore:", receiptAddr);
    console.log("\nUpdate your .env.local with:");
    console.log(`VITE_INVOICE_REGISTRY_137=${invoiceAddr}`);
    console.log(`VITE_STEALTH_HELPER_137=${stealthAddr}`);
    console.log(`VITE_RECEIPT_STORE_137=${receiptAddr}`);
  } catch (error) {
    console.error("Deployment error:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

main();
