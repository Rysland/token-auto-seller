const { ethers } = require('ethers');

const DEX_ROUTERS = {
    // Uniswap V3 Router для разных сетей
    uniswap: {
        ethereum: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Ethereum Mainnet
        base: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Base (пример, проверьте актуальный адрес)
        arbitrum: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Arbitrum One
        optimism: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Optimism
        polygon: '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Polygon
        bsc: null // PancakeSwap используется для BSC вместо Uniswap
    },
    // PancakeSwap Router для BSC
    pancakeswap: {
        bsc: '0x10ED43C718714eb63d5aA57B78B54704E256024E' // BSC Mainnet
    },
    // SushiSwap Router для разных сетей
    sushiswap: {
        ethereum: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F', // Ethereum Mainnet
        base: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // Base (пример, проверьте актуальный адрес)
        arbitrum: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // Arbitrum
        optimism: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // Optimism
        polygon: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // Polygon
        bsc: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506' // BSC
    },
    // 1inch Router для разных сетей
    '1inch': {
        ethereum: '0x1111111254fb6c44bAC0beD2854e76F90643097D', // Ethereum Mainnet
        base: '0x1111111254fb6c44bAC0beD2854e76F90643097D', // Base (пример, проверьте актуальный адрес)
        arbitrum: '0x1111111254fb6c44bAC0beD2854e76F90643097D', // Arbitrum
        optimism: '0x1111111254fb6c44bAC0beD2854e76F90643097D', // Optimism
        polygon: '0x1111111254fb6c44bAC0beD2854e76F90643097D', // Polygon
        bsc: null // 1inch не активно на BSC, используйте другие DEX
    }
};

const UNISWAP_V3_ROUTER_ABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)"
    // Добавьте другие методы Uniswap V3
];

const PANCAKESWAP_ROUTER_ABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
    // Добавьте другие методы PancakeSwap
];

const SUSHIswap_ROUTER_ABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
    // Добавьте другие методы SushiSwap
];

const ONEINCH_ROUTER_ABI = [
    "function swap(address fromToken, address destToken, uint256 amount, uint256 minReturn, uint256[] calldata distribution, uint256 flags) external payable returns (uint256 returnAmount)",
    "function unoswap(address fromToken, address toToken, uint256 amount, uint256 minReturn, address payable referrer) external payable returns (uint256 returnAmount)"
    // Добавьте другие методы 1inch
];

async function getDexRouter(dex, network, provider) {
    const routerAddress = DEX_ROUTERS[dex]?.[network];
    if (!routerAddress) {
        throw new Error(`Роутер для ${dex} в сети ${network} не найден`);
    }

    let abi;
    switch (dex) {
        case 'uniswap':
            abi = UNISWAP_V3_ROUTER_ABI;
            break;
        case 'pancakeswap':
            abi = PANCAKESWAP_ROUTER_ABI;
            break;
        case 'sushiswap':
            abi = SUSHIswap_ROUTER_ABI;
            break;
        case '1inch':
            abi = ONEINCH_ROUTER_ABI;
            break;
        default:
            throw new Error(`Неизвестный DEX: ${dex}`);
    }

    return new ethers.Contract(routerAddress, abi, provider);
}

async function swapTokens(amountIn, amountOutMin, path, wallet, gasPrice, slippage, dex, network) {
    const provider = wallet.provider;
    const router = await getDexRouter(dex, network, provider);

    let tx;
    switch (dex) {
        case 'uniswap':
        case 'sushiswap':
        case 'pancakeswap':
            tx = await router.swapExactTokensForTokens(
                amountIn,
                amountOutMin, // Учитываем slippage
                path,
                wallet.address,
                Math.floor(Date.now() / 1000) + 60 * 20, // Deadline 20 минут
                { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }
            );
            break;
        case '1inch':
            tx = await router.unoswap(
                path[0], // fromToken
                path[path.length - 1], // toToken
                amountIn,
                amountOutMin, // minReturn
                wallet.address, // referrer (или null для отсутствия рефералов)
                { gasPrice: ethers.utils.parseUnits(gasPrice.toString(), 'gwei') }
            );
            break;
        default:
            throw new Error(`Неизвестный DEX: ${dex}`);
    }

    await tx.wait();
    return tx;
}

module.exports = { swapTokens };
