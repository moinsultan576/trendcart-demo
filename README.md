# TrendCart — AI E-commerce Store + CRM (live demo)

Portfolio demo by **AI Digital Marketing**. Sample data only — no real orders, customers or payments.

- **Storefront:** categories, best sellers, deals, product details, wishlist, cart drawer, coupons (try `WELCOME10`, `SAVE50`, `FREESHIP`), cash-on-delivery checkout (no card payments).
- **AI shopping assistant (WhatsApp style):** recommends products and adds them to cart, tracks orders (e.g. `#TC-00124`), opens return/complaint tickets.
- **Store CRM:** dashboard, orders (status, invoice, CSV export), products, customers, analytics, abandoned-cart WhatsApp drafts, AI assistant log, discounts, review replies, WhatsApp inbox, settings.
- English, Arabic (RTL) and Urdu (RTL); light/dark; mobile-friendly.

## Deploy
Static site + Vercel functions (`/api/chat`, `/api/health`). Optional env vars in Vercel: `GEMINI_API_KEY` (and/or `GROQ_API_KEY`). Without a key the assistant uses a built-in rule-based fallback.

Product photos: Unsplash (free license).
