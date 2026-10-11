<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# AGENTS.md — KTransport Frontend

**For any AI assistant or human** working inside this repository (`ktFrontend/`). Stack: Next.js 15 (app directory), React 19, TypeScript, Tailwind CSS. Consumes the KTransport backend API.

If the parent workspace is open (`G:\SourceCodeNitesh\`), the full coordination layer is at `../.agent/`. The database rules live at `../.agent/RULES/DATABASE.md` — relevant to you only when you spot a response shape that mixes unrelated concerns and need to flag it back to the backend.

---

## The frontend's job

- **Consume contracts**, do not invent them. Every API shape is defined in `../.agent/contracts/TASK-NNN-*.yaml`. Mirror those shapes in `src/types/`.
- **No direct `fetch` from UI components.** All API calls go through `services/*.ts` wrappers. Components consume hooks that consume services.
- **UI is composed of small page-scoped files.** `src/app/(dashbaord)/<feature>/page.tsx` is the entry point for each route; shared presentational pieces live in `src/app/components/`.

---

## Access control conventions (shipped in TASK-039)

Every protected page wraps its content in a `PagePermissionGuard`:

```tsx
export default function BillBookPage() {
  return (
    <PagePermissionGuard permission="billing.bill_book" moduleName="Bill Book">
      <BillBookContent />
    </PagePermissionGuard>
  );
}
```

- `permission` is the granular key the backend emits on `GET /api/navigation/permissions`.
- The guard reads from `NavigationContext.hasPermission(key)`. During load the guard shows a spinner; after load, an empty permissions list is **denied** (not permissive — this was a sharp defect fixed in TASK-039).
- The sidebar renderer at `src/app/components/layout/Sidebar.tsx` filters children by `item.permissionKey`. Add a `permissionKey` on every granular `SidebarItem` child in `src/app/config/sidebar.ts`.

Session hygiene:
- `useSessionHeartbeat` (in `src/hooks/`) fires every 30s. On JWT expiry or refresh failure it logs out and redirects to `/login?reason=session_expired`.
- `baseservice.ts` has a 401 interceptor that attempts one refresh then logs out if the refresh fails. Non-auth endpoints (`/auth/login|register|refresh|logout|forgot-password|accept-invite`) are excluded from the loop.
- `isAuthenticated()` checks both token presence AND the `exp` claim. Do not loosen this.

---

## UI primitives you must reuse

Do NOT reinvent these — the design language is already set.

| Need | Component | Where |
|---|---|---|
| Centered modal alert (error / success / warning / confirm) | `sweetAlert.*` imperative API | `src/app/components/ui/SweetAlert.tsx` |
| Transient toast | `toast.*` imperative API | `src/context/ToastContext.tsx` |
| Table shell | `<DataTable>` | `src/app/components/ui/DataTable.tsx` |
| Pagination (responsive, mobile-safe) | `<TablePagination>` | `src/app/components/ui/TablePagination.tsx` |
| Filter dropdown | `<CustomSelect>` | `src/app/components/ui/CustomSelect.tsx` |
| Date input | `<DatePicker>` | `src/app/components/ui/DatePicker.tsx` |
| Permission guard around a page | `<PagePermissionGuard>` | `src/app/components/ui/PagePermissionGuard.tsx` |

**SweetAlert vs toast**: SweetAlert is for events the user MUST acknowledge (submit failures, destructive confirms, success of a flow that moved data). Toast is for background info / passive confirmations (refresh succeeded, filter applied, copied). Terminal errors from a user-initiated action = SweetAlert.

---

## Design tokens (teal/slate enterprise look)

| Token | Value | Use |
|---|---|---|
| Teal primary | `#2F8E86` | Primary buttons, active tabs, focus accent |
| Teal hover | `#25776F` | Primary hover state |
| Teal tint bg | `#E7F1F2` | Subtle teal background panels |
| Card border | `#E5EAEB` (dark: `slate-800`) | Panel borders |
| Text body | `#111827` (dark: `slate-100`) | Headlines, body copy |
| Text label | `#64748B` (dark: `slate-400`) | Secondary / labels |
| Input bg | `#F7F8F8` (dark: `slate-800/80`) | Form inputs |

Dark mode is driven by Tailwind's `dark:` modifier. Every surface needs an explicit `dark:bg-*` AND a dark text color — never rely on inheritance.

Status indicators are **dot indicators**, not colored pills:
```tsx
<span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25776F] dark:text-teal-400">
  <span className="w-1.5 h-1.5 rounded-full bg-[#2F8E86] shrink-0" />
  <span>Delivered</span>
</span>
```

The reference page for the enterprise look is `src/app/(dashbaord)/delivery-settlement/page.tsx`. When shaping a new feature's page, start by reading it.

---

## Mobile is first-class

- Every data table lives inside its card's own `overflow-x-auto`, not the page's.
- Pagination row MUST be `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`. Buttons `min-w-[88px] min-h-9`. Verified at iPhone 13 width (390px).
- KPI card grids: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`.
- Modal content wrap: `max-h-[90vh] overflow-y-auto` on the dialog, with the backdrop allowing scroll.

---

## File-tree conventions

```
ktFrontend/
├── src/
│   ├── app/
│   │   ├── (auth)/              ← pre-auth routes (/login, /forgot-password, /onboard)
│   │   ├── (dashbaord)/         ← ⚠ typo preserved — do not rename. Authenticated app shell.
│   │   │   ├── layout.tsx       ← mounts NavigationProvider, SessionWatcher, Sidebar
│   │   │   └── <feature>/page.tsx
│   │   ├── components/
│   │   │   ├── ui/              ← reusable primitives (buttons, inputs, modals)
│   │   │   ├── layout/          ← Sidebar, Topbar, chrome
│   │   │   └── <feature>/       ← feature-scoped composite components
│   │   ├── config/
│   │   │   └── sidebar.ts       ← nav tree + permission keys
│   │   └── layout.tsx           ← root providers (ThemeProvider, ToastProvider, SweetAlertProvider)
│   ├── context/                 ← React context providers (Navigation, Toast, Theme, TenantConfig)
│   ├── hooks/                   ← reusable hooks (useSessionHeartbeat, useFocusTrap)
│   ├── types/                   ← TypeScript types mirrored from backend contracts
│   └── utils/                   ← pure helpers (formatCurrency, formatDate, validation, print templates)
└── services/                    ← API wrappers (one file per backend controller)
```

---

## Build + verify

- `npm run build` must be green before claiming a task is done. 46+ routes compile.
- `npm run lint` runs ESLint; keep it clean.
- `npm test` runs Vitest; add tests for pure utilities (validators, formatters). Component tests are not currently mandatory but welcomed.
- For UI changes, run `npm run dev` and verify in a browser at iPhone 13 (390px) viewport AND at desktop. Mobile pagination overflow has been a repeated defect — regression-check it on any table change.

---

## When you only have this repo open

(Common with Cursor, Codex, Gemini CLI opening just `ktFrontend/`.) This file plus `src/types/`, `services/`, and the existing page files are enough. If you need the API contract for a shape you're about to consume, grep `src/types/` for the type name — it was mirrored from the backend contract on landing. If the type doesn't exist, something was shipped without a contract; ask the user before guessing.
