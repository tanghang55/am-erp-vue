# AM ERP Vue Demo

This repository demonstrates a simple Vue-based ERP demo.

## Prerequisites

- Node.js **16** or later is recommended.

## Installation

Install dependencies using npm:

```bash
npm install
```

## Environment Configuration

Environment variables are stored in `.env` files at the project root. Three files are included by default:

- `.env` – base defaults shared by all modes
- `.env.development` – overrides used when running `npm run dev`
- `.env.production` – overrides for production builds

Each file defines example variables for the API endpoint and application title:

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_TITLE=AM ERP (Dev)
```

Update these values to match your environment. Variables must begin with `VITE_` to be available in the client code. Vite automatically loads the appropriate file based on the command you run.

## Development

Start the development server with:

```bash
npm run dev
```

This will launch the local server, typically at `http://localhost:5173`.

## Usage Example

```bash
$ npm run dev
> vite
  VITE v4.x  ready in 300 ms
  ➜  Local:   http://localhost:5173/
```

A screenshot or more detailed demo may be added in the future.
