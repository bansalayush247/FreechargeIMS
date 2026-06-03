# Frontend Architecture

This frontend uses Next.js App Router with a feature-based structure designed for enterprise IMS workflows.

## Folder Tree

```text
public/
  images/
  icons/
  fonts/
src/
  app/
    layout.tsx
    page.tsx
    loading.tsx
    error.tsx
    not-found.tsx
    (auth)/
      layout.tsx
      login/page.tsx
      signup/page.tsx
      forgot-password/page.tsx
    (dashboard)/
      layout.tsx
      dashboard/page.tsx
      products/page.tsx
      warehouses/page.tsx
      inventory/page.tsx
      requests/page.tsx
      users/page.tsx
      settings/page.tsx
      notifications/page.tsx
      admin/page.tsx
      spaces/page.tsx
      spaces/[id]/page.tsx
  components/
    charts/
    common/
    forms/
    layout/
    modals/
    tables/
    ui/
  config/
  constants/
  features/
    auth/
    inventory/
    orders/
    products/
    settings/
    users/
    warehouses/
  hooks/
  lib/
  providers/
  services/
    http/
  store/
  styles/
  types/
  middleware.ts

tests/
  unit/
  integration/
  e2e/
```

## Folder Roles

- `src/app/` owns routing, route groups, and page composition.
- `src/features/` owns feature-specific API calls, hooks, schemas, tables, and forms.
- `src/components/ui/` holds reusable primitives that stay business-agnostic.
- `src/components/layout/` holds reusable shells, page headers, and cross-page scaffolding.
- `src/services/` holds Axios clients, token refresh handling, and backend-facing service functions.
- `src/store/` holds global Zustand state.
- `src/config/` holds validated env, navigation, and query client setup.
- `src/constants/` holds route paths, permissions, and query keys.
- `src/types/` holds shared API and domain types.
- `src/lib/` holds shared utilities and compatibility wrappers.

## Naming Conventions

- Use singular nouns for feature folders when the domain is a capability, and plural nouns for collections exposed to users.
- Name server-facing functions by intent: `getProducts`, `createWarehouse`, `refreshSession`.
- Name React components with PascalCase and keep file names aligned with component names.
- Name hooks with `use` prefixes and domain intent: `useProducts`, `useWarehouses`, `useAuth`.
- Name schemas with the domain suffix: `loginSchema`, `productSchema`, `warehouseSchema`.

## Import Conventions

- Prefer `@/src/...` absolute imports for all internal code.
- Import from feature barrels when a module needs multiple exports from the same domain.
- Import from shared UI primitives for presentation-only elements.
- Keep route files thin and push business logic into feature hooks and services.

## API Layer Pattern

- `src/services/http/client.ts` manages the shared Axios instance and 401 refresh flow.
- `src/services/auth.service.ts` contains auth requests and session normalization.
- Each feature owns its own API file for feature-specific endpoints.
- Query hooks consume feature APIs and normalize payloads before rendering.

## Component Pattern

- Route pages compose feature components and shared page shells.
- Tables use reusable table primitives and stay presentation-focused.
- Forms use React Hook Form + Zod and never call Axios directly.
- Dialogs and cards stay in the shared UI layer.

## Feature Module Pattern

- `api.ts` for network calls.
- `schemas.ts` for Zod validation.
- `types.ts` for module-specific domain types.
- `hooks/` for React Query or state hooks.
- `components/` for feature-specific visual elements.
- `index.ts` for a clean public module boundary.

## Best Practices

- Keep UI components free of backend logic.
- Normalize API payloads at the edge.
- Use React Query for server state and Zustand for local/session state.
- Guard protected routes through a dedicated layout boundary.
- Prefer small, reusable modules over large page-specific implementations.
