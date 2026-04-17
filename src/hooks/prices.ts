import { useCallback, useEffect, useState } from 'react';
import { DEF_EUR_USD_RATE, DEF_USD_EUR_RATE, FETCH_INTERVAL, LS_PRICES_KEY, LS_RATES_KEY } from '@/constants/keys';



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
    const [prices, setPrices] = useState<PricesRecord>({});
    const [rates, setRates] = useState<RatesRecord>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    // Hydrate from localStorage cache on mount (client-only)
    useEffect(() => {
        try {
            const cachedPrices = localStorage.getItem(LS_PRICES_KEY);
            if (cachedPrices) {
                const parsed: CachedPrices = JSON.parse(cachedPrices);
                setPrices(parsed.prices);
                setLastUpdated(new Date(parsed.timestamp));
            }
        } catch (e) {
            console.error('Failed to load cached prices:', e);
        }
        try {
            const cachedRates = localStorage.getItem(LS_RATES_KEY);
            if (cachedRates) {
                const parsed: CachedRates = JSON.parse(cachedRates);
                setRates(parsed.rates);
            }
        } catch (e) {
            console.error('Failed to load cached rates:', e);
        }
    }, []);

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
                tokenIds.map((id) => {
                    const { eur, usd } = _prices[id] || {};
                    return [
                        id,
                        (eur && usd) ? {
                            usd: eur / usd,
                            eur: usd / eur
                        } : {
                            usd: DEF_EUR_USD_RATE,
                            eur: DEF_USD_EUR_RATE
                        }
                    ]
                })
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
    }, [tokenIds, rates]);

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
