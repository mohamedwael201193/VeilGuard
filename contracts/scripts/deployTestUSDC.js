const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", await deployer.getAddress());

  const TestUSDC = await ethers.getContractFactory("TestUSDC");
  const usdc = await TestUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddr = await usdc.getAddress();
  console.log("TestUSDC deployed to:", usdcAddr);
  
  // Mint 1 million test tokens to deployer for testing
  console.log("Minting 1,000,000 tUSDC to deployer...");
  const mintTx = await usdc.mint(await deployer.getAddress(), ethers.parseUnits("1000000", 6));
  await mintTx.wait();
  console.log("Minted 1,000,000 tUSDC");
}

main().catch((e) => { console.error(e); process.exit(1); });
