const { ethers } = require('ethers');
const { getProvider } = require('./provider');

async function getWallet(privateKey, network) {
    const provider = await getProvider(network);
    console.log(`Инициализация кошелька с приватным ключом для сети ${network}`);
    return new ethers.Wallet(privateKey, provider);
}

module.exports = { getWallet };
