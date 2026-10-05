#!/usr/bin/env node
'use strict'

// Exercise the real Sidebar component and its compiled Vue template without a DOM.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const Vue = require('vue')
const compiler = require('vue-template-compiler')
const { mapGetters } = require('vuex')
const { makeFixtures } = require('./ui-preview/fixtures.cjs')
const root = path.resolve(__dirname, '..')
const { version } = require('../package.json')
const sidebarSource = fs.readFileSync(
  path.join(root, 'src/layout/components/Sidebar/index.vue'),
  'utf8'
)
const sfc = compiler.parseComponent(sidebarSource)
const compiled = compiler.compile(sfc.template.content)
assert.deepEqual(compiled.errors, [], 'Sidebar template must compile')
const render = compiler.compileToFunctions(sfc.template.content)
let count = 0
const check = (condition, description) => {
  assert.ok(condition, description)
  count++
  console.log(`PASS ${description}`)
}

function createSidebar(setting, { opened = true, showLogo = true } = {}) {
  const module = { exports: {} }
  vm.runInNewContext(
    sfc.script.content
      .replace(/^import .*\n/gm, '')
      .replace('export default', 'module.exports ='),
    {
      module,
      mapGetters,
      Logo: { render: (h) => h('div') },
      SidebarItem: { render: (h) => h('div') },
      variables: {},
      version,
      setting
    }
  )
  return new Vue({
    ...module.exports,
    ...render,
    beforeCreate() {
      this.$store = {
        getters: Vue.observable({ permission_routes: [], sidebar: { opened } }),
        state: { settings: { sidebarLogo: showLogo } }
      }
      this.$route = { meta: {}, path: '/dashboard' }
      this.$t = (key) => key
    }
  })
}

function descendants(node) {
  return node ? [node, ...(node.children || []).flatMap(descendants)] : []
}

function footer(instance) {
  return descendants(instance._render()).find(
    (node) => node.data && node.data.staticClass === 'sidebar-footer'
  )
}

function text(node) {
  return descendants(node)
    .map((entry) => entry.text || '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function versionRow(instance) {
  return descendants(footer(instance)).find(
    (node) => node.data && node.data.attrs && node.data.attrs['aria-live']
  )
}

async function main() {
  check(version === '3.0.0', 'package release version is 3.0.0')
  check(
    fs.readFileSync(path.join(root, 'public/version'), 'utf8').trim() ===
      `v${version}`,
    'public version matches package metadata'
  )
  const fixtures = makeFixtures()
  check(
    fixtures.system.version === `v${version}` &&
      fixtures.nodeServers.every(
        (server) => server.trojanPanelCoreVersion === `v${version}`
      ),
    'synthetic backend and Core fixtures match the release'
  )
  check(compiled.errors.length === 0, 'Sidebar Vue template compiles')

  let resolveSettings
  let requests = 0
  const instance = createSidebar(() => {
    requests++
    return new Promise((resolve) => {
      resolveSettings = resolve
    })
  })
  check(
    text(footer(instance)).includes(`UI v${version}`) &&
      text(versionRow(instance)) === 'API …' &&
      versionRow(instance).data.attrs['aria-busy'] === 'true',
    'footer displays its own build version while API version is loading'
  )
  instance.$options.mounted[0].call(instance)
  check(requests === 1, 'mount requests backend settings once')
  resolveSettings({ data: { version: 'v2.3.1' } })
  await new Promise(setImmediate)
  check(
    text(versionRow(instance)) === 'API v2.3.1' &&
      versionRow(instance).data.attrs['aria-busy'] === 'false',
    'footer reports the actual older backend version instead of the UI version'
  )
  instance.$store.getters.sidebar.opened = false
  check(!footer(instance), 'collapsed sidebar hides the full footer')
  instance.$store.getters.sidebar.opened = true
  check(
    text(versionRow(instance)) === 'API v2.3.1' && requests === 1,
    'expanding preserves the fetched version without another request'
  )
  instance.$destroy()

  for (const response of [
    undefined,
    null,
    {},
    { data: null },
    { data: { systemName: 'Older backend' } },
    { data: { version: '' } },
    { data: { version: '   ' } },
    { data: { version: 3 } },
    { data: { version: {} } }
  ]) {
    const legacy = createSidebar(async () => response)
    await legacy.loadBackendVersion()
    check(
      text(versionRow(legacy)) === 'API —' &&
        text(footer(legacy)).includes(`UI v${version}`) &&
        !legacy.backendVersionLoading,
      `missing or invalid API version has an honest fallback: ${JSON.stringify(
        response
      )}`
    )
    legacy.$destroy()
  }

  const failed = createSidebar(async () => {
    throw new Error('Settings endpoint unavailable')
  })
  failed.backendVersion = 'v2.3.1'
  await failed.loadBackendVersion()
  check(
    text(versionRow(failed)) === 'API —' && !failed.backendVersionLoading,
    'failed requests are handled and cannot retain a stale backend version'
  )
  failed.$destroy()

  const noLogo = createSidebar(
    async () => ({ data: { version: ' v3.0.0 ' } }),
    {
      showLogo: false
    }
  )
  await noLogo.loadBackendVersion()
  check(
    text(versionRow(noLogo)) === 'API v3.0.0',
    'backend version also loads when the sidebar logo is disabled'
  )
  noLogo.$destroy()

  const escaped = createSidebar(async () => ({
    data: { version: '<img src=x>' }
  }))
  await escaped.loadBackendVersion()
  check(
    text(versionRow(escaped)) === 'API <img src=x>' &&
      !descendants(versionRow(escaped)).some((node) => node.tag === 'img'),
    'backend-provided version is text, never rendered HTML'
  )
  escaped.$destroy()
  console.log(`PASS: ${count} version and sidebar checks.`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
