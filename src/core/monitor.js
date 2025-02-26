const { ethers } = require('ethers'); // Добавляем импорт ethers

async function monitorBalance(token, wallet, callback, dex, network, walletId, stopSignals) {
    setInterval(async () => {
        if (stopSignals[walletId]) {
            console.log(`Мониторинг для кошелька ${walletId} остановлен`);
            clearInterval(this);
            return;
        }
        try {
            const balance = await token.balanceOf(wallet.address);
            console.log(`Тип balance: ${typeof balance}, значение: ${balance.toString()}`);
            console.log(`Мониторинг баланса: ${ethers.formatUnits(balance, await token.decimals())} в сети ${network}`);
            await callback(balance, dex, network);
        } catch (error) {
            console.error(`Ошибка мониторинга баланса: ${error}`);
        }
    }, 5000); // Проверка каждые 5 секунд
}

module.exports = { monitorBalance };
