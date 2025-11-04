require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const pk = process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [];

module.exports = {
  solidity: "0.8.24",
  networks: {
    amoy:    { url: process.env.AMOY_RPC,    accounts: pk, chainId: 80002 },
    polygon: { 
      url: process.env.POLYGON_RPC, 
      accounts: pk, 
      chainId: 137,
      gasPrice: 50000000000, // 50 gwei - higher priority
      timeout: 120000 // 2 minute timeout
    },
  },
  etherscan: { apiKey: process.env.POLYGONSCAN_API_KEY },
};
