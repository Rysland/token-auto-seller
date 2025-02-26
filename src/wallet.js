const { ethers } = require('ethers');

const RPC_URLS = {
    base: 'https://base-mainnet.public.blastapi.io',
    ethernet: 'https://rpc.ankr.com/eth',
    bsc: 'https://bsc-dataseed.binance.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io',
    polygon: 'https://polygon-rpc.com'
};

const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

const PANCAKESWAP_ABI = [
    "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) public view returns (uint[] memory amounts)"
];

// Адреса общих токенов (WBNB, WETH, USDT, USDC) для всех сетей
const WRAPPED_NATIVE_TOKENS = {
    base: '0x4200000000000000000000000000000000000006', // WETH on Base
    ethernet: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH on Ethereum
    bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB on BSC
    arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
    optimism: '0x4200000000000000000000000000000000000006', // WETH on Optimism
    polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270'  // WMATIC on Polygon
};

const TOKEN_ADDRESSES = {
    usdt: {
        ethernet: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        polygon: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        base: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
        arbitrum: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
        optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        bsc: '0x55d398326f99059fF775485246999027B3197955'
    },
    usdc: {
        ethernet: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        polygon: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        arbitrum: '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8',
        optimism: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
        bsc: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'
    },
    wbnb: { bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' }, // WBNB for BSC
    weth: {
        ethernet: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        base: '0x4200000000000000000000000000000000000006',
        arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
        optimism: '0x4200000000000000000000000000000000000006',
        polygon: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619' // WETH on Polygon (можно уточнить)
    }
};

async function getProvider(network) {
    const rpcUrl = RPC_URLS[network] || RPC_URLS.base;
    console.log(`Получение провайдера для сети ${network} с URL: ${rpcUrl}`);
    return new ethers.JsonRpcProvider(rpcUrl);
}

async function getWallet(privateKey, network) {
    const provider = await getProvider(network);
    console.log(`Инициализация кошелька с приватным ключом для сети ${network}`);
    return new ethers.Wallet(privateKey, provider);
}

async function getTokenContract(tokenAddress, wallet) {
    if (!tokenAddress) {
        throw new Error('Адрес токена не указан');
    }
    console.log(`Получение контракта токена по адресу: ${tokenAddress}`);
    return new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
}

async function getDexRouterAddress(dex, network) {
    const DEX_ROUTERS = {
        uniswap: {
            ethernet: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            base: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
            arbitrum: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            optimism: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            polygon: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            bsc: null
        },
        pancakeswap: {
            bsc: '0x10ED43C718714eb63d5aA57B78B54704E256024E'
        },
        sushiswap: {
            ethernet: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
            base: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            arbitrum: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            optimism: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            polygon: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506',
            bsc: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
        },
        '1inch': {
            ethernet: '0x1111111254fb6c44bAC0beD2854e76F90643097D',
            base: '0x1111111254fb6c44bAC0beD2854e76F90643097D',
            arbitrum: '0x1111111254fb6c44bAC0beD2854e76F90643097D',
            optimism: '0x1111111254fb6c44bAC0beD2854e76F90643097D',
            polygon: '0x1111111254fb6c44bAC0beD2854e76F90643097D',
            bsc: null
        }
    };
    console.log(`Получение адреса роутера DEX для ${dex} в сети ${network}`);
    return DEX_ROUTERS[dex]?.[network] || null;
}

async function approveToken(token, spender, wallet, gasPrice, amount) {
    try {
        console.log(`Проверка аппрува для токена ${token.address}, спендер: ${spender}, сумма: ${amount.toString()}`);
        const currentAllowance = await token.allowance(wallet.address, spender);
        console.log(`Текущий аппрув: ${currentAllowance.toString()}`);
        if (currentAllowance >= amount) {
            console.log('Аппрув уже установлен или превышает запрошенное количество:', currentAllowance.toString());
            return 'Аппрув уже активен.';
        }

        console.log('Подготовка аппрува:', { spender, amount: amount.toString(), gasPrice });
        const tx = await token.approve(spender, amount, {
            gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'),
            gasLimit: 100000 // Можно настроить вручную, если нужно
        });
        console.log('Транзакция аппрува отправлена:', tx.hash);
        await tx.wait();
        console.log('Токен успешно аппрувлен для:', spender, 'на сумму:', amount.toString());
        return 'Аппрув выполнен успешно.';
    } catch (error) {
        console.error('Ошибка аппрува:', error);
        throw error;
    }
}

async function retryApprove(token, spender, wallet, gasPrice, amount, maxRetries = 5, delay = 5000) {
    let attempts = 0;
    while (attempts < maxRetries) {
        try {
            console.log(`Попытка аппрува #${attempts + 1}`);
            return await approveToken(token, spender, wallet, gasPrice, amount);
        } catch (error) {
            attempts++;
            if (attempts === maxRetries) {
                console.error(`Не удалось выполнить аппрув после ${maxRetries} попыток:`, error);
                throw new Error(`Не удалось выполнить аппрув после ${maxRetries} попыток: ${error.message}`);
            }
            console.log(`Попытка ${attempts} провалилась. Повтор через ${delay / 1000} секунд...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function monitorBalance(tokenContract, wallet, callback, dex, network, walletId, stopSignal) {
    while (!stopSignal[walletId]) {
        try {
            console.log(`Мониторинг баланса для адреса ${wallet.address} в сети ${network}`);
            const balance = await tokenContract.balanceOf(wallet.address);
            if (balance > 0n) {
                console.log(`Обнаружен баланс: ${ethers.formatUnits(balance, await tokenContract.decimals())} для сети ${network}`);
                await callback(balance, dex, network);
            }
        } catch (error) {
            console.error('Ошибка мониторинга баланса:', error);
        }
        await new Promise(resolve => setTimeout(resolve, 500)); // Проверка каждые 0.5 секунды
    }
    console.log(`Мониторинг для кошелька ${walletId} остановлен`);
}

async function swapTokens(amountIn, amountOutMin, path, wallet, gasPrice, slippage, dex, network) {
    if (!path || path.length < 2 || !path[0] || !path[1]) {
        throw new Error('Некорректный путь для свапа');
    }

    const routerAddress = await getDexRouterAddress(dex, network);
    if (!routerAddress) throw new Error(`Роутер для ${dex} в сети ${network} не найден`);

    const router = new ethers.Contract(routerAddress, PANCAKESWAP_ABI, wallet);
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 минут в будущем

    console.log(`Тип amountIn: ${typeof amountIn}, значение: ${amountIn.toString()}`);
    console.log(`Тип amountOutMin: ${typeof amountOutMin}, значение: ${amountOutMin.toString()}`);
    console.log(`Свап токенов: ${ethers.formatUnits(amountIn, await getTokenDecimals(path[0], wallet))} -> ${ethers.formatUnits(amountOutMin, await getTokenDecimals(path[1], wallet))}`);
    console.log(`Путь для свапа: ${path}`);

    const tx = await router.swapExactTokensForTokens(
        BigInt(amountIn), // Убедимся, что это BigInt
        BigInt(amountOutMin), // Убедимся, что это BigInt
        path,
        wallet.address,
        deadline,
        { gasPrice: ethers.parseUnits(gasPrice.toString(), 'gwei'), gasLimit: 300000 }
    );
    await tx.wait();
    console.log('Свап успешно выполнен:', tx.hash);
    return tx;
}

async function getTokenDecimals(tokenAddress, wallet) {
    try {
        const token = await getTokenContract(tokenAddress, wallet);
        return await token.decimals();
    } catch (error) {
        console.error(`Ошибка получения десятичных знаков для токена ${tokenAddress}:`, error);
        return 18; // Значение по умолчанию для большинства токенов ERC-20
    }
}

async function attemptSale(token, amount, dex, gasPrice, slippage, targetToken, wallet, network, gasIncreasePercentage, slippageIncreasePercentage, maxAttempts = 10, walletId, stopSignal) {
    console.log(`Тип amount: ${typeof amount}, значение: ${amount.toString()}`);
    let currentGasPrice = ethers.parseUnits(gasPrice.toString(), 'gwei');
    console.log(`Тип currentGasPrice до преобразования: ${typeof currentGasPrice}, значение: ${currentGasPrice.toString()}`);
    currentGasPrice = BigInt(currentGasPrice); // Преобразуем в BigInt
    console.log(`Тип currentGasPrice после преобразования: ${typeof currentGasPrice}, значение: ${currentGasPrice.toString()}`);

    // slippage передаётся как процент (например, 1 для 1%), преобразуем в BigInt для вычислений
    console.log(`Тип slippage: ${typeof slippage}, значение: ${slippage}%`);
    let currentSlippage = BigInt(Math.floor(slippage * 100)); // 1% → 100, 0.5% → 50
    console.log(`Тип currentSlippage: ${typeof currentSlippage}, значение: ${currentSlippage.toString()}`);

    let attempts = 0;

    while (attempts < maxAttempts && !stopSignal[walletId]) {
        try {
            console.log(`Попытка продажи #${attempts + 1} в сети ${network}, сумма: ${ethers.formatUnits(amount, await token.decimals())}`);
            const minAmountOut = calculateMinAmount(amount, slippage / 100); // Передаём slippage как десятичное (0.01 для 1%)
            console.log(`Тип minAmountOut: ${typeof minAmountOut}, значение: ${minAmountOut.toString()}`);

            const wrappedNativeToken = WRAPPED_NATIVE_TOKENS[network];
            const sourceToken = token.address;
            const targetTokenAddress = getTokenAddress(targetToken, network);

            let path;
            if (!targetTokenAddress) {
                console.log(`Целевой токен ${targetToken} не найден, используем ${wrappedNativeToken} как промежуточный токен`);
                path = [sourceToken, wrappedNativeToken]; // Используем WBNB/WETH как промежуточный токен
            } else {
                path = [sourceToken, targetTokenAddress];
            }
            console.log(`Путь для свапа: ${path.join(', ')}`);

            const tx = await swapTokens(amount, minAmountOut, path, wallet, currentGasPrice.toString(), slippage, dex, network);
            console.log('Токены успешно проданы:', tx.hash);

            const saleConfirmed = await confirmSaleStatus(tx.hash, network, wallet);
            if (saleConfirmed) {
                console.log('Продажа подтверждена успешно.');
                return true; // Успешная продажа
            } else {
                throw new Error('Транзакция продажи провалилась.');
            }
        } catch (error) {
            console.error(`Попытка ${attempts + 1} продажи провалилась:`, error);
            attempts++;

            if (attempts === maxAttempts) {
                console.error(`Не удалось продать токены после ${maxAttempts} попыток:`, error.message);
                stopSignal[walletId] = true; // Устанавливаем сигнал остановки
                return false; // Неудачная продажа после всех попыток
            }

            // Увеличиваем газ и slippage для следующей попытки
            currentGasPrice = currentGasPrice * BigInt(100 + BigInt(gasIncreasePercentage)) / BigInt(100);
            currentSlippage += BigInt(Math.floor(slippageIncreasePercentage * 100)); // Увеличиваем slippage в процентах (например, 0.5% → 50)
            console.log(`Увеличен газ до ${currentGasPrice.toString()} WEI, slippage до ${(currentSlippage / 100).toFixed(2)}%`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    stopSignal[walletId] = true; // Останавливаем, если достигли максимум попыток
    return false; // Неудачная продажа после всех попыток
}

async function confirmSaleStatus(txHash, network, wallet) {
    const provider = await getProvider(network);
    console.log(`Проверка статуса транзакции ${txHash} в сети ${network}`);
    let receipt;
    try {
        receipt = await provider.waitForTransaction(txHash, 1, 30000); // Ждём до 30 секунд
        if (receipt.status === 1) {
            console.log('Транзакция подтверждена успешно.');
            return true;
        } else {
            console.log('Транзакция провалилась.');
            return false;
        }
    } catch (error) {
        console.error('Ошибка подтверждения транзакции:', error);
        return false;
    }
}

async function scanForERC20Tokens(address, network) {
    console.log(`Сканирование токенов ERC-20 для адреса ${address} в сети ${network}`);
    const provider = await getProvider(network);
    const contracts = {};
    const knownTokens = {
        base: {
            '0x4200000000000000000000000000000000000006': 'WETH',
            '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913': 'USDC',
            '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA': 'USDT'
        },
        ethernet: {
            '0xdAC17F958D2ee523a2206206994597C13D831ec7': 'USDT',
            '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 'USDC',
            '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2': 'WETH'
        },
        bsc: {
            '0x55d398326f99059fF775485246999027B3197955': 'USDT',
            '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d': 'USDC',
            '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c': 'WBNB'
        },
        arbitrum: {
            '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9': 'USDT',
            '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8': 'USDC',
            '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1': 'WETH'
        },
        optimism: {
            '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85': 'USDT',
            '0x7F5c764cBc14f9669B88837ca1490cCa17c31607': 'USDC',
            '0x4200000000000000000000000000000000000006': 'WETH'
        },
        polygon: {
            '0xc2132D05D31c914a87C6611C10748AEb04B58e8F': 'USDT',
            '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 'USDC',
            '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270': 'WMATIC'
        }
    };

    for (const [contract, ticker] of Object.entries(knownTokens[network] || {})) {
        try {
            const token = new ethers.Contract(contract, ERC20_ABI, provider);
            const balance = await token.balanceOf(address);
            const decimals = await token.decimals();
            if (balance > 0n) {
                console.log(`Найден токен ${ticker} по адресу ${contract} с балансом ${ethers.formatUnits(balance, decimals)} в сети ${network}`);
                contracts[contract] = {
                    ticker: ticker,
                    balance: ethers.formatUnits(balance, decimals)
                };
            }
        } catch (error) {
            console.error(`Ошибка получения токена ${contract} в сети ${network}:`, error);
            if (error.code !== 'BAD_DATA' && error.code !== 'CALL_EXCEPTION') {
                throw error;
            }
            continue;
        }
    }
    return contracts;
}

async function startSelling(privateKey, tokenContract, tokenDecimals, network, dex, gasPrice, slippage, targetToken, sellAmount, sellAmountPercentage, approveAmount, approveAmountPercentage, gasIncreasePercentage, slippageIncreasePercentage, expectedTokenAmount, walletId) {
    try {
        console.log(`Запуск продажи токенов в сети ${network} с приватным ключом и контрактом ${tokenContract}`);
        const wallet = await getWallet(privateKey, network);
        const token = await getTokenContract(tokenContract, wallet);
        
        const actualDecimals = tokenDecimals || 18;
        const dexRouterAddress = await getDexRouterAddress(dex, network);
        if (!dexRouterAddress) {
            throw new Error(`Роутер для ${dex} в сети ${network} не найден`);
        }

        let approveAmountFinal;
        if (approveAmount) {
            approveAmountFinal = BigInt(approveAmount);
        } else if (expectedTokenAmount) {
            const expectedInWei = ethers.parseUnits(expectedTokenAmount.toString(), actualDecimals);
            approveAmountFinal = expectedInWei * BigInt(Math.floor(approveAmountPercentage * 100)) / BigInt(100);
            if (approveAmountPercentage === 100) {
                approveAmountFinal = ethers.MaxUint256;
            }
        } else {
            const totalSupply = await token.totalSupply();
            const baseAmount = totalSupply / BigInt(10 ** (18 - actualDecimals));
            approveAmountFinal = baseAmount * BigInt(Math.floor(approveAmountPercentage * 100)) / BigInt(100) * BigInt(10 ** actualDecimals);
            if (approveAmountPercentage === 100) {
                approveAmountFinal = ethers.MaxUint256;
            }
        }

        console.log(`Тип approveAmountFinal: ${typeof approveAmountFinal}, значение: ${approveAmountFinal.toString()}`);
        console.log(`Выполнение аппрува на сумму ${ethers.formatUnits(approveAmountFinal, actualDecimals)}`);

        await retryApprove(token, dexRouterAddress, wallet, gasPrice, approveAmountFinal);

        // Используем глобальный stopSignal
        global.stopSignals = global.stopSignals || {};
        global.stopSignals[walletId] = false;

        monitorBalance(token, wallet, async (balance, dex, network) => {
            console.log(`Тип balance: ${typeof balance}, значение: ${balance.toString()}`);
            console.log(`Мониторинг баланса: ${ethers.formatUnits(balance, actualDecimals)} в сети ${network}`);
            let sellAmountFinal;
            if (sellAmount) {
                sellAmountFinal = BigInt(sellAmount);
            } else if (expectedTokenAmount) {
                const expectedInWei = ethers.parseUnits(expectedTokenAmount.toString(), actualDecimals);
                sellAmountFinal = expectedInWei * BigInt(Math.floor(sellAmountPercentage * 100)) / BigInt(100);
            } else {
                const baseBalance = balance / BigInt(10 ** actualDecimals);
                sellAmountFinal = baseBalance * BigInt(Math.floor(sellAmountPercentage * 100)) / BigInt(100) * BigInt(10 ** actualDecimals);
            }

            const saleSuccessful = await attemptSale(token, sellAmountFinal, dex, gasPrice, slippage, targetToken, wallet, network, gasIncreasePercentage, slippageIncreasePercentage, 10, walletId, global.stopSignals);
            if (!saleSuccessful) {
                console.log(`Не удалось продать ${ethers.formatUnits(sellAmountFinal, actualDecimals)} токенов после 10 попыток.`);
                global.stopSignals[walletId] = true;
            }
        }, dex, network, walletId, global.stopSignals);

        console.log('Мониторинг и продажа токенов запущены. Аппрув выполнен или уже активен.');
        return "Мониторинг и продажа токенов запущены. Аппрув выполнен или уже активен.";
    } catch (error) {
        console.error('Ошибка в startSelling:', error);
        throw new Error(`Ошибка при запуске: ${error.message}`);
    }
}

function calculateMinAmount(amount, slippage) {
    console.log(`Тип amount: ${typeof amount}, значение: ${amount.toString()}`);
    console.log(`Тип slippage: ${typeof slippage}, значение: ${slippage}%`);
    console.log(`Расчёт минимальной суммы с slippage ${slippage}%`);
    return amount * BigInt(Math.floor((1 - (slippage / 100)) * 10000)) / BigInt(10000); // Преобразуем процент (1) в десятичное (0.01) для вычислений
}

function getTokenAddress(targetToken, network) {
    const tokenAddresses = {
        ...TOKEN_ADDRESSES,
        bnb: { bsc: WRAPPED_NATIVE_TOKENS.bsc }, // BNB → WBNB на BSC
        eth: { ethernet: WRAPPED_NATIVE_TOKENS.ethernet }, // ETH → WETH на Ethereum
        matic: { polygon: WRAPPED_NATIVE_TOKENS.polygon }  // MATIC → WMATIC на Polygon
    };
    return tokenAddresses[targetToken.toLowerCase()]?.[network] || null;
}

function updateStatus(message) {
    console.log(`Статус: ${message}`);
}

module.exports = { startSelling, scanForERC20Tokens };
