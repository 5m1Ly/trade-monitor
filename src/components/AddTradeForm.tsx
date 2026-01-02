"use client";

import React, { useState } from "react";

// Local storage data
// [{"id":"1767318061098","tokenId":"shiba-inu","symbol":"SHIB","amount":19891489.885786925,"priceAtTrade":0.0000059,"tradeCurrency":"EUR","date":"2026-01-01"},{"id":"1767318041743","tokenId":"shiba-inu","symbol":"SHIB","amount":1073213.3367439113,"priceAtTrade":0.00000599,"tradeCurrency":"EUR","date":"2025-12-18"},{"id":"1767318022189","tokenId":"shiba-inu","symbol":"SHIB","amount":1637677.5230555718,"priceAtTrade":0.00000604,"tradeCurrency":"EUR","date":"2025-12-18"},{"id":"1767318007337","tokenId":"shiba-inu","symbol":"SHIB","amount":2033080.8369887064,"priceAtTrade":0.00000632,"tradeCurrency":"EUR","date":"2025-12-18"},{"id":"1767317988105","tokenId":"shiba-inu","symbol":"SHIB","amount":2296056.9101791545,"priceAtTrade":0.00000646,"tradeCurrency":"EUR","date":"2025-12-17"},{"id":"1767317968425","tokenId":"shiba-inu","symbol":"SHIB","amount":3057964.365243128,"priceAtTrade":0.00000647,"tradeCurrency":"EUR","date":"2025-12-17"},{"id":"1767317948799","tokenId":"shiba-inu","symbol":"SHIB","amount":4452758.500507788,"priceAtTrade":0.00000667,"tradeCurrency":"EUR","date":"2025-12-15"},{"id":"1767317919914","tokenId":"shiba-inu","symbol":"SHIB","amount":5029627.9247844545,"priceAtTrade":0.00000689,"tradeCurrency":"EUR","date":"2025-12-14"},{"id":"1767317889953","tokenId":"shiba-inu","symbol":"SHIB","amount":7106489.112109042,"priceAtTrade":0.00000689,"tradeCurrency":"EUR","date":"2025-12-14"},{"id":"1767317868390","tokenId":"shiba-inu","symbol":"SHIB","amount":591175.7751770873,"priceAtTrade":0.00000699,"tradeCurrency":"EUR","date":"2025-12-14"},{"id":"1767317845605","tokenId":"shiba-inu","symbol":"SHIB","amount":9846272.367962627,"priceAtTrade":0.00000704,"tradeCurrency":"EUR","date":"2025-12-11"},{"id":"1767317780147","tokenId":"shiba-inu","symbol":"SHIB","amount":13729603.285751913,"priceAtTrade":0.0000072,"tradeCurrency":"EUR","date":"2025-12-05"}]

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export type Trade = {
    id: string;
    tokenId: string; // CoinGecko id (e.g., bitcoin, ethereum)
    symbol: string; // display symbol (BTC, ETH)
    amount: number;
    priceAtTrade: number; // number in tradeCurrency
    tradeCurrency: "EUR" | "USD";
    date: string; // ISO date
};

export default function AddTradeForm({
    onAdd,
}: {
    onAdd: (t: Trade) => void;
}) {
    const [tokenId, setTokenId] = useState("shiba-inu");
    const [symbol, setSymbol] = useState("SHIB");
    const [amount, setAmount] = useState("");
    const [priceAtTrade, setPriceAtTrade] = useState("0.00000");
    const [tradeCurrency, setTradeCurrency] = useState<"EUR" | "USD">("EUR");
    const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!tokenId || !amount || !priceAtTrade) return;
        const trade: Trade = {
            id: String(Date.now()),
            tokenId: tokenId.trim().toLowerCase(),
            symbol: symbol.trim().toUpperCase() || tokenId.trim().toUpperCase(),
            amount: Number(amount),
            priceAtTrade: Number(priceAtTrade),
            tradeCurrency,
            date,
        };
        onAdd(trade);
        setTokenId("shiba-inu");
        setSymbol("SHIB");
        setAmount("");
        setPriceAtTrade("0.00000");
        setDate(new Date().toISOString().slice(0, 10));
    }

    return (
        <Card>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">

                        <div className="sm:col-span-12 space-y-2">
                            <Label htmlFor="tokenId">Token (CoinGecko id)</Label>
                            <Input
                                id="tokenId"
                                value={tokenId}
                                onChange={(e) => setTokenId(e.target.value)}
                                placeholder="bitcoin"
                                required
                            />
                        </div>

                        <div className="sm:col-span-12 space-y-2">
                            <Label htmlFor="symbol">Symbol</Label>
                            <Input
                                id="symbol"
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value)}
                                placeholder="BTC"
                            />
                        </div>

                        <div className="sm:col-span-8 space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        <div className="sm:col-span-4 space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Select value={tradeCurrency} onValueChange={(v) => setTradeCurrency(v as "EUR" | "USD")}>
                                <SelectTrigger id="currency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EUR">EUR</SelectItem>
                                    <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-12 space-y-2">
                            <Label htmlFor="amount">Amount</Label>
                            <Input
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.5"
                                required
                            />
                        </div>

                        <div className="sm:col-span-12 space-y-2">
                            <Label htmlFor="price">Price</Label>
                            <Input
                                id="price"
                                value={priceAtTrade}
                                onChange={(e) => setPriceAtTrade(e.target.value)}
                                placeholder="30000"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Button type="submit">Add Trade</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
