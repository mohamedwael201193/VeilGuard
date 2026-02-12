const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Check pending tx count
  const nonce = await ethers.provider.getTransactionCount(deployer.address, "pending");
  const confirmedNonce = await ethers.provider.getTransactionCount(deployer.address, "latest");
  console.log("Nonce (pending):", nonce, "Nonce (confirmed):", confirmedNonce);

  const feeData = await ethers.provider.getFeeData();
  console.log("Gas price:", ethers.formatUnits(feeData.gasPrice, "gwei"), "gwei");

  console.log("\nDeploying InvoiceRegistry...");
  const Invoice = await ethers.getContractFactory("InvoiceRegistry");
  
  // Deploy with explicit gas settings
  const invoice = await Invoice.deploy({
    gasLimit: 5000000,
  });
  
  console.log("TX hash:", invoice.deploymentTransaction().hash);
  console.log("Waiting for confirmation...");
  await invoice.waitForDeployment();
  const invoiceAddr = await invoice.getAddress();
  console.log("InvoiceRegistry deployed:", invoiceAddr);

  console.log("\nDeploying StealthHelper...");
  const Stealth = await ethers.getContractFactory("StealthHelper");
  const stealth = await Stealth.deploy({
    gasLimit: 500000,
  });
  console.log("TX hash:", stealth.deploymentTransaction().hash);
  await stealth.waitForDeployment();
  const stealthAddr = await stealth.getAddress();
  console.log("StealthHelper deployed:", stealthAddr);

  console.log("\nDeploying ReceiptStore...");
  const Receipt = await ethers.getContractFactory("ReceiptStore");
  const receipt = await Receipt.deploy({
    gasLimit: 1000000,
  });
  console.log("TX hash:", receipt.deploymentTransaction().hash);
  await receipt.waitForDeployment();
  const receiptAddr = await receipt.getAddress();
  console.log("ReceiptStore deployed:", receiptAddr);

  console.log("\n========================================");
  console.log("Wave 5 Deployment Complete on Polygon Mainnet!");
  console.log("========================================");
  console.log("InvoiceRegistry:", invoiceAddr);
  console.log("StealthHelper:", stealthAddr);
  console.log("ReceiptStore:", receiptAddr);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("DEPLOYMENT FAILED:", error.message || error);
    if (error.code) console.error("Error code:", error.code);
    if (error.reason) console.error("Reason:", error.reason);
    if (error.transaction) console.error("TX:", error.transaction);
    process.exit(1);
  });
