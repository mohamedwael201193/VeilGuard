const { ethers } = require("hardhat");

async function main() {
  const invoiceId = "0x0d4b3129249ebacca0ed79a60e9484651756970305d39d02faac641132c57508";
  const invoiceRegistryAddr = "0xfD77DCa7Fd43aDf34381fbfb987089FddF4d2282";
  const txHashHint = "0xa414c97ca37ef08fee12e3c4b021af4fe78e1a22e97590c55218d3c3bb7ff826";
  const amount = 100000000;
  
  const [signer] = await ethers.getSigners();
  console.log("Signer:", await signer.getAddress());
  
  const InvoiceRegistry = await ethers.getContractFactory("InvoiceRegistry");
  const registry = InvoiceRegistry.attach(invoiceRegistryAddr);
  
  console.log("Marking invoice as paid...");
  try {
    const tx = await registry.markPaid(invoiceId, amount, txHashHint);
    console.log("Transaction sent:", tx.hash);
    const receipt = await tx.wait();
    console.log("Transaction confirmed! Gas used:", receipt.gasUsed.toString());
  } catch (error) {
    console.error("Error:", error.message);
    if (error.data) {
      console.error("Error data:", error.data);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
