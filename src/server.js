const express = require('express');
const path = require('path');
const { startSelling } = require('./core/start'); // Используем обновлённый модуль
const { ethers } = require('ethers'); // Импортируем ethers
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('Запускаем сервер Express, проверяем наличие UI...');

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

// Middleware для парсинга JSON
app.use(express.json());

// Обслуживание статических файлов из src/ui/
app.use(express.static(path.join(__dirname, 'ui')));
// Обслуживание файлов node_modules для JavaScript-библиотек
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// Маршрут для главной страницы (index.html)
app.get('/', (req, res) => {
    console.log('Запрос на главную страницу, попытка отправить index.html');
    res.sendFile(path.join(__dirname, 'ui/index.html'), (err) => {
        if (err) {
            console.error('Ошибка при отправке index.html:', err);
            res.status(500).send('Ошибка сервера');
        }
    });
});

// API для запуска продажи токенов
app.post('/api/start', async (req, res) => {
    try {
        const { walletId, tokenContract, tokenDecimals, network, dex, gasPrice, slippage, targetToken, gasIncreasePercentage, slippageIncreasePercentage } = req.body;
        console.log('Запущена продажа токенов для кошелька:', walletId, { network, dex, slippage: `${slippage}%`, targetToken: targetToken || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' }); // Логирование WBNB

        const privateKeys = require('./config/privateKeys');
        const privateKey = privateKeys[walletId];
        console.log(`Полученный приватный ключ для кошелька ${walletId}:`, privateKey);
        if (!privateKey || !isValidPrivateKey(privateKey)) {
            throw new Error(`Приватный ключ для кошелька ${walletId} не найден или некорректен`);
        }

        console.log('Проверка DEX:', dex); // Отладочное логирование
        console.log('Проверка баланса токена и целевого токена:', { tokenContract, targetToken: targetToken || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' }); // Логирование WBNB
        const result = await startSelling(privateKey, tokenContract, network, dex, gasPrice, slippage, targetToken || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', gasIncreasePercentage, slippageIncreasePercentage, walletId);
        res.json({ message: result });
    } catch (error) {
        console.error('Ошибка в /api/start:', error);
        res.status(500).json({ message: `Ошибка: ${error.message}` });
    }
});

// API для остановки продажи токенов
app.post('/api/stop', (req, res) => {
    const { walletId } = req.body;
    console.log(`Получен запрос на остановку продажи для кошелька ${walletId}`);

    global.stopSignals = global.stopSignals || {};
    global.stopSignals[walletId] = true;

    res.json({ message: `Продажа для кошелька ${walletId} остановлена.` });
});

// API для получения статуса кошельков
app.get('/api/status', (req, res) => {
    const privateKeys = require('./config/privateKeys');
    const status = {};
    for (let i = 1; i <= 5; i++) {
        const privateKey = privateKeys[i];
        console.log(`Проверка статуса кошелька ${i}, приватный ключ:`, privateKey);
        status[i] = {
            isConnected: !!privateKey && isValidPrivateKey(privateKey)
        };
        console.log(`Статус кошелька ${i}:`, status[i]);
    }
    res.json(status);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Сервер запущен на порту ${PORT} и доступен с любого IP`);
});
