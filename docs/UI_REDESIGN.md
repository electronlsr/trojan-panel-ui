# Panel UI redesign

This change modernizes the existing Vue 2 / Element UI frontend. It is compatible with the existing panel API and does not change backend services, database schemas, routes, installation paths, or permission rules.

## Changed interface

- Blue/slate visual system: consistent spacing, cards, typography, inputs, status colors, dialogs, and responsive layouts.
- Navigation: clearer sidebar, user identity, breadcrumbs without duplicates, keyboard-accessible menu toggle, and quieter page tabs.
- Dashboard: real account/node totals, quota and expiry, current resource usage, traffic ranking, and permission-aware links. No generated chart values or mock data are part of the application.
- Node, server, account, email, task, and IP-blocklist pages: readable table surfaces, responsive filters, empty states, retryable errors, and latest-request-wins loading. The old artificial 1.5-second table delay is removed.
- Node actions: details and edit remain direct actions; QR code, URL copy, and guarded deletion are available from the more-actions menu. All existing handlers remain connected.
- Login and registration: responsive layout with configured branding, labeled fields, password visibility controls, captcha refresh, validation, and duplicate-submit guards.
- Server detail: CPU, memory, and disk remain visible on phones, with explicit refresh and failure feedback.
- Not-found page and mobile viewport zoom support.
- New interface copy supports Chinese, English, Korean, and Persian.

## Existing build workflow

Use the repository's `yarn.lock` and existing dependencies:

```sh
yarn install --frozen-lockfile
yarn build
```

With newer Node/OpenSSL releases, this older Webpack 4 toolchain may need:

```sh
NODE_OPTIONS=--openssl-legacy-provider yarn build
```

The production artifact is `dist/`, as before. No preview adapter or sample data is imported from `src/`.

## Preview versus production

See [UI_PREVIEW.md](UI_PREVIEW.md) for isolated synthetic fixtures and local preview controls. The preview uses invented accounts, example addresses, and in-memory data. It does not connect to existing servers. Its development tools are not production backend replacements.

A hosted mock preview, if separately approved, must use only the explicitly generated `preview-dist/` artifact. Never deploy that artifact as a real panel. Normal production builds continue to use the existing API.

## Validation status

See [UI_VALIDATION.md](UI_VALIDATION.md) for the exact completed checks and any unverified behavior. Static compilation and simulated API checks do not replace desktop/mobile browser testing or a staging check against a real backend.

No production deployment is included in this change.

## Subscription follow-up

The subsequent Clash Verge Rev / Mihomo integration adds an explicit target query to the existing subscription endpoints and robust URL resolution. See [SUBSCRIPTION_UI.md](SUBSCRIPTION_UI.md) for the coordinated backend contract and preview limitations.
