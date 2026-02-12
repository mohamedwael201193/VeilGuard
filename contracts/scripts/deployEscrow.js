const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL");

  // Get current gas price
  const feeData = await hre.ethers.provider.getFeeData();
  console.log("Gas price:", hre.ethers.formatUnits(feeData.gasPrice || 0n, "gwei"), "gwei");

  // Deploy VeilEscrow
  console.log("\nDeploying VeilEscrow...");
  const VeilEscrow = await hre.ethers.getContractFactory("VeilEscrow");
  const escrow = await VeilEscrow.deploy({
    gasLimit: 3_000_000,
  });
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("VeilEscrow deployed to:", escrowAddr);

  console.log("\n✅ Deployment complete!");
  console.log("VeilEscrow:", escrowAddr);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Deployment failed:", err.message || err);
    process.exit(1);
  });
