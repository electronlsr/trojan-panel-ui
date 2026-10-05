# UI validation

## Passed

- Production Vue build with the original application entry and production obfuscation, using Vue and vue-template-compiler 2.6.14 as pinned in the existing lockfile.
- Vue template and JavaScript parsing for every changed/new component.
- SCSS compilation, four-locale key parity, and static translation reference checks.
- Focused source lint with the standard parser: zero additional findings compared with the upstream baseline.
- Six list pages: success, failure, empty response, retry, and out-of-order request handling.
- Dashboard: missing values, zero/unlimited/exhausted quota, numeric timestamps, malformed dates, traffic ranking, retry, and refresh concurrency.
- Login/registration method checks: validation wiring, redirects, repeated-submit guards, failed-login captcha refresh.
- 40 fixture API smoke checks: authentication, roles, filter/pagination behavior, supported in-memory CRUD, error/empty modes, and explicit rejection of unsupported actions.
- 47 isolated static-preview adapter/Axios checks, including zero native API network requests and an unchanged production-build fingerprint.
- Independent review of navigation, role guards, API preservation, and CSS interactions. The review caught and fixed tab-strip clipping and inherited `aside` styling.
- `git diff --check`.

## Toolchain limits

The upstream `npm run lint` command does not run with its declared ESLint 8 dependency because Vue CLI 4 calls the removed `CLIEngine` constructor. The initial npm-resolved dependency tree also exposed an existing Babel ESLint parser compatibility error under Node 24. Focused checks use an Espree override and compare findings with the unchanged upstream source; this is not a claim that repository-wide lint passes.

No framework or dependency-version/lockfile upgrade was made as part of this visual redesign. A source-controlled prebuild hook now initializes and verifies the Vue compatibility adapter. The full frozen-lock installation was attempted but could not complete because registry downloads stalled. The passing build used the existing manifest-resolved dependencies with Vue/compiler explicitly aligned to 2.6.14; it is not a claim of a fully frozen-lock build.

## Not yet verified

- Desktop/mobile rendering and interaction in a browser. The cloud browser cannot access the isolated shell's localhost. A same-process local Chromium attempt also cannot start because the execution sandbox disallows its required Unix sockets; an escalation attempt did not remove that restriction.
- Real backend integration, production data, real captcha behavior, operational email, file imports/exports, and deployment.

The separately authorized owner-private mock-data preview has been published. Cloud browser access currently requires the owner to sign in with ChatGPT; until that review completes, screenshots and visual acceptance must not be claimed.

## Blank preview startup regression (fixed)

The first hosted preview was blank because its build environment had skipped
dependency install scripts, leaving vue-demi's default Vue 3 adapter active beside
Vue 2.6.14. Its imported `defineComponent` was undefined, and the actual minified
application failed before creating the router. Compilation alone did not detect
this. The mock adapter and asset loading were not the cause.

The official vue-demi initializer was run, build caches were cleared, and the
application was rebuilt. The normal build now has a `prebuild` hook that repairs
and verifies the adapter through `scripts/check-vue-runtime.cjs`. The static-preview
builder checks it as well. A regression test deliberately selected the wrong
adapter, verified rejection, and confirmed the prebuild hook restored Vue 2 mode.

An isolated DOM harness then executed the actual production bundles: the old
artifact reproduced the import-time TypeError, and the corrected artifact mounted
the full dashboard with no runtime errors. Eight-route checks covered dashboard,
node list (6 rows), accounts (20/page), servers (3), email (3), tasks (4), basic
configuration including the JSON editor, and navigation back to the dashboard.
The harness blocked outgoing requests and used test-only Range geometry shims
that jsdom lacks. This confirms application startup and DOM behavior; it does not
replace real-browser screenshots, responsive geometry, or CSP enforcement checks.

The corrected artifact was published to the same owner-private preview Site.
Browser visual acceptance remains pending the owner's sign-in in the cloud browser.

## Subscription UI follow-up

The approved redesign is preserved. Twelve URL/query tests cover relative and absolute HTTP(S) subscriptions, encoded tokens/query preservation, unsupported scheme rejection, and only the required account ID being sent. The actual compiled subscription button was exercised in the isolated DOM runtime and now shows a clear preview-only notice rather than copying a fake URL. The latest build and 48 static-preview checks pass. This does not verify any real server subscription or actual Clash Verge import. See SUBSCRIPTION_UI.md.
