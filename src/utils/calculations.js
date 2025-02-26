const { ethers } = require('ethers');
const swapSettings = require('../config/swapSettings');

function calculateMinAmount(amount, slippage) {
    console.log(`Тип amount: ${typeof amount}, значение: ${amount.toString()}`);
    console.log(`Тип slippage: ${typeof slippage}, значение: ${slippage}%`);
    console.log(`Расчёт минимальной суммы с slippage ${slippage}%`);
    return amount * BigInt(Math.floor((1 - (slippage / 100)) * 10000)) / BigInt(10000);
}

module.exports = { calculateMinAmount };
