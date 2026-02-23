/**
 * Step-by-step Wave 6 deployment — deploys one contract at a time
 * with better error handling and gas options
 *
 * Usage: npx hardhat run --network polygon scripts/deployW6Step.js
 */

const { ethers } = require("hardhat");

// Change this to control which step to deploy
const STEP = parseInt(process.env.DEPLOY_STEP || "1");

// Already deployed addresses (fill in as you go)
const deployed = {
  escrow: "0x4675f8567d1D6236F76Fe48De2450D5599156af1",
  subscription: process.env.W6_SUBSCRIPTION || "",
  splitPay: process.env.W6_SPLITPAY || "",
  batchProcessor: process.env.W6_BATCH || "",
  merchantIndex: process.env.W6_MERCHANT || "",
  dispute: process.env.W6_DISPUTE || "",
};

async function main() {
  const [deployer] = await ethers.getSigners();
  const addr = await deployer.getAddress();
  const balance = await ethers.provider.getBalance(addr);
  console.log(`Deployer: ${addr}`);
  console.log(`Balance: ${ethers.formatEther(balance)} POL`);
  console.log(`Step: ${STEP}`);
  console.log("");

  if (STEP === 1) {
    console.log("Deploying VeilSubscription...");
    console.log("Getting contract factory...");
    const F = await ethers.getContractFactory("VeilSubscription");
    console.log("Factory ready. Sending deploy tx...");
    try {
      const c = await F.deploy();
      console.log("Deploy tx sent. Waiting for confirmation...");
      await c.waitForDeployment();
      const a = await c.getAddress();
      console.log("VeilSubscription:", a);
      console.log(`\nNext: set W6_SUBSCRIPTION=${a} and DEPLOY_STEP=2`);
    } catch (e) {
      console.error("Deploy error:", e);
      throw e;
    }
  } else if (STEP === 2) {
    console.log("Deploying VeilSplitPay...");
    const F = await ethers.getContractFactory("VeilSplitPay");
    const c = await F.deploy();
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log("VeilSplitPay:", a);
    console.log(`\nNext: set W6_SPLITPAY=${a} and DEPLOY_STEP=3`);
  } else if (STEP === 3) {
    console.log("Deploying VeilBatchProcessor...");
    const F = await ethers.getContractFactory("VeilBatchProcessor");
    const c = await F.deploy();
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log("VeilBatchProcessor:", a);
    console.log(`\nNext: set W6_BATCH=${a} and DEPLOY_STEP=4`);
  } else if (STEP === 4) {
    console.log("Deploying VeilMerchantIndex...");
    const F = await ethers.getContractFactory("VeilMerchantIndex");
    const c = await F.deploy();
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log("VeilMerchantIndex:", a);
    console.log(`\nNext: set W6_MERCHANT=${a} and DEPLOY_STEP=5`);
  } else if (STEP === 5) {
    console.log("Deploying VeilDispute...");
    const F = await ethers.getContractFactory("VeilDispute");
    const c = await F.deploy(deployed.escrow);
    await c.waitForDeployment();
    const a = await c.getAddress();
    console.log("VeilDispute:", a);

    // Add deployer as arbitrator
    console.log("Adding deployer as arbitrator...");
    const addTx = await c.addArbitrator(addr);
    await addTx.wait();
    console.log("Arbitrator added!");
    console.log(`\nAll 5 contracts deployed!`);
  }
}

main().catch((e) => {
  console.error("Deploy failed:", e.message || e);
  process.exit(1);
});
