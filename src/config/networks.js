module.exports = {
    base: {
        rpcUrl: 'https://base-mainnet.public.blastapi.io',
        wrappedNativeToken: '0x4200000000000000000000000000000000000006', // WETH
        nativeToken: 'ETH', // Нативный токен сети Base
        gasSuggestions: { low: 1, medium: 2, high: 5 }
    },
    ethernet: {
        rpcUrl: 'https://rpc.ankr.com/eth',
        wrappedNativeToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
        gasSuggestions: { low: 2, medium: 5, high: 10 }
    },
    bsc: {
        rpcUrl: 'https://bsc-dataseed.binance.org',
        wrappedNativeToken: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB (оставляем для fallback)
        nativeToken: 'BNB', // Нативный токен сети BSC
        gasSuggestions: { low: 1, medium: 3, high: 7 }
    },
    arbitrum: {
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        wrappedNativeToken: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
        gasSuggestions: { low: 0.1, medium: 0.5, high: 2 }
    },
    optimism: {
        rpcUrl: 'https://mainnet.optimism.io',
        wrappedNativeToken: '0x4200000000000000000000000000000000000006', // WETH
        gasSuggestions: { low: 0.1, medium: 0.5, high: 2 }
    },
    polygon: {
        rpcUrl: 'https://polygon-rpc.com',
        wrappedNativeToken: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
        gasSuggestions: { low: 1, medium: 3, high: 7 }
    }
};
