"use client";

import React from "react";
import AddTradeForm from "../components/AddTradeForm";
import TradesTable from "../components/trades-table/table";
import { useTrades } from "@/hooks/trades";
import { usePrices } from "@/hooks/prices";

export default function Home() {
    const { trades, addTrade, deleteTrade, sellTrade } = useTrades();
    const { prices, rates } = usePrices(['shiba-inu']);

    const shib = prices['shiba-inu']?.eur?.toFixed(8) || "0.00000600";

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <main className="mx-auto w-full max-w-7xl space-y-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Shiba Inu Monitor ({shib})</h1>
                    <p className="text-muted-foreground">
                        Track your crypto holdings per-trade with live prices, profit calculations in EUR & USD, and wallet import support.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="sm:col-span-3">
                        <AddTradeForm onAdd={addTrade} />
                    </div>
                    <div className="sm:col-span-9">
                        <TradesTable trades={trades} onDelete={deleteTrade} onSell={sellTrade} prices={prices} rates={rates} />
                    </div>
                </div>
            </main>
        </div>
    );
}

// a3 = 297 mm x 420 mm = 124740 mm2 = 875           $          ~= 935.55   $ > 4455.00          $ = 3519.45          $ net
//                         /124740 v                                x124740 ^            x124740 ^            x124740 ^
//        1 mm x   1 mm =      1 mm2 = 0.00701459034 $          ~=   0.0075 $ >    0.03571428571 $ =    0.02821428571 $ net
//                            x100 v                                   /100 ^               /100 ^               /100 ^
//       10 mm x  10 mm =    100 mm2 = 0.701459034   $          ~=   0.75   $ >    3.571428571   $ =    2.821428571   $ net
//                             x14 v                                    /14 ^                /14 ^                /14 ^
//       70 mm x  20 mm =   1400 mm2 = 9.820426476   $ + 0.70 $ ~=  10.50   $ >   50.00          $ =   39.50          $ net
