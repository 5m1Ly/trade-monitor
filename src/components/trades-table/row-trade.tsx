import React from "react";
import { cn } from "@/lib/utils";
import { TableCell, TableRow } from "../ui/table";
import { Button } from "../ui/button";
import { format } from "./utils";

export type TradeRowProps = {
    trade: {
        id: string;
        tokenId: string;
        currency: 'EUR' | 'USD';
        amount: number;
        buy: {
            date: string;
            price: number;
        };
        sell: {
            date: string | null;
            price: number | null;
        };
        active: boolean;
    };
    currentPriceEUR: number | null;
    currentPriceUSD: number | null;
    expenseEUR: number | null;
    expenseUSD: number | null;
    currentValueEUR: number | null;
    currentValueUSD: number | null;
    profitEUR: number | null;
    profitUSD: number | null;
    profitPct: number | null;
    onSellClick?: () => void;
};

export const TradeRow = ({
    trade,
    currentValueEUR,
    currentValueUSD,
    profitEUR,
    profitUSD,
    profitPct,
    onSellClick,
}: TradeRowProps) => {

    const symbol = trade.currency === 'EUR' ? '€' :
        trade.currency === 'USD' ? '$' :
            '~';

    const Row = ({ children }: React.PropsWithChildren) => (
        <TableRow>
            {children}
        </TableRow>
    );

    const Cell = ({ pos, children }: React.PropsWithChildren<{ pos?: 'center' | 'right' }>) => (
        <TableCell className={cn(
            pos !== 'center' ? (pos !== 'right' ? '' : 'text-right') : 'text-center'
        )}>
            <code>
                {children}
            </code>
        </TableCell>
    );

    // Active trade (not sold yet)
    if (trade.active) {
        const currentValue = trade.currency === 'EUR' ? currentValueEUR : currentValueUSD;
        const profit = trade.currency === 'EUR' ? profitEUR : profitUSD;

        return (
            <Row>
                {/* date */}
                <Cell>
                    {trade.buy.date}
                </Cell>

                {/* price */}
                <Cell>
                    {trade.buy.price.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                </Cell>

                {/* amount */}
                <Cell pos="right">
                    {format(trade.amount)}
                </Cell>

                {/* cost */}
                <Cell pos="right">
                    {format(trade.amount * trade.buy.price)}{' '}{symbol}
                </Cell>

                {/* value */}
                <Cell pos="right">
                    {format(currentValue)}{' '}{symbol}
                </Cell>

                {/* profit % */}
                <Cell pos="right">
                    <span
                        className={cn(
                            profitPct != null && profitPct > 0 && 'text-green-600 dark:text-green-500',
                            profitPct != null && profitPct <= 0 && 'text-rose-600 dark:text-rose-500'
                        )}
                    >
                        {profitPct != null ? `${format(profitPct)} %` : '—'}
                    </span>
                </Cell>

                {/* profit $ */}
                <Cell pos="right">
                    <span
                        className={cn(
                            profit != null && profit > 0 && 'text-green-600 dark:text-green-500',
                            profit != null && profit <= 0 && 'text-rose-600 dark:text-rose-500'
                        )}
                    >
                        {format(profit)}{' '}{symbol}
                    </span>
                </Cell>

                {/* actions */}
                <TableCell
                    className="text-right p-0 pr-0.5"
                >
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onSellClick}
                    >
                        MaS
                    </Button>
                </TableCell>
            </Row>
        );
    }

    // Closed trade (sold)
    if (!trade.sell.price) return null;

    const calculateDiff = (buyPrice: number, sellPrice: number) => {
        const buyStr = buyPrice.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');
        const sellStr = sellPrice.toFixed(20).replace(/0+$/, '').replace(/\.$/, '');

        const [buyIntPart = '0', buyDecPart = ''] = buyStr.split('.');
        const [sellIntPart = '0', sellDecPart = ''] = sellStr.split('.');

        const maxDecLength = Math.max(buyDecPart.length, sellDecPart.length);
        const buyDecNorm = buyDecPart.padEnd(maxDecLength, '0');
        const sellDecNorm = sellDecPart.padEnd(maxDecLength, '0');

        const buyFull = BigInt(buyIntPart + buyDecNorm);
        const sellFull = BigInt(sellIntPart + sellDecNorm);

        const diffFull = sellFull - buyFull;

        const diffStr = diffFull.toString().padStart(maxDecLength + 1, '0');
        const intPart = diffStr.slice(0, -maxDecLength) || '0';
        const decPart = diffStr.slice(-maxDecLength);

        return parseFloat(`${intPart}.${decPart}`);
    };

    const diff = calculateDiff(trade.buy.price, trade.sell.price);
    const percent = (diff / trade.buy.price) * 100;
    const nominal = diff * trade.amount;

    return (
        <Row>
            {/* date */}
            <Cell>
                {trade.sell.date}
            </Cell>

            {/* price */}
            <Cell>
                {trade.sell.price.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })} ({diff.toLocaleString('en-US', { useGrouping: false, minimumFractionDigits: 8, maximumFractionDigits: 8 })})
            </Cell>

            {/* amount */}
            <Cell pos="right">
                {format(trade.amount)}
            </Cell>

            {/* cost */}
            <Cell pos="right">
                {format(trade.amount * trade.buy.price)}{' '}{symbol}
            </Cell>

            {/* value */}
            <Cell pos="right">
                {format(trade.amount * trade.sell.price)}{' '}{symbol}
            </Cell>

            {/* profit % */}
            <Cell pos="right">
                <span
                    className={cn(
                        percent > 0 && 'text-green-600 dark:text-green-500',
                        percent <= 0 && 'text-rose-600 dark:text-rose-500'
                    )}
                >
                    {format(percent)} %
                </span>
            </Cell>

            {/* profit $ */}
            <Cell pos="right">
                <span
                    className={cn(
                        nominal > 0 && 'text-green-600 dark:text-green-500',
                        nominal <= 0 && 'text-rose-600 dark:text-rose-500'
                    )}
                >
                    {format(nominal)}{' '}{symbol}
                </span>
            </Cell>

            {/* actions */}
            <Cell />
        </Row>
    );
};
