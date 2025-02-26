// Ключи для localStorage
const STORAGE_KEY = 'walletSettings';

// Функция для загрузки настроек из localStorage
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    for (let i = 1; i <= 5; i++) {
        const walletSettings = settings[i] || {};
        document.getElementById(`wallet-name-${i}`).innerText = walletSettings.name || `Кошелек ${i}`;
        document.getElementById(`token-${i}`).value = walletSettings.token || '';
        document.getElementById(`network-${i}`).value = walletSettings.network || 'bsc';
        document.getElementById(`dex-${i}`).value = walletSettings.dex || 'pancakeswap-universal';
        document.getElementById(`gasPrice-${i}`).value = walletSettings.gasPrice || 7;
        document.getElementById(`slippage-${i}`).value = walletSettings.slippage || 1;
        // Устанавливаем значение по умолчанию для targetToken как WBNB, если доступно
        const network = document.getElementById(`network-${i}`).value;
        const dex = document.getElementById(`dex-${i}`).value;
        const targetTokenSelect = document.getElementById(`targetToken-${i}`);
        if (network === 'bsc' && dex === 'pancakeswap-universal') {
            targetTokenSelect.value = walletSettings.targetToken || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
        } else {
            targetTokenSelect.value = '';
        }
        document.getElementById(`gasIncrease-${i}`).value = walletSettings.gasIncrease || 0;
        document.getElementById(`slippageIncrease-${i}`).value = walletSettings.slippageIncrease || 0.5;
    }
}

// Функция для сохранения настроек в localStorage
function saveSettings() {
    const settings = {};
    for (let i = 1; i <= 5; i++) {
        settings[i] = {
            name: document.getElementById(`wallet-name-${i}`).innerText,
            token: document.getElementById(`token-${i}`).value,
            network: document.getElementById(`network-${i}`).value,
            dex: document.getElementById(`dex-${i}`).value,
            gasPrice: document.getElementById(`gasPrice-${i}`).value,
            slippage: document.getElementById(`slippage-${i}`).value,
            targetToken: document.getElementById(`targetToken-${i}`).value || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // Сохраняем только WBNB, если доступно
            gasIncrease: document.getElementById(`gasIncrease-${i}`).value,
            slippageIncrease: document.getElementById(`slippageIncrease-${i}`).value
        };
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Обработчик изменения названий кошельков
for (let i = 1; i <= 5; i++) {
    document.getElementById(`wallet-name-${i}`).addEventListener('blur', saveSettings);
}

// Функция для проверки статуса всех кошельков при загрузке
async function checkAllStatuses() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`status-${i}`).innerText = `${document.getElementById(`wallet-name-${i}`).innerText}: ${status[i].isConnected ? 'Подключён' : 'Отключён'}`;
        }
    } catch (error) {
        for (let i = 1; i <= 5; i++) {
            document.getElementById(`status-${i}`).innerText = `${document.getElementById(`wallet-name-${i}`).innerText}: Ошибка проверки статуса`;
        }
    }
}

// Функция для генерации случайного UUID (без использования crypto.randomUUID)
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// Запуск проверки статуса при загрузке страницы и загрузка настроек
window.onload = () => {
    loadSettings();
    checkAllStatuses();
    // Подключение Ethers.js через CDN
    if (window.ethers) {
        console.log('Ethers.js загружен успешно');
    } else {
        console.error('Ethers.js не загружен');
    }
};

// Обработчики для запуска продаж для каждого кошелька
for (let i = 1; i <= 5; i++) {
    document.getElementById(`start-${i}`).addEventListener('click', async () => {
        const network = document.getElementById(`network-${i}`).value;
        const dex = document.getElementById(`dex-${i}`).value;
        const targetTokenSelect = document.getElementById(`targetToken-${i}`).value;
        const data = {
            walletId: i,
            tokenContract: document.getElementById(`token-${i}`).value,
            tokenDecimals: 18, // По умолчанию, можно уточнить через запрос к контракту
            network: network,
            dex: dex,
            gasPrice: document.getElementById(`gasPrice-${i}`).value,
            slippage: document.getElementById(`slippage-${i}`).value,
            targetToken: (network === 'bsc' && dex === 'pancakeswap-universal') ? '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' : '', // Фиксируем WBNB только для PancakeSwap на BSC
            gasIncreasePercentage: document.getElementById(`gasIncrease-${i}`).value,
            slippageIncreasePercentage: document.getElementById(`slippageIncrease-${i}`).value
        };
        try {
            console.log('Отправка запроса на запуск продажи для кошелька', i, 'с данными:', data); // Логирование запроса с WBNB
            const response = await fetch('/api/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            document.getElementById(`status-${i}`).innerText = result.message || `${document.getElementById(`wallet-name-${i}`).innerText}: Продажа запущена`;
            saveSettings(); // Сохраняем настройки после успешного запуска
        } catch (error) {
            document.getElementById(`status-${i}`).innerText = `${document.getElementById(`wallet-name-${i}`).innerText}: Ошибка: ${error.message}`;
            console.error('Ошибка при запуске продажи для кошелька', i, ':', error); // Логирование ошибки
        }
    });

    // Обработчики для остановки продаж для каждого кошелька
    document.getElementById(`stop-${i}`).addEventListener('click', async () => {
        try {
            console.log('Отправка запроса на остановку продажи для кошелька', i); // Логирование запроса
            const response = await fetch('/api/stop', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletId: i })
            });
            const result = await response.json();
            document.getElementById(`status-${i}`).innerText = result.message || `${document.getElementById(`wallet-name-${i}`).innerText}: Продажа остановлена`;
            saveSettings(); // Сохраняем настройки после остановки
        } catch (error) {
            document.getElementById(`status-${i}`).innerText = `${document.getElementById(`wallet-name-${i}`).innerText}: Ошибка: ${error.message}`;
            console.error('Ошибка при остановке продажи для кошелька', i, ':', error); // Логирование ошибки
        }
    });
}

// Сохраняем настройки при изменении полей
for (let i = 1; i <= 5; i++) {
    ['token', 'network', 'dex', 'gasPrice', 'slippage', 'targetToken', 'gasIncrease', 'slippageIncrease'].forEach(field => {
        document.getElementById(`${field}-${i}`).addEventListener('change', saveSettings);
    });
}
