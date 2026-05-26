This is the frontend for FreechargeIMS, built with Next.js and TypeScript.

## Getting Started

Create a local environment file first:

```bash
Copy-Item .env.example .env.local
```

Set NEXT_PUBLIC_API_BASE to your backend host. The default is http://localhost:3000.

Then run the development server:

```bash
npm run dev
```

Open http://localhost:3001 with your browser to see the result when running the frontend dev server.

## Scripts

- npm run dev - start the Next.js app in development mode.
- npm run build - build the production app.
- npm run start - run the production build.
- npm run lint - run ESLint.

## API Notes

The frontend talks to the backend under the API base URL plus /api/v1. The first sprint uses that value in the landing page and the shared axios client so later auth and request flows can reuse the same base URL.

## Role Matrix

The backend seeds these default roles in the super-admin space:

| Role | Access |
| --- | --- |
| Space Admin | Full access to all permissions: space, users, roles, warehouse, products, inventory, inventory transactions, asset requests, repairs, workflows, notifications, reports, and audit logs. |
| Inventory Manager | Inventory and operations access: create, update, view, and assign inventory; create, view, update, complete, and cancel repairs; create, view, update, delete, and execute workflows; view notifications; send notifications. |
| Viewer | Read-first access: create asset requests; view space, roles, inventory, inventory transactions, repairs, and notifications. |

Defined but not bootstrapped by default: Approver, Auditor, Warehouse Manager.
