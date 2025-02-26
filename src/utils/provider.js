const { ethers } = require('ethers');
const networks = require('../config/networks');

async function getProvider(network) {
    const rpcUrl = networks[network].rpcUrl;
    console.log(`Получение провайдера для сети ${network} с URL: ${rpcUrl}`);
    return new ethers.JsonRpcProvider(rpcUrl);
}

module.exports = { getProvider };
