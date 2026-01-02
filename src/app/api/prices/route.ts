import { NextResponse } from "next/server";

// Simple serverless route that returns current prices (EUR & USD) for given CoinGecko ids
// Query: /api/prices?ids=bitcoin,ethereum
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const ids = url.searchParams.get("ids");
        if (!ids) {
            return NextResponse.json({ error: "missing ids query param" }, { status: 400 });
        }

        const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
            ids
        )}&vs_currencies=usd,eur`;

        const [cgRes, fxRes] = await Promise.all([
            fetch(cgUrl),
            fetch("https://api.exchangerate.host/latest?base=EUR&symbols=USD"),
        ]);

        if (!cgRes.ok) {
            console.log("CoinGecko fetch failed:", await cgRes.text());
            return NextResponse.json({ error: "failed to fetch prices from coingecko" }, { status: 502 });
        }

        const prices = await cgRes.json();
        const fx = await fxRes.json();

        const eurUsd = fx?.rates?.USD ?? null;

        return NextResponse.json({ prices, rates: { EUR_USD: eurUsd } });
    } catch (err: any) {
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}
