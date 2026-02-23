/**
 * deployWave6.js — Deploy Wave 6 contracts to Polygon mainnet
 *
 * Deploys:
 *   1. VeilSubscription
 *   2. VeilSplitPay
 *   3. VeilBatchProcessor
 *   4. VeilMerchantIndex
 *   5. VeilDispute (constructor: existing VeilEscrow address)
 *
 * Post-deploy:
 *   - Adds deployer as arbitrator on VeilDispute
 *   - Outputs VITE_ env vars for frontend
 *
 * Usage:
 *   npx hardhat run --network polygon scripts/deployWave6.js
 */

const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const deployerAddr = await deployer.getAddress();
  const network = await ethers.provider.getNetwork();
  const chainId = Number(network.chainId);

  console.log("═══════════════════════════════════════════════");
  console.log("  VeilGuard — Wave 6 Deployment");
  console.log("═══════════════════════════════════════════════");
  console.log("Deployer:  ", deployerAddr);
  console.log("Chain ID:  ", chainId);
  console.log("Network:   ", chainId === 137 ? "Polygon PoS" : "Amoy Testnet");
  console.log("");

  // ── Existing contracts ────────────────────────────────────────
  const EXISTING_ESCROW = "0x4675f8567d1D6236F76Fe48De2450D5599156af1";
  console.log("Existing VeilEscrow:", EXISTING_ESCROW);
  console.log("");

  // ── 1. VeilSubscription ───────────────────────────────────────
  console.log("Deploying VeilSubscription...");
  const Subscription = await ethers.getContractFactory("VeilSubscription");
  const subscription = await Subscription.deploy();
  await subscription.waitForDeployment();
  const subscriptionAddr = await subscription.getAddress();
  console.log("  ✅ VeilSubscription:", subscriptionAddr);

  // ── 2. VeilSplitPay ──────────────────────────────────────────
  console.log("Deploying VeilSplitPay...");
  const SplitPay = await ethers.getContractFactory("VeilSplitPay");
  const splitPay = await SplitPay.deploy();
  await splitPay.waitForDeployment();
  const splitPayAddr = await splitPay.getAddress();
  console.log("  ✅ VeilSplitPay:", splitPayAddr);

  // ── 3. VeilBatchProcessor ────────────────────────────────────
  console.log("Deploying VeilBatchProcessor...");
  const BatchProcessor = await ethers.getContractFactory("VeilBatchProcessor");
  const batchProcessor = await BatchProcessor.deploy();
  await batchProcessor.waitForDeployment();
  const batchProcessorAddr = await batchProcessor.getAddress();
  console.log("  ✅ VeilBatchProcessor:", batchProcessorAddr);

  // ── 4. VeilMerchantIndex ─────────────────────────────────────
  console.log("Deploying VeilMerchantIndex...");
  const MerchantIndex = await ethers.getContractFactory("VeilMerchantIndex");
  const merchantIndex = await MerchantIndex.deploy();
  await merchantIndex.waitForDeployment();
  const merchantIndexAddr = await merchantIndex.getAddress();
  console.log("  ✅ VeilMerchantIndex:", merchantIndexAddr);

  // ── 5. VeilDispute ───────────────────────────────────────────
  console.log("Deploying VeilDispute...");
  const Dispute = await ethers.getContractFactory("VeilDispute");
  const dispute = await Dispute.deploy(EXISTING_ESCROW);
  await dispute.waitForDeployment();
  const disputeAddr = await dispute.getAddress();
  console.log("  ✅ VeilDispute:", disputeAddr);

  // ── Post-deploy setup ────────────────────────────────────────
  console.log("");
  console.log("Post-deploy setup...");

  // Add deployer as initial arbitrator
  console.log("  Adding deployer as arbitrator...");
  const addArbTx = await dispute.addArbitrator(deployerAddr);
  await addArbTx.wait();
  console.log("  ✅ Deployer added as arbitrator");

  // Verify arbitrator was set
  const isArb = await dispute.arbitrators(deployerAddr);
  console.log("  Arbitrator verified:", isArb);

  // ── Output ───────────────────────────────────────────────────
  console.log("");
  console.log("═══════════════════════════════════════════════");
  console.log("  Deployment Complete!");
  console.log("═══════════════════════════════════════════════");
  console.log("");
  console.log("Add these to your .env:");
  console.log("");
  console.log(`VITE_SUBSCRIPTION_${chainId}=${subscriptionAddr}`);
  console.log(`VITE_SPLIT_PAY_${chainId}=${splitPayAddr}`);
  console.log(`VITE_BATCH_PROCESSOR_${chainId}=${batchProcessorAddr}`);
  console.log(`VITE_MERCHANT_INDEX_${chainId}=${merchantIndexAddr}`);
  console.log(`VITE_DISPUTE_${chainId}=${disputeAddr}`);
  console.log("");
  console.log("All existing contracts:");
  console.log(`VITE_ESCROW_${chainId}=${EXISTING_ESCROW}`);
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
