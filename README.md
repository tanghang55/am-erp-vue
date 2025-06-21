# AM ERP Vue Demo

This repository demonstrates a simple Vue-based ERP demo.

## Prerequisites

- Node.js **16** or later is recommended.

## Installation

Install dependencies using npm:

```bash
npm install
```

This project uses [Axios](https://axios-http.com/) for HTTP requests. If you
don't have access to the internet in your environment you may need to add the
`axios` package manually to `package.json`.

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

## API Usage

API calls are defined in `src/api/index.js`. By default, real HTTP requests are
sent using Axios. To work without a backend you can enable the mock API
implementation which returns fixture data from JSON files.

Set the following environment variable when starting the dev server:

```bash
# Use mock responses
VITE_USE_MOCK=true npm run dev

# Use the real API (default)
VITE_USE_MOCK=false npm run dev
```

The base URL for the real API can be configured with `VITE_API_BASE_URL`.
