const path = require('path'); // Импортируем модуль path
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

module.exports = {
    '1': process.env.PRIVATE_KEY_1 || null,
    '2': process.env.PRIVATE_KEY_2 || null,
    '3': process.env.PRIVATE_KEY_3 || null,
    '4': process.env.PRIVATE_KEY_4 || null,
    '5': process.env.PRIVATE_KEY_5 || null
};
