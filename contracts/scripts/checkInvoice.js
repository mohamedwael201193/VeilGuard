const { ethers } = require("hardhat");

async function main() {
  const invoiceId = "0x0d4b3129249ebacca0ed79a60e9484651756970305d39d02faac641132c57508";
  const invoiceRegistryAddr = "0xfD77DCa7Fd43aDf34381fbfb987089FddF4d2282";
  
  const InvoiceRegistry = await ethers.getContractFactory("InvoiceRegistry");
  const registry = InvoiceRegistry.attach(invoiceRegistryAddr);
  
  console.log("Checking invoice:", invoiceId);
  const invoice = await registry.getInvoice(invoiceId);
  
  console.log("Merchant:", invoice.merchant);
  console.log("Token:", invoice.token);
  console.log("Amount:", invoice.amount.toString());
  console.log("Stealth Address:", invoice.stealthAddress);
  console.log("Paid:", invoice.paid);
}

main().catch((e) => { console.error(e); process.exit(1); });
