import { useCallback, useEffect, useState } from 'react';
import type { Trade } from '@/components/AddTradeForm';
import { LS_KEY } from '@/constants/keys';



export function useTrades() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load trades from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(LS_KEY);
            if (raw) {
                setTrades(JSON.parse(raw));
            }
        } catch (e) {
            console.error('Failed to load trades from localStorage:', e);
        }
        setIsLoaded(true);
    }, []);

    // Save trades to localStorage when they change
    useEffect(() => {
        if (!isLoaded) return;
        try {
            localStorage.setItem(LS_KEY, JSON.stringify(trades));
        } catch (e) {
            console.error('Failed to save trades to localStorage:', e);
        }
    }, [trades, isLoaded]);

    const addTrade = useCallback((trade: Trade) => {
        setTrades((prev) => [trade, ...prev]);
    }, []);

    const addManyTrades = useCallback((newTrades: Trade[]) => {
        setTrades((prev) => [...newTrades, ...prev]);
    }, []);

    const deleteTrade = useCallback((id: string) => {
        setTrades((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const sellTrade = useCallback((id: string, sellDate: string, sellPrice: number) => {
        setTrades((prev) =>
            prev.map((t) =>
                t.id === id
                    ? { ...t, sell: { date: sellDate, price: sellPrice }, active: false }
                    : t
            )
        );
    }, []);

    return {
        trades,
        isLoaded,
        addTrade,
        addManyTrades,
        deleteTrade,
        sellTrade,
    };
}
