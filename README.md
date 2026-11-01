# Retirement Planner

A client-side retirement calculator built with React + Vite and a ChatGPT-inspired dark interface.

## Run locally
1. Install Node.js 18+.
2. Run `npm install`
3. Run `npm run dev`

## Deploy to Vercel
1. Upload these files to a GitHub repository.
2. Import that repository in Vercel.
3. Select Vite (auto-detected), build command `npm run build`, output directory `dist`.
4. Deploy.

## Calculation assumptions
- Monthly contributions are added at the end of each month.
- Contribution amount increases once per year by the step-up percentage.
- FD and equity are tracked separately and compounded monthly using the respective nominal annual return assumptions.
- Monthly spending at retirement is today's desired spending inflated for the full investment period.
- Withdrawals are monthly and spending rises with inflation using an effective monthly inflation rate.
- Returns are assumed constant and smooth. Taxes, fees, volatility, sequence-of-returns risk, and FD interest taxation are not modeled.
- This is an estimate, not a guarantee or financial advice.
