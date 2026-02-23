require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

const pk = process.env.DEPLOYER_PK ? [process.env.DEPLOYER_PK] : [];

module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    amoy:    { url: process.env.AMOY_RPC,    accounts: pk, chainId: 80002 },
    polygon: { 
      url: process.env.POLYGON_RPC, 
      accounts: pk, 
      chainId: 137,
      timeout: 300000, // 5 minute timeout
    },
  },
  etherscan: { apiKey: process.env.POLYGONSCAN_API_KEY },
};
