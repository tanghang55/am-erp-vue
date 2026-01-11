# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Vue 3 frontend application built with TypeScript, Vite, and modern development tools. It serves as the frontend for the ERP system.

## Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **TypeScript** - Type-safe development
- **Vite 7.x** - Fast build tool and dev server
- **Vue Router 4** - Client-side routing
- **Pinia** - State management
- **ESLint** - Code linting
- **Prettier** - Code formatting

## Requirements

- Node.js 20.19+ or 22.12+
- npm (comes with Node.js)

## Development Commands

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Type checking and build for production
npm run build

# Build only (without type checking)
npm run build-only

# Type check without building
npm run type-check

# Preview production build locally
npm run preview

# Lint and auto-fix
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
src/
├── main.ts              # Application entry point
├── App.vue              # Root component
├── views/               # Page components (route targets)
│   ├── HomeView.vue
│   └── AboutView.vue
├── components/          # Reusable components
│   ├── HelloWorld.vue
│   ├── TheWelcome.vue
│   ├── WelcomeItem.vue
│   └── icons/          # Icon components
├── router/
│   └── index.ts        # Vue Router configuration
├── stores/             # Pinia stores
│   └── counter.ts
└── assets/             # Static assets
    ├── main.css
    ├── base.css
    └── logo.svg

public/                 # Static files (copied as-is)
```

## Development Server

```bash
npm run dev
```

The dev server will start with:
- Hot Module Replacement (HMR)
- Fast refresh for Vue components
- TypeScript type checking
- Source maps for debugging

Default URL: `http://localhost:5173` (Vite default port)

## Building for Production

```bash
# Full build with type checking
npm run build

# Output directory: dist/
```

The build process:
1. Type checks with `vue-tsc`
2. Bundles with Vite
3. Outputs optimized files to `dist/`

Preview the production build:
```bash
npm run preview
```

## Routing

Routes are defined in `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      // Lazy-loaded route
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
```

## State Management with Pinia

Stores are in `src/stores/`. Example:

```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
```

Using stores in components:

```vue
<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div>{{ counter.count }}</div>
  <button @click="counter.increment()">Increment</button>
</template>
```

## Component Development

### Composition API with `<script setup>`

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

// Props
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})

// Emits
const emit = defineEmits<{
  update: [value: number]
}>()

// State
const localCount = ref(props.count)

// Computed
const doubled = computed(() => localCount.value * 2)

// Methods
function increment() {
  localCount.value++
  emit('update', localCount.value)
}
</script>

<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Count: {{ localCount }} (Doubled: {{ doubled }})</p>
    <button @click="increment">Increment</button>
  </div>
</template>

<style scoped>
h1 {
  color: #42b983;
}
</style>
```

## TypeScript Configuration

- `tsconfig.json` - Base config
- `tsconfig.app.json` - App-specific config
- `tsconfig.node.json` - Node/Vite config

Type support for `.vue` imports is handled by `vue-tsc`.

## Linting and Formatting

### ESLint

Configuration: `eslint.config.ts`

```bash
# Lint all files
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Prettier

Configuration: `.prettierrc.json`

```bash
# Format all files in src/
npm run format
```

## API Integration

When connecting to the backend API (am-erp-php):

### Option 1: Vite Proxy (Development)

Edit `vite.config.ts`:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9501',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
```

### Option 2: Environment Variables

Create `.env.development` and `.env.production`:

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:9501

# .env.production
VITE_API_BASE_URL=https://api.example.com
```

Use in code:

```typescript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
```

### Making API Requests

```typescript
// Using fetch
async function fetchUsers() {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users`)
  return response.json()
}

// Or install axios: npm install axios
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
})

async function fetchUsers() {
  const { data } = await api.get('/api/users')
  return data
}
```

## Vite Configuration

Configuration file: `vite.config.ts`

Default setup includes:
- Vue plugin with JSX support
- Path alias: `@/` → `src/`
- Vue DevTools (development only)

## IDE Setup

**Recommended:**
- VS Code with Vue (Official) extension
- Disable Vetur if installed (conflicts with Vue Official)

**Browser DevTools:**
- Chrome/Edge: Install Vue.js devtools extension
- Enable Custom Object Formatters in DevTools settings

## Common Workflows

### Adding a New Page

1. Create component in `src/views/NewPage.vue`
2. Add route in `src/router/index.ts`
3. Add navigation link in app/layout component
4. Dev server will hot reload automatically

### Adding a New Component

1. Create component in `src/components/YourComponent.vue`
2. Import and use in other components:
   ```vue
   <script setup lang="ts">
   import YourComponent from '@/components/YourComponent.vue'
   </script>
   ```

### Adding a New Store

1. Create store file in `src/stores/yourStore.ts`
2. Define store with `defineStore`
3. Import and use in components:
   ```typescript
   import { useYourStore } from '@/stores/yourStore'
   const store = useYourStore()
   ```

### Styling

- Use `<style scoped>` for component-specific styles
- Global styles go in `src/assets/main.css`
- Base styles in `src/assets/base.css`

## Important Notes

- **TypeScript**: All `.vue` files should use `lang="ts"` in script tags
- **Path Alias**: Use `@/` to import from `src/` directory
- **Composition API**: Prefer `<script setup>` syntax for conciseness
- **Reactive**: Use `ref()` for primitives, `reactive()` for objects
- **Dev Server**: Auto-restarts on config changes (vite.config.ts, tsconfig, etc.)
- **Environment Variables**: Must start with `VITE_` to be exposed to client code

## Debugging

1. Browser DevTools with source maps
2. Vue DevTools browser extension
3. VSCode debugger (set up launch.json for Chrome/Edge debugging)

## Production Deployment

1. Build: `npm run build`
2. Test production build: `npm run preview`
3. Deploy `dist/` folder to web server
4. Configure server for SPA routing (redirect all routes to index.html)

Example nginx config for SPA:
```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```
