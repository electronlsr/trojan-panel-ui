#!/usr/bin/env node
'use strict'
const fs = require('fs')
const vm = require('vm')
const assert = require('assert')
const path = require('path')
const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(
  path.join(root, 'src/utils/subscription.js'),
  'utf8'
)
const { resolveSubscriptionUrl } = vm.runInNewContext(
  source.replace(/export /g, '') + '\n;({ resolveSubscriptionUrl })',
  { URL }
)
assert.strictEqual(
  resolveSubscriptionUrl(
    '/api/auth/subscribe/abc=?target=clash-verge',
    'https://panel.example'
  ),
  'https://panel.example/api/auth/subscribe/abc=?target=clash-verge'
)
assert.strictEqual(
  resolveSubscriptionUrl(
    'https://other.example/api/auth/subscribe/abc?target=clash-verge',
    'https://panel.example'
  ),
  'https://other.example/api/auth/subscribe/abc?target=clash-verge'
)
assert.strictEqual(
  resolveSubscriptionUrl('api/auth/subscribe/token', 'https://panel.example'),
  'https://panel.example/api/auth/subscribe/token'
)
assert.strictEqual(
  resolveSubscriptionUrl(
    ' /api/auth/subscribe/a%2Fb%2B%3D?target=clash-verge ',
    'https://panel.example'
  ),
  'https://panel.example/api/auth/subscribe/a%2Fb%2B%3D?target=clash-verge'
)
for (const value of [
  '',
  null,
  undefined,
  'javascript:alert(1)',
  'data:text/plain,x',
  'clash://install-config?url=x'
])
  assert.throws(() => resolveSubscriptionUrl(value, 'https://panel.example'))
const api = fs
  .readFileSync(path.join(root, 'src/api/account.js'), 'utf8')
  .replace(/^import .*\n/gm, '')
  .replace(/export /g, '')
const calls = vm.runInNewContext(
  api + '\n;({clashSubscribe,clashSubscribeForSb})',
  { request: (value) => JSON.parse(JSON.stringify(value)) }
)
assert.deepStrictEqual(calls.clashSubscribe(), {
  url: '/account/clashSubscribe',
  method: 'get',
  params: { target: 'clash-verge' }
})
assert.deepStrictEqual(
  calls.clashSubscribeForSb({
    id: 3,
    pass: 'do-not-send',
    username: 'example'
  }),
  {
    url: '/account/clashSubscribeForSb',
    method: 'get',
    params: { id: 3, target: 'clash-verge' }
  }
)
console.log(
  'PASS: 12 subscription URL, scheme, target and minimal-account-query checks.'
)
