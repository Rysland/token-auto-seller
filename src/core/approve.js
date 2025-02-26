const { ethers } = require('ethers');
const { getTokenContract } = require('../utils/contract');
const { updateStatus } = require('../utils/logging');
const swapSettings = require('../config/swapSettings');

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
            gasLimit: swapSettings.gasLimit
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

module.exports = { approveToken, retryApprove };
