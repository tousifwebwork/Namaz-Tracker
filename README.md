# Namaz Tracker

A Next.js prayer tracker using plain JavaScript/JSX, MongoDB, and Mongoose. Users can create an account, record each of the five daily prayers, apply day/month/year bulk actions, browse the Islamic calendar, and review make-up prayer statistics.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and set a MongoDB connection string and a long random session secret.

3. Start the development server:

   ```bash
   npm run dev
   ```

The application is available at `http://localhost:3000`. MongoDB must be reachable before registration or login can be used.

## Scripts

- `npm run dev` starts the development server.
- `npm run lint` checks the JavaScript/JSX source.
- `npm run build` creates a production build.
- `npm start` serves the production build.

The project contains no application `.ts` or `.tsx` files. Authentication uses an HTTP-only, signed cookie; passwords are hashed with bcrypt; every prayer and profile route requires an authenticated user.
