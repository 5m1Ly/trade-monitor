"use client";

import type React from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  currency: "EUR" | "USD";
  buy: {
    price: number;
    date: string; // ISO date
  };
} & (
  | {
      active: true; // true when trade hasn't been sold
      sell: {
        price: null;
        date: null; // ISO date
      };
    }
  | {
      active: false; // true when trade hasn't been sold
      sell: {
        price: number;
        date: string; // ISO date
      };
    }
);

export default function AddTradeForm({ onAdd }: { onAdd: (t: Trade) => void }) {
  const [tokenId, setTokenId] = useState("shiba-inu");
  const [symbol, setSymbol] = useState("SHIB");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("0.00000");
  const [currency, setCurrency] = useState<"EUR" | "USD">("EUR");
  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tokenId || !amount || !price) return;
    const trade: Trade = {
      id: String(Date.now()),
      tokenId: tokenId.trim().toLowerCase(),
      symbol: symbol.trim().toUpperCase() || tokenId.trim().toUpperCase(),
      amount: Number(amount),
      currency,
      active: true,
      buy: {
        price: Number(price),
        date,
      },
      sell: {
        price: null,
        date: null,
      },
    };
    onAdd(trade);
    setTokenId("shiba-inu");
    setSymbol("SHIB");
    setAmount("");
    setPrice("0.00000");
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
              <Select
                value={currency}
                onValueChange={(v) => setCurrency(v as "EUR" | "USD")}
              >
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
                value={price}
                onChange={(e) => setPrice(e.target.value)}
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
