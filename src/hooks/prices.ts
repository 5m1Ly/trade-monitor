import { useEffect, useState, useCallback } from 'react';

const LS_PRICES_KEY = 'cached_prices_v1';
const LS_RATES_KEY = 'cached_rates_v1';
const FETCH_INTERVAL = 20000; // 20 seconds

type PricesApiResponse = {
    prices: PricesRecord;
    rates: { EUR_USD: number | null };
} | { error: string };

type PricesRecord = Record<string, { usd?: number; eur?: number }>;

type CachedPrices = {
    prices: PricesRecord;
    timestamp: number;
};

type RatesRecord = Record<string, { usd?: number; eur?: number }>;

type CachedRates = {
    rates: RatesRecord;
    timestamp: number;
};

export function usePrices(tokenIds: string[] = ['shiba-inu']) {
    const [prices, setPrices] = useState<PricesRecord>(() => {
        // Initialize from localStorage cache
        try {
            const cached = localStorage.getItem(LS_PRICES_KEY);
            if (cached) {
                const parsed: CachedPrices = JSON.parse(cached);
                return parsed.prices;
            }
        } catch (e) {
            console.error('Failed to load cached prices:', e);
        }
        return {};
    });

    const [rates, setRates] = useState<RatesRecord>(() => {
        // Initialize from localStorage cache
        try {
            const cached = localStorage.getItem(LS_RATES_KEY);
            if (cached) {
                const parsed: CachedRates = JSON.parse(cached);
                return parsed.rates;
            }
        } catch (e) {
            console.error('Failed to load cached rates:', e);
        }
        return {};
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(() => {
        // Get last update timestamp from cache
        try {
            const cached = localStorage.getItem(LS_PRICES_KEY);
            if (cached) {
                const parsed: CachedPrices = JSON.parse(cached);
                return new Date(parsed.timestamp);
            }
        } catch (e) {
            // Ignore
        }
        return null;
    });

    const fetchPrices = useCallback(async () => {
        if (tokenIds.length === 0) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/prices?ids=${tokenIds.join(',')}`);
            const data: PricesApiResponse = await response.json();

            if ('error' in data) {
                setError(data.error);
                return;
            }

            const _prices = data.prices || {};
            const _rates = Object.fromEntries(
                tokenIds.map((id) => [
                    id,
                    {
                        usd: _prices[id]?.eur! / _prices[id]?.usd!,
                        eur: _prices[id]?.usd! / _prices[id]?.eur!
                    }
                ])
            );
            const timestamp = Date.now();

            // Update state
            setPrices(_prices);
            setRates(rates);
            setLastUpdated(new Date(timestamp));

            // Cache to localStorage
            try {
                const cachedPrices: CachedPrices = { prices: _prices, timestamp };
                localStorage.setItem(LS_PRICES_KEY, JSON.stringify(cachedPrices));

                const cachedRates: CachedRates = {
                    rates: _rates,
                    timestamp
                };
                // Also cache EUR/USD rate
                localStorage.setItem(LS_RATES_KEY, JSON.stringify(cachedRates));
            } catch (e) {
                console.error('Failed to cache prices:', e);
            }
        } catch (e) {
            console.error('Failed to fetch prices:', e);
            setError(e instanceof Error ? e.message : 'Failed to fetch prices');
        } finally {
            setIsLoading(false);
        }
    }, [tokenIds]);

    // Fetch prices on mount and set up interval
    useEffect(() => {
        // Fetch immediately on mount
        fetchPrices();

        // Then fetch every FETCH_INTERVAL
        const interval = setInterval(fetchPrices, FETCH_INTERVAL);

        return () => clearInterval(interval);
    }, [fetchPrices]);

    // Helper to get a specific token's price
    const getPrice = useCallback((tokenId: string) => {
        return prices[tokenId] ?? null;
    }, [prices]);

    return {
        prices,
        rates,
        isLoading,
        error,
        lastUpdated,
        refetch: fetchPrices,
        getPrice,
    };
}
