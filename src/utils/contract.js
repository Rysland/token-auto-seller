const ethers = require('ethers'); // Импортируем ethers полностью, включая JsonRpcProvider

const networks = require('../config/networks');
const dexConfig = require('../config/dex');

async function getTokenContract(tokenAddress, wallet) {
    const abi = [
        'function balanceOf(address owner) view returns (uint256)',
        'function decimals() view returns (uint8)',
        'function approve(address spender, uint256 amount) returns (bool)',
        'function allowance(address owner, address spender) view returns (uint256)'
    ];
    return new ethers.Contract(tokenAddress, abi, wallet);
}

async function getDexRouter(dexName, network, version = 'universal') {
    console.log(`Получение роутера для DEX ${dexName}, версии ${version}, сети ${network}`); // Логирование
    const config = dexConfig[dexName] || {};
    const networkConfig = config[version] || {};
    const routerAddress = networkConfig[network];

    if (!routerAddress) {
        throw new Error(`Роутер для ${dexName}-${version} в сети ${network} не найден. Проверьте конфигурацию в src/config/dex.js`);
    }

    // Проверка доступности JsonRpcProvider напрямую (оставляем только для критических случаев)
    if (typeof ethers.JsonRpcProvider !== 'function') {
        throw new Error('Ethers JsonRpcProvider is not available or not a function. Check ethers installation or import.');
    }

    return new ethers.Contract(routerAddress, getRouterABI(dexName, version), new ethers.JsonRpcProvider(networks[network].rpcUrl));
}

function getRouterABI(dexName, version) {
    // Пример ABI для PancakeSwap Universal Router (может потребоваться уточнение)
    return [
        'function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)',
        'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)'
    ];
}

module.exports = { getTokenContract, getDexRouter };
