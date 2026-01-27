'use client';

import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { Trade } from '../AddTradeForm';
import SellTradeDialog from '../SellTradeDialog';


import { TotalsRow } from './row-totals';

import { format } from './utils';

type PricesApiResponse = {
    prices: Record<string, { usd?: number; eur?: number }>;
    rates: { EUR_USD: number | null };
};

export default function TradesTable({
    trades,
    onDelete,
    onSell,
    prices = {},
    eurUsd = null,
}: {
    trades: Trade[];
    onDelete: (id: string) => void;
    onSell: (id: string, sellDate: string, sellPrice: number) => void;
    prices?: Record<string, { usd?: number; eur?: number }>;
    eurUsd?: number | null;
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
                expenseUSD = eurUsd ? expenseEUR * eurUsd : null;
            } else {
                expenseUSD = t.amount * t.buy.price;
                expenseEUR = eurUsd ? expenseUSD / eurUsd : null;
            }

            const currentValueEUR =
                currentPriceEUR != null ? t.amount * currentPriceEUR : null;
            const currentValueUSD =
                currentPriceUSD != null ? t.amount * currentPriceUSD : null;

            const profitEUR =
                currentValueEUR != null && expenseEUR != null
                    ? currentValueEUR - expenseEUR
                    : null;
            const profitUSD =
                currentValueUSD != null && expenseUSD != null
                    ? currentValueUSD - expenseUSD
                    : null;
            const profitPct =
                profitEUR != null && expenseEUR != null && expenseEUR !== 0
                    ? (profitEUR / expenseEUR) * 100
                    : null;

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

    // totals
    const totals = rows.reduce(
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
            expenseEUR: 0,
            expenseUSD: 0,
            currentValueEUR: 0,
            currentValueUSD: 0,
            profitEUR: 0,
            profitUSD: 0,
        }
    );

    const totalProfitPct =
        totals.expenseEUR !== 0
            ? (totals.profitEUR / totals.expenseEUR) * 100
            : null;

    // Separate rows into active profitable, active losing, and inactive (sold)
    const activeProfitableRows = rows.filter(
        (r) =>
            r.trade.active &&
            ((r.profitEUR != null && r.profitEUR > 0) || (r.profitUSD != null && r.profitUSD > 0))
    );

    const activeLossingRows = rows.filter(
        (r) =>
            r.trade.active &&
            ((r.profitEUR != null && r.profitEUR <= 0) || (r.profitUSD != null && r.profitUSD <= 0))
    );

    const inactiveRows = rows.filter((r) => !r.trade.active);

    // Calculate subtotals
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

    const closedSubtotal = calculateSubtotal(inactiveRows);
    const closedSubtotalPct =
        closedSubtotal.expenseEUR !== 0
            ? (closedSubtotal.profitEUR / closedSubtotal.expenseEUR) * 100
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

    function calculateDiff(buyPrice: number, sellPrice: number) {
        // High-precision decimal arithmetic using string manipulation and BigInt
        const buyStr = buyPrice.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
        const sellStr = sellPrice.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');

        // Split into integer and decimal parts
        const [buyIntPart = '0', buyDecPart = ''] = buyStr.split('.');
        const [sellIntPart = '0', sellDecPart = ''] = sellStr.split('.');

        // Ensure both have same decimal places
        const maxDecLength = Math.max(buyDecPart.length, sellDecPart.length);
        const buyDecNorm = buyDecPart.padEnd(maxDecLength, '0');
        const sellDecNorm = sellDecPart.padEnd(maxDecLength, '0');

        // Combine into integer representation
        const buyFull = BigInt(buyIntPart + buyDecNorm);
        const sellFull = BigInt(sellIntPart + sellDecNorm);

        // Perform subtraction on integers
        const diffFull = sellFull - buyFull;

        // Convert back to decimal
        const diffStr = diffFull.toString().padStart(maxDecLength + 1, '0');
        const intPart = diffStr.slice(0, -maxDecLength) || '0';
        const decPart = diffStr.slice(-maxDecLength);

        const result = parseFloat(`${intPart}.${decPart}`);
        return result;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Trades</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
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
                                <React.Fragment key={r.trade.id}>
                                    <TableRow>
                                        <TableCell>
                                            <code>{r.trade.buy.date}</code>
                                        </TableCell>
                                        <TableCell>
                                            <code>{r.trade.buy.price.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })}</code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>{format(r.trade.amount)}</code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                {r.expenseEUR
                                                    ? format(r.expenseEUR)
                                                    : r.expenseUSD
                                                        ? format(r.expenseUSD)
                                                        : '0,00'}{' '}
                                                {r.expenseEUR ? '€' : r.expenseUSD ? '$' : '~'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                {r.currentValueEUR
                                                    ? format(r.currentValueEUR)
                                                    : r.currentValueUSD
                                                        ? format(r.currentValueUSD)
                                                        : '0,00'}{' '}
                                                {r.currentValueEUR ? '€' : r.currentValueUSD ? '$' : '~'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                <span className="text-green-600 dark:text-green-500">
                                                    {r.profitPct != null ? `${format(r.profitPct)} %` : '—'}
                                                </span>
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                <span className="text-green-600 dark:text-green-500">
                                                    {r.profitEUR
                                                        ? format(r.profitEUR)
                                                        : r.profitUSD
                                                            ? format(r.profitUSD)
                                                            : '0,00'}{' '}
                                                    {r.profitEUR ? '€' : r.profitUSD ? '$' : '~'}
                                                </span>
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedTrade(r.trade);
                                                    setSellDialogOpen(true);
                                                }}
                                            >
                                                MaS
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
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
                                <React.Fragment key={r.trade.id}>
                                    <TableRow>
                                        <TableCell>
                                            <code>{r.trade.buy.date}</code>
                                        </TableCell>
                                        <TableCell>
                                            <code>{r.trade.buy.price.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })}</code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>{format(r.trade.amount)}</code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                {r.expenseEUR
                                                    ? format(r.expenseEUR)
                                                    : r.expenseUSD
                                                        ? format(r.expenseUSD)
                                                        : '0,00'}{' '}
                                                {r.expenseEUR ? '€' : r.expenseUSD ? '$' : '~'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                {r.currentValueEUR
                                                    ? format(r.currentValueEUR)
                                                    : r.currentValueUSD
                                                        ? format(r.currentValueUSD)
                                                        : '0,00'}{' '}
                                                {r.currentValueEUR ? '€' : r.currentValueUSD ? '$' : '~'}
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                <span className="text-rose-600 dark:text-rose-500">
                                                    {r.profitPct != null ? `${format(r.profitPct)} %` : '—'}
                                                </span>
                                            </code>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <code>
                                                <span className="text-rose-600 dark:text-rose-500">
                                                    {r.profitEUR
                                                        ? format(r.profitEUR)
                                                        : r.profitUSD
                                                            ? format(r.profitUSD)
                                                            : '0,00'}{' '}
                                                    {r.profitEUR ? '€' : r.profitUSD ? '$' : '~'}
                                                </span>
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedTrade(r.trade);
                                                    setSellDialogOpen(true);
                                                }}
                                            >
                                                MaS
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </React.Fragment>
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

                            {/* CLOSED SECTION */}
                            {inactiveRows.map((r) => {
                                const symbol = r.trade.currency === 'EUR' ? '€' : r.trade.currency === 'USD' ? '$' : '~';

                                const amount = r.trade.amount;

                                const expense = format(amount * r.trade.buy.price);
                                const value = format(amount * r.trade.sell.price!);

                                if (!r.trade.sell.price) return null;

                                const diff = calculateDiff(r.trade.buy.price, r.trade.sell.price);

                                const percent = format((diff / r.trade.buy.price) * 100);
                                const nominal = format(diff * amount);

                                return (
                                    <React.Fragment key={r.trade.id}>
                                        <TableRow>
                                            <TableCell>
                                                <code>{r.trade.sell.date}</code>
                                            </TableCell>
                                            <TableCell>
                                                <code>{r.trade.sell.price.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })} ({diff.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })})</code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <code>{format(r.trade.amount)}</code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <code>
                                                    {expense}{' '}{symbol}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <code>
                                                    {value}{' '}{symbol}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <code>
                                                    <span
                                                        className={
                                                            r.profitPct != null && r.profitPct > 0
                                                                ? 'text-green-600 dark:text-green-500'
                                                                : 'text-rose-600 dark:text-rose-500'
                                                        }
                                                    >
                                                        {percent} %
                                                    </span>
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <code>
                                                    <span
                                                        className={
                                                            r.profitEUR != null && r.profitEUR > 0
                                                                ? 'text-green-600 dark:text-green-500'
                                                                : 'text-rose-600 dark:text-rose-500'
                                                        }
                                                    >
                                                        {nominal}{' '}{symbol}
                                                    </span>
                                                </code>
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </React.Fragment>
                                )
                            })}

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
                                amount={trades.reduce((s, t) => s + t.amount, 0)}
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
            </CardContent>
        </Card>
    );
}
