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

## State Management

This project uses [Pinia](https://pinia.vuejs.org/) for state management. An example
store is located in `src/store/counter.js`.
