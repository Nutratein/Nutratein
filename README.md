# Drago Pharma — Next.js

This is the Next.js (App Router) conversion of the original Vite + React + React Router
Drago Pharma site. All pages, the Supabase data layer, cart/auth context, and the admin
panel have been ported as-is; only the routing layer and a couple of browser-only APIs
changed to fit Next.js conventions.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

Supabase credentials already carried over from your original `.env` are in `.env.local`
(gitignored). If you need to point at a different project, copy `.env.local.example` and
fill in your own values:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## What changed vs. the Vite app

- **Routing**: `react-router-dom` → Next.js App Router. Every route from `src/pages/*` now
  lives under `app/*/page.jsx` (e.g. `src/pages/Shop.jsx` → `app/shop/page.jsx`,
  `src/pages/ProductDetail.jsx` → `app/shop/[slug]/page.jsx`).
- **Navigation hooks**: `useNavigate` → `useRouter` (`next/navigation`), `useParams` →
  `useParams` (`next/navigation`), `useSearchParams`/`useLocation` → their Next.js
  equivalents. `<Link to="...">` → `<Link href="...">`.
- **Protected/Admin routes**: previously handled by `<ProtectedRoute>` / `<AdminRoute>`
  wrapping `<Route>` elements; now the same components wrap the page content directly
  (see `app/checkout/page.jsx`, `app/account/page.jsx`, `app/admin/layout.jsx`).
- **Cart persistence**: `localStorage` access in `CartContext` is now guarded so it only
  runs after mount (avoids Next.js SSR/hydration errors).
- **Fonts**: Roboto / Roboto Slab load via a standard Google Fonts `<link>` in
  `app/layout.jsx` (works the same as the original `index.html`).
- **Page transitions**: the route-change fade used by `framer-motion` + `AnimatePresence`
  now lives in `components/PageTransition.jsx`, driven by `usePathname()`.

Everything else — Supabase queries, the cart/checkout flow, the admin CMS for homepage
content, products, categories and orders — is unchanged in behavior.

## New hero section — floating/moving cards

`app/page.jsx` now renders `components/HeroVisual.jsx` next to the hero copy instead of
the old plain gradient blobs alone. It shows:

- A large product card that **tilts toward your cursor** (a subtle 3D parallax effect)
  and gently bobs up and down on its own.
- Three small floating badge cards ("Purity Verified", "Ships In 24h", "Secure
  Checkout") that drift independently at different speeds, so the hero always feels
  alive even before you move your mouse.

This was built from scratch as an interpretation of a "moving cards" hero, since no
reference video ended up attached to our conversation. If you have a specific reference
you'd like matched exactly, share it and the animation in `HeroVisual.jsx` can be
adjusted to match (timing, direction, card count, tilt strength, etc.) — all of that
lives in one file plus the `.hv-*` styles in `app/globals.css`.

## Project structure

```
app/                     Routes (App Router)
  admin/                 Admin CMS (guarded by AdminRoute via app/admin/layout.jsx)
  shop/[slug]/           Product detail (dynamic route)
  order-confirmation/[orderId]/
components/              Shared UI (Header, Footer, ProductCard, HeroVisual, ...)
context/                 CartContext, AuthContext (client-side, unchanged logic)
lib/                     supabaseClient.js, siteContent.js
public/images/           Product + logo images (copied from the original project)
supabase/                Your original schema.sql / admin_and_content.sql
```
