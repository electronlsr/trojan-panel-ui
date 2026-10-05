# Clash Verge Rev / Mihomo subscription UI

This follow-up preserves the approved interface and its existing subscription-copy workflow.

- `GET /account/clashSubscribe?target=clash-verge` requests the signed-in user's profile.
- `GET /account/clashSubscribeForSb?id=<id>&target=clash-verge` requests a selected account's profile. Only the required account ID is sent; the rest of the account row is not included in the URL.
- The coordinated backend returns its normal `/api/auth/subscribe/<token>?target=clash-verge` YAML URL.
- Relative and absolute HTTP(S) URLs are resolved correctly without double-prefixing the panel origin. Existing URL encoding and query parameters are preserved. No `clash://` installation URI is introduced.
- Buttons use Clash Verge Rev / Mihomo naming in all four locales. The node list describes the default Rule-mode routing behavior and daily rule checks.
- System proxy and TUN settings are not forced by the frontend.

This UI should be released with the backend change that implements the target selector. Existing endpoints and legacy subscription URLs are retained by that backend compatibility change.

## Preview limitation

The private UI preview contains fictional servers and no real subscription. Copy actions now show an explicit preview-only notice rather than reporting success with an unusable placeholder URL. The previous mock response was an absolute `.invalid` URL; the old UI concatenated the current origin unconditionally, creating an additional malformed prefix. That confirmed preview defect does not establish why any separate real-world subscription might fail.

## Checks

Run `npm run test:subscription` for 12 URL, scheme, target-query, and minimal-account-query checks. The compiled preview's actual button handler has also been executed in the isolated DOM harness, verifying the explanatory notice and absence of a fake clipboard result. Forty fixture checks and 48 static-preview checks pass. A real user's server profile and Clash Verge import have not been tested by these UI checks.
