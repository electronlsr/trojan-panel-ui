# Local UI preview and verification

This harness serves synthetic fixture data for visual and interaction QA. It is separate from `src/`, has no dependencies, makes no outgoing requests, and is never imported into the production application. The frontend's API modules, response interceptor, and development proxy remain unchanged.

**Never enter real credentials or personal data.** All sample names begin with “preview”; addresses use reserved documentation IP ranges and `.invalid` domains. The title returned by the fixture API is “Trojan Panel Preview.” Links and node connection details are deliberately nonfunctional.

## Run

From the repository root, use Node 18 or later. Install dependencies with the repository's usual package-manager workflow first.

For a single command that keeps both servers in the same network namespace:

```sh
node scripts/ui-preview/start.cjs
```

The repository uses Vue CLI 4/Webpack 4. On Node versions that require the OpenSSL legacy provider, run `NODE_OPTIONS=--openssl-legacy-provider node scripts/ui-preview/start.cjs`. This flag is process-local, not a saved system change.

For ordinary terminals that share localhost, you can instead start the servers separately:

```sh
# Terminal 1: fixture backend; binds only to 127.0.0.1
node scripts/ui-preview/server.cjs

# Terminal 2: normal application development server
npm run serve -- --host 127.0.0.1 --port 8888
```

In execution environments with isolated shell network namespaces, use the combined launcher; a server started by a different isolated command is not reachable through the same localhost address. The browser must be able to reach the selected preview environment.

Open `http://localhost:8888/#/login`. The existing development proxy sends `/api/*` to `127.0.0.1:8081`. The fixture server supports this `/api` prefix and direct paths.

| Username | Password | Preview role |
| --- | --- | --- |
| `previewadmin` | `preview123` | System administrator (`sysadmin` and `admin`) |
| `previewops` | `preview123` | Administrator (`admin`) |
| `previewuser` | `preview123` | User (`user`) |

The combined system-administrator roles match the existing dashboard's `admin` role check. Login produces a local opaque preview session; logout invalidates it. Sessions last only for the server process. No real authentication service is involved. After restarting the fixture server, an existing browser cookie is invalid; sign in again.

`PREVIEW_API_PORT=8082 node scripts/ui-preview/server.cjs` is available for isolated tests, but the unchanged frontend proxy expects port 8081.

## Verification commands

```sh
# Contract/auth/filtering/pagination/mutation/state-control checks.
# Starts its own isolated server on a free loopback port, then closes it.
node scripts/ui-preview/smoke.cjs

# Inspect the running preview without credentials.
curl http://127.0.0.1:8081/__preview
```

The smoke suite verifies 40 assertions. It does not launch a browser, compare screenshots, prove backend compatibility beyond the inspected frontend contracts, or exercise real network infrastructure.

## Preview controls

Controls are separate server endpoints. They do not modify application code or cookies. Reload the browser after changing role; the router caches roles for the current session.

```sh
# Empty list and zero-count dashboard states.
curl -s -X POST http://127.0.0.1:8081/__preview/control \
  -H 'Content-Type: application/json' -d '{"mode":"empty"}'

# Fail the data endpoints, keeping login/settings available for recovery.
curl -s -X POST http://127.0.0.1:8081/__preview/control \
  -H 'Content-Type: application/json' -d '{"mode":"error"}'

# Normal data, but fail only the node list; 1.5-second delay shows loading state.
curl -s -X POST http://127.0.0.1:8081/__preview/control \
  -H 'Content-Type: application/json' \
  -d '{"mode":"normal","errorPaths":["/node/selectNodePage"],"delayMs":1500}'

# Force the next account-info response to user role. null restores login role.
curl -s -X POST http://127.0.0.1:8081/__preview/control \
  -H 'Content-Type: application/json' -d '{"role":"user"}'

# Enable synthetic captcha for login testing. The answer is always 1234.
curl -s -X POST http://127.0.0.1:8081/__preview/control \
  -H 'Content-Type: application/json' -d '{"captcha":true}'

# Restore all fixture data and controls. Existing preview sessions remain valid.
curl -s -X POST http://127.0.0.1:8081/__preview/reset \
  -H 'Content-Type: application/json' -d '{}'
```

`mode` accepts `normal`, `empty`, or `error`; `role` accepts `sysadmin`, `admin`, `user`, or `null`; `delayMs` accepts 0–4000. `errorPaths` is an array of exact data-endpoint paths. `captcha` is boolean. Settings, authentication and reference option lists remain readable in empty/error mode so the UI can recover. Empty mode does not erase the underlying in-memory data.

Data endpoints affected by delay and application errors:

- `/dashboard/panelGroup`, `/dashboard/trafficRank`
- `/node/selectNodePage`, `/nodeServer/selectNodeServerPage`
- `/account/selectAccountPage`, `/emailRecord/selectEmailRecordPage`
- `/fileTask/selectFileTaskPage`, `/blackList/selectBlackListPage`
- `/nodeServer/nodeServerState`

Application error fixtures return HTTP 200 with `code: 50000`, exercising the existing axios rejection branch. Unknown paths and unsupported actions return a non-success HTTP response. Read failures are never replaced with invented successful results.

## Fixture coverage and supported actions

Read fixtures cover dashboard resource percentages, byte-based quota and traffic, 6 nodes across 3 servers, 24 accounts, active/expired/disabled/unused account states, traffic ranking, email delivery states, file task statuses, system configuration, role/type selectors, blocklist, node detail, server detail, a local SVG logo, and synthetic captcha. Timestamps use a fixed 5 October 2026 snapshot for reproducible screenshots. Account pagination, text/numeric filters and account sorting are implemented.

These explicit preview mutations change only in-memory fixtures:

- Node create, edit and delete
- Server create, edit and delete
- Account create, edit and delete, plus traffic reset
- Blocklist add and remove
- File task delete
- System settings save, including synthetic captcha
- Session login/logout

The three sign-in accounts are protected from account-list editing/deletion. Existing forms still perform their client-side validation; this server is not a full backend-validation emulator. Account and node passwords submitted to the generic preview CRUD routes are discarded. System email password entry is rejected. Nothing is persisted, mailed, uploaded, deployed or connected to a real node.

Not implemented: registration, credential changes, account batch creation, file imports/exports/downloads, logo or web-file uploads, and real QR code generation. These actions explicitly fail rather than showing a false success. Subscription and node-URL responses are clearly nonfunctional placeholders, suitable only for testing copy/link presentation.

## Browser QA checklist

Use only the local app and these fixtures. Reset between destructive test flows. Record the viewport, role, locale, route, outcome, and screenshot where applicable.

1. Login: labels, password visibility, required fields, incorrect fixture password, successful login, optional captcha refresh/validation, logout, and stale-session recovery. Close or navigate away from dialogs and verify the visible route/history.
2. Dashboard: desktop and 390px mobile; all metrics remain visible; traffic list; long labels; administrator and user layouts; empty and error states. Check loading ends on both success and failure, and retry works after returning controls to `normal`.
3. Navigation: active sidebar item, collapse/expand, mobile drawer open/close/overlay, keyboard focus, hash-route refresh, browser Back/Forward, and direct visit to each allowed route. Repeat navigation while loading.
4. Nodes: filter by name and server, clear filters, no-match state, open/cancel create and edit, open/cancel detail, perform one in-memory edit and verify readback. Check action-column overflow on mobile. QR generation is intentionally unsupported.
5. Accounts: page 1 and 2, change page size, sort, filter disabled/unused, inspect expired and unlimited states, open/cancel create/edit, create a preview row and delete it. Do not edit the protected sign-in rows.
6. Servers: healthy/offline states, disabled offline detail action, server detail, open/cancel forms, one supported in-memory write and readback.
7. Email/tasks/system/blocklist: all status badges, long content/errors, tab switching, forms and confirmation dialogs, keyboard navigation, error handling for unsupported downloads/uploads. Supported system saves affect only this fixture process.
8. Permissions: test `previewuser`, `previewops`, and `previewadmin` separately. Refresh after role overrides. Check disallowed navigation and actions, rather than relying only on hidden buttons.
9. Localization: English and Chinese on dashboard/list/login; check text length and table overflow. Exercise any other supported locales relevant to the change, including right-to-left layout if enabled.
10. Final pass: clear console/runtime errors, check network calls stay on the local `/api` proxy, check no accidental horizontal page scrolling, and reset the fixture controls to normal before taking final screenshots.

Browser and production-build verification must be recorded separately from the fixture smoke tests. Passing this harness is not a production deployment or real-service integration test.

## Separate static preview artifact

For a private hosted demonstration, build the normal app first, then create a **separate** artifact:

```sh
# Use the project's normal production-build command, then:
node scripts/ui-preview/build-static.cjs
node scripts/ui-preview/static-smoke.cjs
```

The builder copies the latest `dist/` into the ignored `preview-dist/` directory. It never edits `src/`, normal application entry points, API modules, or `dist/`. It fingerprints the complete production build before/after copying and rejects a build that changes mid-copy. Rebuilding replaces only a previously marked generated preview directory, preventing stale chunks from earlier builds. Run the builder again after every final production rebuild.

**Building does not publish anything.** Publish only the separate preview artifact, only to an approved private destination, and only after explicit authorization. Never use it as the production app. `noindex,nofollow` is a search-engine hint, not access control; private hosting access must be configured and verified separately.

### Browser-only isolation

- A dedicated adapter and fixture payload are inserted before all application JavaScript. No service worker or backend is needed.
- A visible, fixed bilingual “模拟预览 · MOCK PREVIEW” banner labels the synthetic data, offers role/state controls, and provides Reset. The banner exists in static HTML even if JavaScript fails.
- The adapter replaces XHR with a synthetic transport compatible with the application's Axios browser adapter. It never constructs native XHR or sends a request. `fetch` is also intercepted; nonlocal requests fail visibly. Beacons, WebSockets and EventSource are disabled.
- An early Content Security Policy independently sets `connect-src 'none'`, preventing real API traffic even if adapter initialization fails. HTTP image loads are also blocked by `img-src data: blob:`. Favicon, logo, captcha, and packaged image assets use data URLs; both image properties and Vue's image attributes are rewritten before loading.
- App code, CSS, fonts, and lazy-loaded code chunks remain local static files on the approved host. External link navigation is disabled inside the demo. Unsupported requests/actions fail explicitly and never fall back to a backend.
- This copies the normal production JavaScript unchanged, including its normal `/api` references. The preview-only adapter intercepts those calls at runtime and the CSP blocks actual connections. Do not extract this adapter into production source.
- The legacy production bundle uses dynamic JavaScript evaluation, so the preview CSP allows `unsafe-eval`. Inline styles are allowed for Vue/Element UI. Neither relaxes the independent API-network block.

### Static preview login and controls

A fresh browser tab opens the dashboard as the synthetic system administrator. Append `?previewLogin=1` before the hash to test the normal login UI, for example `/?previewLogin=1#/login`. Fixture credentials are the same as the local preview. The app's ordinary logout also works.

The preview uses a clearly synthetic `Authorization` cookie on its own preview origin, plus namespaced session storage containing only role/state controls and an “opened” flag. Do not serve it on a production application origin. Never enter real passwords, SMTP credentials, personal data, or working node information. Synthetic account tokens are not real credentials.

The banner changes role/state and reloads the application. Reset restores normal fixtures and the system-admin dashboard. All CRUD changes are in memory and disappear on reload. Mode/role controls survive reload within the same tab. For targeted errors, delay, or captcha, the browser console can use:

```js
window.__TP_PREVIEW__.setControl({
  mode: 'normal',
  errorPaths: ['/node/selectNodePage'],
  delayMs: 1500,
  captcha: false
})
// Reload the page after changing controls if a view has already loaded.
window.location.reload()
```

`window.__TP_PREVIEW__.calls()` returns the last 100 local mock method/path pairs for QA. Request bodies, passwords and authentication headers are never recorded there.

### Static verification scope

`static-smoke.cjs` executes the actual generated adapter plus the installed Axios 0.25 browser transport in a fake DOM/XMLHttpRequest environment. It covers login, settings, captcha, dashboard, all major lists, node/server details, pagination/filtering, supported CRUD readback, unsupported actions, role/error/empty controls, logout, image rewriting, output isolation, and zero native XHR/fetch/beacon calls. It also checks early CSP and adapter ordering.

The current suite has 47 passing assertions. It does not replace real-browser visual/layout verification or hosted access-control validation. Test the final generated artifact in a browser, check console/CSP issues and network logs, and verify that no `/api` request is transmitted before calling the hosted preview verified.

## Dependency initialization

Do not skip dependency lifecycle initialization when preparing the frontend.
`vue-demi` must select the installed Vue major version. A skipped install hook can
leave its Vue 3 adapter active in this Vue 2 application; the bundler may finish
while the browser fails before mounting the app.

Before a preview build, run:

```sh
node scripts/check-vue-runtime.cjs
```

If it reports a mismatch, run the official local adapter initializer, then perform
a clean application rebuild and regenerate the static preview:

```sh
node scripts/check-vue-runtime.cjs --repair
NODE_OPTIONS=--openssl-legacy-provider npm run build
node scripts/ui-preview/build-static.cjs
```

The standard build now runs this initializer automatically through its prebuild hook. It does not add a dependency or change production API behavior.
