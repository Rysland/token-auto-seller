const { ethers } = require('ethers'); // Импорт ethers для BigNumber и ZeroAddress
const { getDexRouter } = require('../utils/contract'); // Импорт функции для получения роутера

async function swapTokens(token, amountIn, dex, gasPrice, slippage, targetToken, wallet, network) {
    const router = await getDexRouter(dex, network); // Получаем роутер DEX
    const provider = wallet.provider;
    const signer = wallet;

    // Определяем адреса токенов
    const tokenIn = token.address;
    let tokenOut = targetToken;
    if (!ethers.isAddress(tokenOut)) {
        throw new Error('Некорректный адрес целевого токена');
    }
    console.log(`Свап токена ${tokenIn} на ${tokenOut} (WBNB) через DEX ${dex} в сети ${network}`); // Логирование WBNB

    // Преобразуем amountIn и slippage в BigInt для точных вычислений
    const amountInBigInt = BigInt(amountIn.toString()); // Преобразуем в BigInt
    const slippageBigInt = BigInt(slippage.toString()) * BigInt(100); // Преобразуем slippage в проценты (например, 1% = 100)

    // Получаем путь для свапа
    const amounts = await router.getAmountsOut(amountInBigInt, [tokenIn, tokenOut]);
    if (!amounts || amounts.length < 2) {
        throw new Error('Некорректный путь для свапа');
    }

    // Расчёт минимальной суммы выхода с учётом slippage
    const amountOutMin = amounts[1].mul(BigInt(10000 - Number(slippageBigInt / BigInt(100)))).div(BigInt(10000)); // Явное преобразование для BigInt

    // Выполняем свап
    const tx = await router.swapExactTokensForTokens(
        amountInBigInt,
        amountOutMin,
        [tokenIn, tokenOut],
        wallet.address,
        Math.floor(Date.now() / 1000) + 300, // Deadline через 5 минут
        { gasPrice: ethers.BigNumber.from(gasPrice.toString()).mul(BigInt(1e9)) } // Gwei в wei, преобразование в BigInt
    );
    await tx.wait();
    console.log(`Свап успешно выполнен, транзакция: ${tx.hash}, целевой токен: ${tokenOut}`); // Логирование WBNB
    return true;
}

async function attemptSale(token, amountIn, dex, gasPrice, slippage, targetToken, wallet, network, gasIncreasePercentage, slippageIncreasePercentage, maxAttempts, walletId, stopSignals) {
    let currentGasPrice = BigInt(gasPrice.toString()) * BigInt(1e9); // Gwei в wei, преобразование в BigInt
    let currentSlippage = BigInt(slippage.toString()) * BigInt(100); // Преобразование строки в BigInt для процента

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (stopSignals[walletId]) return false;
        try {
            console.log(`Тип amount: ${typeof amountIn}, значение: ${amountIn.toString()}`);
            console.log(`Тип currentGasPrice до преобразования: ${typeof currentGasPrice}, значение: ${currentGasPrice.toString()}`);
            console.log(`Тип currentSlippage: ${typeof currentSlippage}, значение: ${currentSlippage.toString()}`);
            console.log(`Попытка продажи #${attempt} в сети ${network}, сумма: ${ethers.formatUnits(amountIn, await token.decimals())}, целевой токен: ${targetToken}`); // Логирование WBNB

            const success = await swapTokens(token, amountIn, dex, currentGasPrice, currentSlippage, targetToken, wallet, network);
            if (success) return true;

            // Увеличиваем газ и слиппедж на основе процентных значений
            const gasIncrease = BigInt(gasIncreasePercentage.toString());
            const slippageIncrease = BigInt(slippageIncreasePercentage.toString());
            currentGasPrice = currentGasPrice * (BigInt(100) + gasIncrease) / BigInt(100); // Явное преобразование
            currentSlippage = currentSlippage * (BigInt(100) + slippageIncrease) / BigInt(100); // Явное преобразование
        } catch (error) {
            console.error(`Попытка ${attempt} продажи провалилась: ${error}`);
        }
    }
    return false;
}

module.exports = { attemptSale, swapTokens };
