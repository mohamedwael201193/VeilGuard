// Copies ABIs from contracts → shared/abi and web/src/abi
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const artifacts = path.join(root, "contracts", "artifacts", "contracts");
const destShared = path.join(root, "shared", "abi");
const destWeb = path.join(root, "web", "src", "abi");

const names = [
  "InvoiceRegistry.sol/InvoiceRegistry.json",
  "StealthHelper.sol/StealthHelper.json",
  "ReceiptStore.sol/ReceiptStore.json",
];

function ensureDir(p) { 
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); 
}

function main() {
  ensureDir(destShared); 
  ensureDir(destWeb);
  
  for (const rel of names) {
    const src = path.join(artifacts, rel);
    const json = JSON.parse(fs.readFileSync(src, "utf-8"));
    const abi = JSON.stringify(json.abi, null, 2);
    const base = path.basename(rel).replace(".json", ".abi.json");
    
    fs.writeFileSync(path.join(destShared, base), abi);
    fs.writeFileSync(path.join(destWeb, base), abi);
    console.log("Exported:", base);
  }
}

main();
