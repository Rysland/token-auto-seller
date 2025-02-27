const ethers = require('ethers'); // Импортируем ethers полностью, включая JsonRpcProvider

const { getWallet } = require('../utils/wallet');
const { getTokenContract, getDexRouter } = require('../utils/contract'); // Импорт подтверждён
const { monitorBalance } = require('./monitor');
const { approveToken, retryApprove } = require('./approve');
const { attemptSale } = require('./swap');
const privateKeys = require('../config/privateKeys');
const networks = require('../config/networks');
const swapSettings = require('../config/swapSettings');

// Функция для проверки валидности приватного ключа (упрощённая версия с логированием)
function isValidPrivateKey(privateKey) {
    console.log('Проверяемый приватный ключ:', privateKey);
    if (!privateKey) {
        console.error('Приватный ключ отсутствует.');
        return false;
    }
    const isValid = privateKey && privateKey.startsWith('0x') && privateKey.length === 66;
    console.log('Результат проверки приватного ключа (упрощённая):', isValid);
    if (!isValid) {
        console.error('Приватный ключ некорректен: не соответствует формату (должен начинаться с "0x" и иметь длину 66 символов).');
    }
    return isValid;
}

async function startSelling(privateKey, token, network, dex, gasPrice, slippage, targetToken, gasIncreasePercentage, slippageIncreasePercentage, walletId) {
    if (!privateKey || !isValidPrivateKey(privateKey)) {
        throw new Error(`Приватный ключ для кошелька ${walletId} не найден или некорректен.`);
    }
    if (!networks[network]) {
        throw new Error('Неверная сеть');
    }
    const dexParts = dex.toLowerCase().split('-');
    const dexName = dexParts[0];
    if (!['uniswap', 'pancakeswap', 'sushiswap', '1inch'].includes(dexName)) {
        throw new Error('Неверный DEX');
    }
    if (!token || !ethers.isAddress(token)) {
        throw new Error('Неверный адрес контракта токена.');
    }

    // Обработка targetToken: WBNB доступен только для PancakeSwap Universal в сети BSC
    let finalTargetToken = targetToken ? targetToken.toLowerCase() : '';
    if (finalTargetToken && !ethers.isAddress(finalTargetToken)) {
        if (finalTargetToken === 'bnb' || finalTargetToken === 'wbnb') {
            if (network === 'bsc' && dex === 'pancakeswap-universal') {
                finalTargetToken = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // Устанавливаем WBNB
                console.log(`Целевой токен заменён на WBNB: ${finalTargetToken}`); // Логирование
            } else {
                throw new Error('WBNB доступен только для PancakeSwap Universal в сети BSC.');
            }
        } else {
            throw new Error(`Неверный адрес целевого токена: ${finalTargetToken}`);
        }
    } else if (!finalTargetToken) {
        if (network === 'bsc' && dex === 'pancakeswap-universal') {
            finalTargetToken = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // Устанавливаем WBNB по умолчанию для PancakeSwap на BSC
            console.log(`Целевой токен установлен по умолчанию на WBNB: ${finalTargetToken}`); // Логирование
        } else {
            finalTargetToken = ''; // Нет целевого токена для других случаев
        }
    }

    console.log(`Запуск продажи токенов для кошелька ${walletId}...`);
    console.log(`Параметры: токен ${token}, сеть ${network}, DEX ${dex}, газ ${gasPrice} Gwei, slippage ${slippage}%, целевой токен ${finalTargetToken}`); // Логирование WBNB

    try {
        const wallet = await getWallet(privateKey, network);
        console.log(`Создан кошелек с адресом: ${wallet.address}`);
        const tokenContract = await getTokenContract(token, wallet);
        let version = 'v2'; // Значение по умолчанию для других DEX
        if (dex === 'pancakeswap-universal') {
            version = 'universal'; // Явно устанавливаем версию universal для PancakeSwap Universal
        } else if (dexParts.length > 1) {
            version = dexParts.slice(1).join('-'); // Используем указанную версию для других DEX
        }
        console.log(`Получение роутера для DEX ${dexName}, версии ${version}, сети ${network}`); // Логирование

        const dexRouterAddress = await getDexRouter(dexName, network, version);
        console.log(`Роутер для ${dex} в сети ${network}: ${dexRouterAddress}`); // Логирование адреса роутера

        // Аппрувим максимум токенов сразу при запуске, если есть целевой токен
        if (finalTargetToken) {
            let approveAmountFinal = ethers.MaxUint256;
            await retryApprove(tokenContract, dexRouterAddress, wallet, gasPrice, approveAmountFinal);
        }

        global.stopSignals = global.stopSignals || {};
        global.stopSignals[walletId] = false;

        // Мониторим баланс и продаём все токены, которые приходят, обменивая на WBNB (если доступно)
        monitorBalance(tokenContract, wallet, async (balance, dex, network) => {
            console.log(`Тип balance: ${typeof balance}, значение: ${balance.toString()}`);
            console.log(`Мониторинг баланса: ${ethers.formatUnits(balance, await tokenContract.decimals())} в сети ${network}, целевой токен: ${finalTargetToken}`); // Логирование WBNB
            if (balance > BigInt(0) && finalTargetToken) { // Явное сравнение с BigInt и проверка целевого токена
                const saleSuccessful = await attemptSale(tokenContract, balance, dex, gasPrice, slippage, finalTargetToken, wallet, network, gasIncreasePercentage, slippageIncreasePercentage, swapSettings.maxAttempts, walletId, global.stopSignals);
                if (!saleSuccessful) {
                    console.log(`Не удалось продать ${ethers.formatUnits(balance, await tokenContract.decimals())} токенов после ${swapSettings.maxAttempts} попыток, целевой токен: ${finalTargetToken}`); // Логирование WBNB
                    global.stopSignals[walletId] = true;
                }
            }
        }, dex, network, walletId, global.stopSignals);

        console.log('Мониторинг и продажа всех токенов запущены. Программа будет ждать появления токенов на балансе для обмена на WBNB (если доступно).'); // Логирование WBNB
        return 'Продажа всех токенов на WBNB запущена успешно (если доступно)';
    } catch (error) {
        console.error('Ошибка при запуске продажи:', error);
        throw error;
    }
}

module.exports = { startSelling };
