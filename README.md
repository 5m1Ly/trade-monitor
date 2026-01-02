# Crypto Trade Monitor

A modern web application to track your cryptocurrency holdings per-trade with live price updates and profit calculations.

## Features

✨ **Manual Trade Entry**

-   Add individual trades with token, amount, purchase price, and date
-   Support for EUR and USD currencies
-   Uses CoinGecko token IDs for accurate price tracking

📊 **Comprehensive Trade Tracking**

-   View each trade separately with purchase details
-   Real-time current prices in both EUR and USD
-   Profit calculations in EUR, USD, and percentage
-   **Totals row** showing:
    -   Total holdings amount
    -   Total expenses (EUR/USD)
    -   Total current value (EUR/USD)
    -   Total profit margins (EUR/USD/%)

🎨 **Modern UI with shadcn/ui**

-   Beautiful, accessible components
-   Dark mode support
-   Responsive design for all screen sizes
-   Professional data tables and forms

## Tech Stack

-   **Framework:** Next.js 16 (App Router) with Turbopack
-   **UI Library:** shadcn/ui + Tailwind CSS 4
-   **Language:** TypeScript
-   **APIs:** CoinGecko (prices), ExchangeRate.host (FX rates)

## Getting Started

### Prerequisites

-   Node.js 20+
-   pnpm (or npm/yarn)
-   **Optional:** Phantom Wallet ([Install](https://phantom.app/)) for Solana
-   **Optional:** MetaMask ([Install](https://metamask.io/)) for Ethereum

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

### Manual Trade Entry

1. Fill in the "Add Trade" form:

    - **Token:** CoinGecko ID (e.g., `bitcoin`, `ethereum`, `solana`)
    - **Symbol:** Display symbol (e.g., `BTC`, `ETH`) - optional
    - **Amount:** Number of tokens purchased
    - **Price:** Price per token at time of purchase
    - **Currency:** EUR or USD
    - **Date:** Purchase date

2. Click "Add Trade" to save

### Viewing Your Portfolio

-   The trades table shows all your trades with:
    -   Current prices fetched live from CoinGecko
    -   Profit/loss for each trade in EUR, USD, and percentage
    -   Color-coded profit indicators (green for gains, red for losses)
-   The bottom totals row summarizes your entire portfolio
-   Click "Delete" on any trade to remove it

## Data Storage

-   All trades are stored in your browser's `localStorage`
-   Data persists across sessions but is local to your browser
-   No account or server storage required

## API Notes

### Public APIs Used

-   **CoinGecko:** Free tier for price data (rate limited)
-   **ExchangeRate.host:** Free FX rates

### Rate Limits

The app uses public APIs without keys, which may have rate limits. If you experience issues, wait a few minutes before refreshing.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── prices/route.ts        # CoinGecko price fetching
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main page
│   └── globals.css                 # Global styles
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── AddTradeForm.tsx           # Manual trade entry form
│   └── TradesTable.tsx            # Main trades table with totals
└── lib/
    └── utils.ts                    # Utility functions
```

## Development

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint with Biome
pnpm lint

# Format code with Biome
pnpm format
```

## Known Limitations

1. **Rate Limits:** Public CoinGecko API may throttle during heavy usage
2. **Manual Entry Only:** All trades must be entered manually

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## License

MIT
