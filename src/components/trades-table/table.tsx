'use client';

import { useMemo, useState } from 'react';

import {
    Table,
    TableRow,
    TableBody,
    TableHead,
    TableHeader,
    TableFooter,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

import type { Trade } from '../AddTradeForm';
import SellTradeDialog from '../SellTradeDialog';

import { TradeRow } from './row-trade';
import { TotalsRow } from './row-totals';

export default function TradesTable({
    trades,
    onSell,
    prices = {},
    rates = {},
}: {
    trades: Trade[];
    onDelete: (id: string) => void;
    onSell: (id: string, sellDate: string, sellPrice: number) => void;
    prices?: Record<string, { usd?: number; eur?: number }>;
    rates?: Record<string, { usd?: number; eur?: number }>;
}) {
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [sellDialogOpen, setSellDialogOpen] = useState(false);
    // Filter for shiba-inu only
    const shibaInuTrades = useMemo(
        () => trades.filter((t) => t.tokenId === 'shiba-inu'),
        [trades]
    );

    // compute per-trade values
    const rows = shibaInuTrades
        .sort((a, b) => a.buy.price - b.buy.price) // Sort by buy price ascending
        .map((t) => {
            const cur = prices[t.tokenId] ?? {};
            const currentPriceEUR = cur.eur ?? null;
            const currentPriceUSD = cur.usd ?? null;

            // expense in both currencies
            let expenseEUR = null as number | null;
            let expenseUSD = null as number | null;
            if (t.currency === 'EUR') {
                expenseEUR = t.amount * t.buy.price;
                expenseUSD = (rates[t.tokenId] && rates[t.tokenId].usd) ? expenseEUR * rates[t.tokenId].usd! : null;
            } else {
                expenseUSD = t.amount * t.buy.price;
                expenseEUR = (rates[t.tokenId] && rates[t.tokenId].eur) ? expenseUSD * rates[t.tokenId].eur! : null;
            }

            // For closed trades, use sell price; for active trades, use current market price
            let currentValueEUR: number | null;
            let currentValueUSD: number | null;
            let profitEUR: number | null;
            let profitUSD: number | null;
            let profitPct: number | null;

            if (!t.active && t.sell.price != null) {
                // Closed trade: calculate based on sell price
                if (t.currency === 'EUR') {
                    currentValueEUR = t.amount * t.sell.price;
                    currentValueUSD = (rates[t.tokenId] && rates[t.tokenId].usd) ? currentValueEUR * rates[t.tokenId].usd! : null;
                } else {
                    currentValueUSD = t.amount * t.sell.price;
                    currentValueEUR = (rates[t.tokenId] && rates[t.tokenId].eur) ? currentValueUSD * rates[t.tokenId].eur! : null;
                }
                profitEUR = currentValueEUR != null && expenseEUR != null
                    ? currentValueEUR - expenseEUR
                    : null;
                profitUSD = currentValueUSD != null && expenseUSD != null
                    ? currentValueUSD - expenseUSD
                    : null;
                profitPct = profitEUR != null && expenseEUR != null && expenseEUR !== 0
                    ? (profitEUR / expenseEUR) * 100
                    : null;
            } else {
                // Active trade: calculate based on current market price
                currentValueEUR = currentPriceEUR != null ? t.amount * currentPriceEUR : null;
                currentValueUSD = currentPriceUSD != null ? t.amount * currentPriceUSD : null;

                profitEUR = currentValueEUR != null && expenseEUR != null
                    ? currentValueEUR - expenseEUR
                    : null;
                profitUSD = currentValueUSD != null && expenseUSD != null
                    ? currentValueUSD - expenseUSD
                    : null;
                profitPct = profitEUR != null && expenseEUR != null && expenseEUR !== 0
                    ? (profitEUR / expenseEUR) * 100
                    : null;
            }

            return {
                trade: t,
                currentPriceEUR,
                currentPriceUSD,
                expenseEUR,
                expenseUSD,
                currentValueEUR,
                currentValueUSD,
                profitEUR,
                profitUSD,
                profitPct,
            };
        });

    // Separate rows into active profitable, active losing, and inactive (sold)
    const activeProfitableRows = rows.filter(
        (r) => {
            if (!r.trade.active) return false;
            // Use EUR profit as primary, fall back to USD
            const profit = r.profitEUR ?? r.profitUSD;
            return profit != null && profit > 0;
        }
    );

    const activeLossingRows = rows.filter(
        (r) => {
            if (!r.trade.active) return false;
            // Use EUR profit as primary, fall back to USD
            const profit = r.profitEUR ?? r.profitUSD;
            return profit != null && profit <= 0;
        }
    );

    const inactiveRows = rows.filter((r) => !r.trade.active);

    // Calculate subtotals for a group of rows
    const calculateSubtotal = (rowsToSum: typeof rows) => {
        const amount = rowsToSum.reduce((sum, r) => sum + r.trade.amount, 0);
        return rowsToSum.reduce(
            (acc, r) => {
                acc.expenseEUR += r.expenseEUR ?? 0;
                acc.expenseUSD += r.expenseUSD ?? 0;
                acc.currentValueEUR += r.currentValueEUR ?? 0;
                acc.currentValueUSD += r.currentValueUSD ?? 0;
                acc.profitEUR += r.profitEUR ?? 0;
                acc.profitUSD += r.profitUSD ?? 0;
                return acc;
            },
            {
                amount,
                expenseEUR: 0,
                expenseUSD: 0,
                currentValueEUR: 0,
                currentValueUSD: 0,
                profitEUR: 0,
                profitUSD: 0,
            }
        );
    };

    const profitSubtotal = calculateSubtotal(activeProfitableRows);
    const profitSubtotalPct =
        profitSubtotal.expenseEUR !== 0
            ? (profitSubtotal.profitEUR / profitSubtotal.expenseEUR) * 100
            : null;

    const lossSubtotal = calculateSubtotal(activeLossingRows);
    const lossSubtotalPct =
        lossSubtotal.expenseEUR !== 0
            ? (lossSubtotal.profitEUR / lossSubtotal.expenseEUR) * 100
            : null;

    const openSubtotal = calculateSubtotal([...activeProfitableRows, ...activeLossingRows]);
    const openSubtotalPct =
        openSubtotal.expenseEUR !== 0
            ? (openSubtotal.profitEUR / openSubtotal.expenseEUR) * 100
            : null;

    const closedSubtotal = calculateSubtotal(inactiveRows);
    const closedSubtotalPct =
        closedSubtotal.expenseEUR !== 0
            ? (closedSubtotal.profitEUR / closedSubtotal.expenseEUR) * 100
            : null;

    // Calculate totals: only active trades for amount, combine active unrealized + closed realized profit
    const activeRows = rows.filter((r) => r.trade.active);
    const activeAmount = activeRows.reduce((sum, r) => sum + r.trade.amount, 0);

    const totals = {
        // Only active trades' expense (what we currently have at risk)
        expenseEUR: activeRows.reduce((sum, r) => sum + (r.expenseEUR ?? 0), 0),
        expenseUSD: activeRows.reduce((sum, r) => sum + (r.expenseUSD ?? 0), 0),
        // Only active trades' current value
        currentValueEUR: activeRows.reduce((sum, r) => sum + (r.currentValueEUR ?? 0), 0),
        currentValueUSD: activeRows.reduce((sum, r) => sum + (r.currentValueUSD ?? 0), 0),
        // Total profit = active unrealized profit + closed realized profit
        profitEUR: activeRows.reduce((sum, r) => sum + (r.profitEUR ?? 0), 0) + closedSubtotal.profitEUR,
        profitUSD: activeRows.reduce((sum, r) => sum + (r.profitUSD ?? 0), 0) + closedSubtotal.profitUSD,
    };

    const totalProfitPct =
        totals.expenseEUR !== 0
            ? (totals.profitEUR / totals.expenseEUR) * 100
            : null;

    if (shibaInuTrades.length === 0) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground">
                        No shiba-inu trades yet. Add a trade or import from a wallet.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto border border-cyan-200 rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='font-bold'>date</TableHead>
                            <TableHead className='font-bold'>price</TableHead>
                            <TableHead className='font-bold text-right'>amount</TableHead>
                            <TableHead className='font-bold text-right'>cost</TableHead>
                            <TableHead className='font-bold text-right'>value</TableHead>
                            <TableHead className='font-bold text-right'>delta %</TableHead>
                            <TableHead className='font-bold text-right'>delta $</TableHead>
                            <TableHead className='font-bold text-right'>actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* PROFIT SECTION */}
                        {activeProfitableRows.map((r) => (
                            <TradeRow
                                key={r.trade.id}
                                trade={r.trade}
                                currentPriceEUR={r.currentPriceEUR}
                                currentPriceUSD={r.currentPriceUSD}
                                expenseEUR={r.expenseEUR}
                                expenseUSD={r.expenseUSD}
                                currentValueEUR={r.currentValueEUR}
                                currentValueUSD={r.currentValueUSD}
                                profitEUR={r.profitEUR}
                                profitUSD={r.profitUSD}
                                profitPct={r.profitPct}
                                onSellClick={() => {
                                    setSelectedTrade(r.trade);
                                    setSellDialogOpen(true);
                                }}
                            />
                        ))}

                        {/* PROFIT SUBTOTAL */}
                        {activeProfitableRows.length > 0 && (
                            <TotalsRow
                                label='profit'
                                active={true}
                                currency='EUR'
                                amount={profitSubtotal.amount}
                                expense={{
                                    eur: profitSubtotal.expenseEUR,
                                    usd: profitSubtotal.expenseUSD,
                                }}
                                value={{
                                    eur: profitSubtotal.currentValueEUR,
                                    usd: profitSubtotal.currentValueUSD,
                                }}
                                delta={{
                                    percent: profitSubtotalPct,
                                    nominal: profitSubtotal.profitEUR ? profitSubtotal.profitEUR :
                                        profitSubtotal.profitUSD ? profitSubtotal.profitUSD :
                                            0,
                                }}
                            />
                        )}

                        {/* LOSS SECTION */}
                        {activeLossingRows.map((r) => (
                            <TradeRow
                                key={r.trade.id}
                                trade={r.trade}
                                currentPriceEUR={r.currentPriceEUR}
                                currentPriceUSD={r.currentPriceUSD}
                                expenseEUR={r.expenseEUR}
                                expenseUSD={r.expenseUSD}
                                currentValueEUR={r.currentValueEUR}
                                currentValueUSD={r.currentValueUSD}
                                profitEUR={r.profitEUR}
                                profitUSD={r.profitUSD}
                                profitPct={r.profitPct}
                                onSellClick={() => {
                                    setSelectedTrade(r.trade);
                                    setSellDialogOpen(true);
                                }}
                            />
                        ))}

                        {/* LOSS SUBTOTAL */}
                        {activeLossingRows.length > 0 && (
                            <TotalsRow
                                label='loss'
                                active={true}
                                currency='EUR'
                                amount={lossSubtotal.amount}
                                expense={{
                                    eur: lossSubtotal.expenseEUR,
                                    usd: lossSubtotal.expenseUSD,
                                }}
                                value={{
                                    eur: lossSubtotal.currentValueEUR,
                                    usd: lossSubtotal.currentValueUSD,
                                }}
                                delta={{
                                    percent: lossSubtotalPct,
                                    nominal: lossSubtotal.profitEUR ? lossSubtotal.profitEUR :
                                        lossSubtotal.profitUSD ? lossSubtotal.profitUSD :
                                            0,
                                }}
                            />
                        )}

                        {/* OPEN SUBTOTAL */}
                        {(activeProfitableRows.length > 0 || activeLossingRows.length > 0) && (
                            <TotalsRow
                                label='open'
                                active={true}
                                currency='EUR'
                                amount={openSubtotal.amount}
                                expense={{
                                    eur: openSubtotal.expenseEUR,
                                    usd: openSubtotal.expenseUSD,
                                }}
                                value={{
                                    eur: openSubtotal.currentValueEUR,
                                    usd: openSubtotal.currentValueUSD,
                                }}
                                delta={{
                                    percent: openSubtotalPct,
                                    nominal: openSubtotal.profitEUR ? openSubtotal.profitEUR :
                                        openSubtotal.profitUSD ? openSubtotal.profitUSD :
                                            0,
                                }}
                            />
                        )}

                        {/* CLOSED SECTION */}
                        {inactiveRows.map((r) => (
                            <TradeRow
                                key={r.trade.id}
                                trade={r.trade}
                                currentPriceEUR={r.currentPriceEUR}
                                currentPriceUSD={r.currentPriceUSD}
                                expenseEUR={r.expenseEUR}
                                expenseUSD={r.expenseUSD}
                                currentValueEUR={r.currentValueEUR}
                                currentValueUSD={r.currentValueUSD}
                                profitEUR={r.profitEUR}
                                profitUSD={r.profitUSD}
                                profitPct={r.profitPct}
                            />
                        ))}

                        {/* CLOSED SUBTOTAL */}
                        {inactiveRows.length > 0 && (
                            <TotalsRow
                                label='closed'
                                active={false}
                                currency='EUR'
                                amount={closedSubtotal.amount}
                                expense={{
                                    eur: closedSubtotal.expenseEUR,
                                    usd: closedSubtotal.expenseUSD,
                                }}
                                value={{
                                    eur: closedSubtotal.currentValueEUR,
                                    usd: closedSubtotal.currentValueUSD,
                                }}
                                delta={{
                                    percent: closedSubtotalPct,
                                    nominal: closedSubtotal.profitEUR ? closedSubtotal.profitEUR :
                                        closedSubtotal.profitUSD ? closedSubtotal.profitUSD :
                                            0,
                                }}
                            />
                        )}
                    </TableBody>
                    <TableFooter>
                        <TotalsRow
                            label='total'
                            active={false}
                            currency='EUR'
                            amount={activeAmount}
                            expense={{
                                eur: totals.expenseEUR,
                                usd: totals.expenseUSD,
                            }}
                            value={{
                                eur: totals.currentValueEUR,
                                usd: totals.currentValueUSD,
                            }}
                            delta={{
                                percent: totalProfitPct,
                                nominal: totals.profitEUR ? totals.profitEUR :
                                    totals.profitUSD ? totals.profitUSD :
                                        0,
                            }}
                        />
                    </TableFooter>
                </Table>
            </div>
            <SellTradeDialog
                open={sellDialogOpen}
                onOpenChange={setSellDialogOpen}
                trade={selectedTrade}
                onSubmit={(sellDate, sellPrice) => {
                    if (selectedTrade) {
                        onSell(selectedTrade.id, sellDate, Number(sellPrice));
                    }
                }}
            />
        </div>
    );
}
