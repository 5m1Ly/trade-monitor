'use client';
import React, { useEffect, useMemo, useState } from 'react';
import type { Trade } from './AddTradeForm';
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

type PricesApiResponse = {
    prices: Record<string, { usd?: number; eur?: number }>;
    rates: { EUR_USD: number | null };
};

export default function TradesTable({
    trades,
    onDelete,
    prices = {},
    eurUsd = null,
}: {
    trades: Trade[];
    onDelete: (id: string) => void;
    prices?: Record<string, { usd?: number; eur?: number }>;
    eurUsd?: number | null;
}) {
    // Filter for shiba-inu only
    const shibaInuTrades = useMemo(
        () => trades.filter((t) => t.tokenId === 'shiba-inu'),
        [trades]
    );

    function format(n: number | null | undefined) {
        if (n == null || Number.isNaN(n)) return '—';
        return n.toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        });
    }

    // compute per-trade values
    const rows = shibaInuTrades.map((t) => {
        const cur = prices[t.tokenId] ?? {};
        const currentPriceEUR = cur.eur ?? null;
        const currentPriceUSD = cur.usd ?? null;

        // expense in both currencies
        let expenseEUR = null as number | null;
        let expenseUSD = null as number | null;
        if (t.tradeCurrency === 'EUR') {
            expenseEUR = t.amount * t.priceAtTrade;
            expenseUSD = eurUsd ? expenseEUR * eurUsd : null;
        } else {
            expenseUSD = t.amount * t.priceAtTrade;
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
        <Card>
            <CardHeader>
                <CardTitle>Your Trades</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Token</TableHead>
                                <TableHead>Buy Price</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Cost</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Profit %</TableHead>
                                <TableHead>Profit $</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map((r) => (
                                <TableRow key={r.trade.id}>
                                    <TableCell>
                                        <code>{r.trade.date}</code>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <code>
                                            {r.trade.symbol}
                                        </code>
                                    </TableCell>
                                    <TableCell>
                                        <code>
                                            {r.trade.priceAtTrade}
                                        </code>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <code>
                                            {format(r.trade.amount)}
                                        </code>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <code>
                                            {r.expenseEUR
                                                ? format(r.expenseEUR)
                                                : r.expenseUSD
                                                    ? format(r.expenseUSD)
                                                    : '0,00'}{' '}
                                            {r.expenseEUR
                                                ? '€'
                                                : r.expenseUSD
                                                    ? '$'
                                                    : '~'}
                                        </code>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <code>
                                            {r.currentValueEUR
                                                ? format(r.currentValueEUR)
                                                : r.currentValueUSD
                                                    ? format(r.currentValueUSD)
                                                    : '0,00'}{' '}
                                            {r.currentValueEUR
                                                ? '€'
                                                : r.currentValueUSD
                                                    ? '$'
                                                    : '~'}
                                        </code>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <code>
                                            <span
                                                className={
                                                    r.profitPct != null &&
                                                        r.profitPct > 0
                                                        ? 'text-green-600 dark:text-green-500'
                                                        : 'text-rose-600 dark:text-rose-500'
                                                }
                                            >
                                                {r.profitPct != null
                                                    ? `${format(
                                                        r.profitPct
                                                    )} %`
                                                    : '—'}
                                            </span>
                                        </code>
                                    </TableCell>
                                    <TableCell className='text-right'>
                                        <code>
                                            <span
                                                className={
                                                    r.profitEUR != null &&
                                                        r.profitEUR > 0
                                                        ? 'text-green-600 dark:text-green-500'
                                                        : 'text-rose-600 dark:text-rose-500'
                                                }
                                            >
                                                {r.profitEUR
                                                    ? format(r.profitEUR)
                                                    : r.profitUSD
                                                        ? format(r.profitUSD)
                                                        : '0,00'}{' '}
                                                {r.profitEUR
                                                    ? '€'
                                                    : r.profitUSD
                                                        ? '$'
                                                        : '~'}
                                            </span>
                                        </code>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TableCell className="font-bold text-[16px]">
                                    <code>
                                        totals
                                    </code>
                                </TableCell>
                                <TableCell />
                                <TableCell />
                                <TableCell className="font-bold text-right text-[16px]">
                                    <code>
                                        {format(
                                            trades.reduce((s, t) => s + t.amount, 0)
                                        )}
                                    </code>
                                </TableCell>
                                <TableCell className="font-bold text-right text-[16px]">
                                    <code>
                                        {totals.expenseEUR
                                            ? format(totals.expenseEUR)
                                            : totals.expenseUSD
                                                ? format(totals.expenseUSD)
                                                : '0,00'}{' '}
                                        {totals.expenseEUR
                                            ? '€'
                                            : totals.expenseUSD
                                                ? '$'
                                                : '~'}
                                    </code>
                                </TableCell>
                                <TableCell className="font-bold text-right text-[16px]">
                                    <code>
                                        {totals.currentValueEUR
                                            ? format(totals.currentValueEUR)
                                            : totals.currentValueUSD
                                                ? format(totals.currentValueUSD)
                                                : '0,00'}{' '}
                                        {totals.currentValueEUR
                                            ? '€'
                                            : totals.currentValueUSD
                                                ? '$'
                                                : '~'}
                                    </code>
                                </TableCell>
                                <TableCell className="font-bold text-right text-[16px]">
                                    <code>
                                        {totalProfitPct != null
                                            ? `${format(totalProfitPct)} %`
                                            : '—'}
                                    </code>
                                </TableCell>
                                <TableCell className="font-bold text-right text-[16px]">
                                    <code>
                                        {totals.profitEUR
                                            ? format(totals.profitEUR)
                                            : totals.profitUSD
                                                ? format(totals.profitUSD)
                                                : '0,00'}{' '}
                                        {totals.profitEUR
                                            ? '€'
                                            : totals.profitUSD
                                                ? '$'
                                                : '~'}
                                    </code>
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
