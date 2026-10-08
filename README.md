# OrderSense portfolio demo

A portfolio-safe copy of the real OrderSense frontend. It preserves the same workflows, components, styling, responsive behavior, and mobile UX as the production application. The only substitution is its data source: `src/demoApi.ts` supplies fictional records in the browser instead of calling Railway, PostgreSQL, or Zoho.

The demo includes the authentic CEO dashboard, Sales CRM, recurring sales follow-ups, reorder forecasting, product consumption, delivery operations, finance workspace, purchase forecast, and admin navigation.

## Run locally

```powershell
npm install
npm run dev
```

## Deploy to Vercel

1. Import this repository in Vercel.
2. Vercel should detect **Vite** automatically. If needed, use build command `npm run build` and output directory `dist`.
3. Deploy. No environment variables are required.

All displayed names, order numbers, amounts, forecasts, and activity are fictional sample data.
