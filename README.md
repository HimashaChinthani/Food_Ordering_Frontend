# Food Ordering Frontend

A responsive single-page food ordering application built with React and Vite. It provides a complete customer-facing experience for browsing a restaurant menu, managing a cart, and handling user accounts, along with basic admin pages for managing orders and users.

## Features

- Landing and marketing pages (home, about, mission, vision, services, contact)
- Menu browsing with categories and search
- Menu item detail view with quantity selection
- Cart management with add / remove / update quantity
- Checkout flow with payment success screen (UI level)
- User authentication pages (login, register, profile)
- Admin dashboard pages for viewing orders and users
- Persistent cart state via React context
- Responsive layout with shared header, navbar, and footer

## Tech Stack

- React (SPA)
- Vite (build tooling, dev server)
- JavaScript (ES modules)
- CSS for styling (per-page and per-component styles)

## Project Structure

Key folders under `frontend/src`:

- `components/`
	- `Navbar.jsx`, `Header.jsx`, `Footer.jsx` – shared layout components
	- `SearchBar.jsx`, `CategoryFilter.jsx` – menu search and filter UI
	- `MenuCard.jsx` – reusable menu item card
	- `Cart.jsx`, `QuantityModal.jsx` – cart and quantity selection components
- `pages/`
	- `MainLanding.jsx`, `Home.jsx` – main landing and home experiences
	- `MenuPage.jsx`, `MenuItemDetail.jsx` – menu listing and item detail
	- `CartPage.jsx`, `PaymentSuccess.jsx` – cart and post-checkout views
	- `LoginPage.jsx`, `RegisterPage.jsx`, `Profile.jsx` – auth and profile
	- `About.jsx`, `Contact.jsx`, `Mission.jsx`, `Vision.jsx`, `Service.jsx`, `Info.jsx` – informational pages
	- `AdminDashboard.jsx`, `AdminOrders.jsx`, `AdminUsers.jsx` – admin views
- `context/`
	- `CartContext.jsx` – global cart state (items, totals, actions)
- `data/`
	- `sampleProducts.js` – sample menu/product data used by the UI

Global app entry points:

- `main.jsx` – bootstraps React and wraps the app with providers
- `App.jsx` – top-level layout and routing between pages

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm or yarn

### Installation

From the `frontend` folder:

1. Install dependencies:
	 - `npm install`
2. Start the development server:
	 - `npm run dev`
3. Open the URL shown in the terminal (typically `http://localhost:5173`).

### Build for Production

From the `frontend` folder:

- `npm run build` – builds the optimized production bundle
- `npm run preview` – locally preview the production build

## Cart & State Management

The cart is managed via `CartContext` under `src/context/CartContext.jsx`, which exposes actions for adding, updating, and removing items and is consumed by cart-related components and pages.

## Admin Views

The admin pages (`AdminDashboard`, `AdminOrders`, `AdminUsers`) are currently frontend-only screens meant to integrate with a backend API for real data. They can be wired to your server endpoints for orders, users, and dashboard metrics.

## Future Improvements

- Connect to a real backend for authentication, orders, and payments
- Add form validation and better error handling
- Enhance accessibility and keyboard navigation
- Add tests for core components and context logic

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
