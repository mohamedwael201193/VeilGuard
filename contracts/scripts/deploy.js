const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const Invoice = await ethers.getContractFactory("InvoiceRegistry");
  const invoice = await Invoice.deploy(); 
  await invoice.waitForDeployment();
  const invoiceAddr = await invoice.getAddress(); 
  console.log("InvoiceRegistry:", invoiceAddr);

  const Stealth = await ethers.getContractFactory("StealthHelper");
  const stealth = await Stealth.deploy(); 
  await stealth.waitForDeployment();
  const stealthAddr = await stealth.getAddress(); 
  console.log("StealthHelper:", stealthAddr);

  const Receipt = await ethers.getContractFactory("ReceiptStore");
  const receipt = await Receipt.deploy(); 
  await receipt.waitForDeployment();
  const receiptAddr = await receipt.getAddress(); 
  console.log("ReceiptStore:", receiptAddr);
}

main().catch((e) => { console.error(e); process.exit(1); });
