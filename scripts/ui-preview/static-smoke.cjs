#!/usr/bin/env node
'use strict'

// Executes the actual generated browser adapter and Axios browser transport in a fake DOM.
// No browser or network requests are required.
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const root = path.resolve(__dirname, '../..')
const output = path.join(root, 'preview-dist')

async function main() {
  let count = 0
  let networkCalls = 0
  const check = (value, description) => {
    assert.ok(value, description)
    count++
    console.log(`PASS ${description}`)
  }
  const storage = new Map()
  const cookies = new Map()
  const eventListeners = {}
  const origin = 'https://static-preview.example.invalid'
  class Element {
    constructor(tag = 'IMG') {
      this.tagName = tag
      this.attributes = {}
    }
    setAttribute(name, value) {
      this.attributes[name] = value
    }
  }
  class Image extends Element {
    get src() {
      return this._src || ''
    }
    set src(value) {
      this._src = value
    }
  }
  const document = {
    addEventListener: (name, callback) => {
      eventListeners[name] = callback
    },
    getElementById: () => null,
    createElement(tag) {
      if (tag === 'a') {
        let url = new URL(origin)
        const anchor = {
          setAttribute: (_, value) => {
            url = new URL(value, origin)
          }
        }
        for (const key of [
          'href',
          'protocol',
          'host',
          'search',
          'hash',
          'hostname',
          'port',
          'pathname'
        ])
          Object.defineProperty(anchor, key, { get: () => url[key] })
        return anchor
      }
      return new Element(tag.toUpperCase())
    }
  }
  Object.defineProperty(document, 'cookie', {
    get: () => [...cookies].map(([key, value]) => `${key}=${value}`).join('; '),
    set: (value) => {
      const [pair] = value.split(';')
      const index = pair.indexOf('=')
      const key = pair.slice(0, index)
      if (value.includes('max-age=0')) cookies.delete(key)
      else cookies.set(key, pair.slice(index + 1))
    }
  })
  const window = {
    location: {
      origin,
      href: `${origin}/#/dashboard/index`,
      hash: '#/dashboard/index',
      reload() {}
    },
    document,
    navigator: {
      userAgent: 'Static preview test',
      product: 'Gecko',
      sendBeacon: () => {
        networkCalls++
        return true
      }
    },
    sessionStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key, value) => storage.set(key, value)
    },
    XMLHttpRequest: function () {
      networkCalls++
      throw new Error('Native XHR must never be instantiated')
    },
    fetch: () => {
      networkCalls++
      throw new Error('Native fetch must never be called')
    },
    URL,
    Headers,
    Response,
    Blob,
    Element,
    HTMLImageElement: Image,
    setTimeout,
    clearTimeout,
    console,
    btoa: (value) => Buffer.from(value).toString('base64')
  }
  window.window = window
  const context = vm.createContext(window)
  vm.runInContext(
    fs.readFileSync(path.join(output, 'ui-preview/adapter.js'), 'utf8'),
    context
  )
  vm.runInContext(
    fs.readFileSync(
      path.join(root, 'node_modules/axios/dist/axios.min.js'),
      'utf8'
    ),
    context
  )
  const api = window.axios.create({ baseURL: '/api', timeout: 5000 })
  const preview = window.__TP_PREVIEW__
  preview.setControl({ delayMs: 0 })
  const get = async (url, token = 'preview-static-sysadmin') =>
    (
      await api.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
    ).data
  const post = async (url, data, token = 'preview-static-sysadmin') =>
    (
      await api.post(url, data, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      })
    ).data
  const rejectsStatus = async (fn, status) => {
    try {
      await fn()
      return false
    } catch (error) {
      return error.response && error.response.status === status
    }
  }
  check(
    decodeURIComponent(document.cookie).includes(
      'Bearer preview-static-sysadmin'
    ),
    'new preview seeds a synthetic dashboard session'
  )
  check(
    (await get('/auth/setting', null)).data.systemName.includes('Preview'),
    'settings contract through actual Axios browser transport'
  )
  check(
    (await get('/auth/generateCaptcha', null)).data.captchaImg.startsWith(
      'data:image/svg+xml;base64,'
    ),
    'captcha image is self-contained'
  )
  check(
    (
      await post(
        '/auth/login',
        { username: 'previewadmin', pass: 'wrong' },
        null
      )
    ).code === 40001,
    'incorrect login is an application error'
  )
  const login = await post(
    '/auth/login',
    { username: 'previewadmin', pass: 'preview123' },
    null
  )
  check(
    login.code === 20000 && login.data.token === 'preview-static-sysadmin',
    'login works through original Axios XHR adapter'
  )
  check(
    (await get('/account/getAccountInfo')).data.roles.includes('admin'),
    'admin route/dashboard role contract'
  )
  check(
    (await get('/dashboard/panelGroup')).data.nodeCount === 6,
    'dashboard metrics load'
  )
  check(
    (await get('/dashboard/trafficRank')).data.length === 6,
    'traffic ranking loads'
  )
  for (const [route, field] of [
    ['/node/selectNodePage', 'nodes'],
    ['/nodeServer/selectNodeServerPage', 'nodeServers'],
    ['/account/selectAccountPage', 'accounts'],
    ['/emailRecord/selectEmailRecordPage', 'emailRecords'],
    ['/fileTask/selectFileTaskPage', 'fileTasks'],
    ['/blackList/selectBlackListPage', 'blackLists']
  ])
    check((await get(route)).data[field].length > 0, `${field} page contract`)
  check(
    (await get('/node/selectNodeInfo?id=1')).data.domain.endsWith('.invalid'),
    'node details contain synthetic connection data'
  )
  check(
    (await get('/nodeServer/nodeServerState?id=1')).data.memUsed === 56,
    'server resource detail contract'
  )
  check(
    JSON.parse((await get('/system/selectSystemByName')).data.xrayTemplate).log
      .loglevel === 'warning',
    'system settings and JSON template contract'
  )
  check(
    (await get('/account/selectAccountPage?pageNum=2&pageSize=5')).data
      .accounts[0].id === 6,
    'real pagination behavior'
  )
  check(
    (await get('/node/selectNodePage?name=SG')).data.total === 2,
    'node search filtering'
  )
  check(
    (await get('/account/selectAccountPage?deleted=1')).data.total === 1,
    'account status filtering'
  )
  const created = await post('/node/createNode', {
    name: 'Preview static test',
    domain: 'test.example.invalid',
    nodeServerId: 1,
    nodeTypeId: 1
  })
  check(
    (await get(`/node/selectNodeById?id=${created.data.id}`)).data.name ===
      'Preview static test',
    'supported in-memory create has real readback'
  )
  await post('/node/updateNodeById', {
    id: created.data.id,
    name: 'Preview edited'
  })
  check(
    (await get(`/node/selectNodeById?id=${created.data.id}`)).data.name ===
      'Preview edited',
    'supported in-memory edit has real readback'
  )
  await post('/node/deleteNodeById', { id: created.data.id })
  check(
    await rejectsStatus(
      () => get(`/node/selectNodeById?id=${created.data.id}`),
      404
    ),
    'supported deletion has real readback'
  )
  check(
    await rejectsStatus(() => post('/account/exportAccount', {}), 404),
    'unsupported export visibly fails'
  )
  check(
    await rejectsStatus(() => post('/auth/register', {}, null), 501),
    'unsupported registration visibly fails'
  )
  check(
    await rejectsStatus(() => get('/does-not-exist'), 404),
    'unknown API never succeeds'
  )
  check(
    await rejectsStatus(
      () =>
        api.get(
          'https://real-backend.example.invalid/api/dashboard/panelGroup'
        ),
      403
    ),
    'external XHR is blocked before native transport'
  )
  const fetchResponse = await window.fetch(
    'https://real-backend.example.invalid/api/node/selectNodePage'
  )
  check(
    fetchResponse.status === 403,
    'external fetch is blocked before native transport'
  )
  check(
    window.navigator.sendBeacon(
      'https://real-backend.example.invalid',
      'data'
    ) === false,
    'beacon transmission blocked'
  )
  const img = new Image()
  img.src = '/api/image/logo'
  check(
    img.src.startsWith('data:image/svg+xml;base64,'),
    'image property logo URL rewritten before loading'
  )
  img.setAttribute('src', '/api/image/logo')
  check(
    img.attributes.src.startsWith('data:image/svg+xml;base64,'),
    'Vue image attribute logo URL rewritten before loading'
  )
  const packagedImage = Object.keys(window.__TP_PREVIEW_FIXTURES__.images)[0]
  img.src = packagedImage
  check(
    img.src.startsWith('data:image/'),
    'packaged static images are inlined without image network access'
  )
  preview.setControl({ mode: 'empty' })
  check(
    (await get('/node/selectNodePage')).data.total === 0,
    'empty state works'
  )
  preview.setControl({ mode: 'error' })
  check(
    (await get('/node/selectNodePage')).code === 50000,
    'application-error state works'
  )
  check(
    (await get('/account/getAccountInfo')).code === 20000,
    'error state preserves account info for recovery'
  )
  preview.setControl({ mode: 'normal', role: 'user' })
  check(
    (await get('/account/getAccountInfo')).data.roles.join(',') === 'user',
    'user role override works'
  )
  check(
    await rejectsStatus(() => get('/account/selectAccountPage'), 403),
    'user role cannot read admin page'
  )
  preview.setControl({ role: null, captcha: true })
  check(
    (
      await post(
        '/auth/login',
        { username: 'previewuser', pass: 'preview123' },
        null
      )
    ).code === 40002,
    'optional captcha enforces fixture answer'
  )
  check(
    (
      await post(
        '/auth/login',
        {
          username: 'previewuser',
          pass: 'preview123',
          captchaCode: '1234',
          captchaId: 'local-preview-captcha'
        },
        null
      )
    ).code === 20000,
    'optional captcha permits known answer'
  )
  preview.reset()
  check(
    preview.control().mode === 'normal' &&
      (await get('/node/selectNodePage')).data.total === 6,
    'reset restores fixture/control state'
  )
  const subscription = await get('/account/clashSubscribe?target=clash-verge')
  check(
    subscription.code === 40000 &&
      subscription.data === null &&
      subscription.message.includes('Preview only'),
    'demo subscription is explicitly unavailable instead of copying a fake URL'
  )
  await post('/account/logout', {})
  check(
    await rejectsStatus(() => get('/account/getAccountInfo'), 401),
    'logout invalidates synthetic session'
  )
  check(
    networkCalls === 0,
    'zero native XHR, fetch or beacon calls across suite'
  )
  const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8')
  check(
    html.indexOf('/ui-preview/adapter.js') <
      html.indexOf('<script src="/static/'),
    'adapter is loaded before all production scripts'
  )
  check(
    html.includes("connect-src 'none'") &&
      html.indexOf('Content-Security-Policy') <
        html.indexOf('/ui-preview/adapter.js'),
    'fail-closed CSP precedes adapter initialization'
  )
  check(
    !html.includes('/api/image/logo') && html.includes('MOCK PREVIEW'),
    'static HTML has synthetic banner and local favicon'
  )
  check(
    !fs
      .readFileSync(path.join(root, 'dist/index.html'), 'utf8')
      .includes('ui-preview'),
    'production index remains unchanged'
  )
  check(
    html.includes('img-src data: blob:'),
    'image CSP blocks all HTTP image requests even if adapter fails'
  )
  console.log(
    `\n${count} static-preview checks passed. Native network calls: ${networkCalls}.`
  )
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
