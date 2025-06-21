# AM ERP Vue Demo

This repository demonstrates a simple Vue-based ERP demo.


## Internationalization

This project now includes basic i18n setup using [vue-i18n](https://vue-i18n.intlify.dev/).
Translation files live under `src/locales`.

## Source Structure

Domain modules live under `src/modules`. Each module contains an
`index.vue` file as a placeholder component. For example:

```
src/modules/user/index.vue
src/modules/product/index.vue
```

You can extend these components with actual business logic.


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

## Testing

Run unit tests with:

```bash
npm run test
```

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

## State Management

This project uses [Pinia](https://pinia.vuejs.org/) for state management. An example
store is located in `src/store/counter.js`.

