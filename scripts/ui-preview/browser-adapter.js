/* Isolated static-preview adapter. Never import this file from application source. */
;(function installStaticPreview(window) {
  'use strict'
  const fixture = window.__TP_PREVIEW_FIXTURES__
  if (!fixture) throw new Error('Static preview fixture payload is missing')
  const clone = (value) => JSON.parse(JSON.stringify(value))
  let db = clone(fixture.db)
  const storageKey = 'trojan-panel-static-preview-v1'
  const defaults = {
    mode: 'normal',
    role: null,
    errorPaths: [],
    delayMs: 120,
    captcha: false
  }
  let control = { ...defaults }
  try {
    control = {
      ...defaults,
      ...JSON.parse(window.sessionStorage.getItem(storageKey) || '{}')
    }
  } catch (_) {
    /* Session storage may be disabled. */
  }
  const accounts = {
    previewadmin: { role: 'sysadmin', id: 1, token: 'preview-static-sysadmin' },
    previewops: { role: 'admin', id: 2, token: 'preview-static-admin' },
    previewuser: { role: 'user', id: 3, token: 'preview-static-user' }
  }
  const sessions = Object.values(accounts).reduce((all, account) => {
    all[`Bearer ${account.token}`] = account
    return all
  }, {})
  const calls = []
  const normalize = (pathname) =>
    pathname.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/'
  const envelope = (
    data,
    message = 'Synthetic static preview',
    code = 20000,
    status = 200
  ) => ({ status, body: { code, message, data, preview: true } })
  const reject = (message, status = 400, code = 50000) => {
    throw { status, message, code }
  }
  const allowed = (role, list) => {
    if (!list.includes(role))
      reject('This preview role cannot perform that action', 403, 40300)
  }
  const byId = (rows, id) =>
    rows.find((row) => row.id === Number(id)) ||
    reject('Preview fixture not found', 404, 40400)
  const visible = (rows) => (control.mode === 'empty' ? [] : rows)
  const page = (rows, key, query) => {
    let list = visible(rows).filter((row) =>
      Object.entries(query).every(([field, value]) => {
        if (
          !value ||
          ['pageNum', 'pageSize', 'orderFields', 'orderBy'].includes(field)
        )
          return true
        if (field === 'lastLoginTime')
          return Number(value) === 0
            ? row.lastLoginTime === 0
            : row.lastLoginTime > 0
        if (!(field in row)) return true
        return typeof row[field] === 'number'
          ? row[field] === Number(value)
          : String(row[field]).toLowerCase().includes(value.toLowerCase())
      })
    )
    if (query.orderFields) {
      const keys = query.orderFields
        .split(',')
        .map((key) => key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()))
      list = list.slice().sort((a, b) => {
        for (const key of keys)
          if (a[key] !== b[key])
            return (
              (a[key] > b[key] ? 1 : -1) * (query.orderBy === 'asc' ? 1 : -1)
            )
        return 0
      })
    }
    const size = Math.min(100, Math.max(1, Number(query.pageSize) || 20))
    const current = Math.max(1, Number(query.pageNum) || 1)
    return {
      [key]: list.slice((current - 1) * size, current * size),
      total: list.length
    }
  }
  const dataPaths = [
    '/dashboard/panelGroup',
    '/dashboard/trafficRank',
    '/node/selectNodePage',
    '/nodeServer/selectNodeServerPage',
    '/account/selectAccountPage',
    '/emailRecord/selectEmailRecordPage',
    '/fileTask/selectFileTaskPage',
    '/blackList/selectBlackListPage',
    '/nodeServer/nodeServerState'
  ]
  function persist() {
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify(control))
    } catch (_) {
      /* Memory-only fallback. */
    }
  }
  function setControl(next) {
    if (
      next.mode !== undefined &&
      !['normal', 'empty', 'error'].includes(next.mode)
    )
      reject('Invalid preview mode')
    if (
      next.role !== undefined &&
      ![null, 'sysadmin', 'admin', 'user'].includes(next.role)
    )
      reject('Invalid preview role')
    if (
      next.errorPaths !== undefined &&
      (!Array.isArray(next.errorPaths) ||
        next.errorPaths.some((p) => typeof p !== 'string'))
    )
      reject('errorPaths must be an array of paths')
    if (
      next.delayMs !== undefined &&
      (!Number.isFinite(next.delayMs) ||
        next.delayMs < 0 ||
        next.delayMs > 4000)
    )
      reject('delayMs must be 0–4000')
    if (next.captcha !== undefined && typeof next.captcha !== 'boolean')
      reject('captcha must be boolean')
    for (const key of Object.keys(defaults))
      if (next[key] !== undefined)
        control[key] =
          key === 'errorPaths' ? next[key].map(normalize) : next[key]
    persist()
    return clone(control)
  }
  function handle(method, urlValue, headers = {}, input) {
    let path = ''
    try {
      const url = new URL(urlValue, window.location.href)
      if (
        url.origin !== window.location.origin ||
        !/^\/api(?:\/|$)/.test(url.pathname)
      )
        reject(
          'Static preview blocks non-local API requests. No network request was sent.',
          403,
          40300
        )
      path = normalize(url.pathname)
      const query = Object.fromEntries(url.searchParams)
      let body = {}
      if (input) {
        if (typeof input !== 'string')
          reject('Uploads are disabled in the static preview', 415)
        try {
          body = JSON.parse(input)
        } catch (_) {
          reject('Only JSON preview requests are supported', 415)
        }
      }
      calls.push({ method, path })
      if (calls.length > 100) calls.shift()
      if (method === 'GET' && path === '/__preview')
        return envelope({ ...control, synthetic: true, persistent: false })
      if (method === 'POST' && path === '/__preview/control')
        return envelope(setControl(body))
      if (method === 'POST' && path === '/__preview/reset') {
        db = clone(fixture.db)
        control = { ...defaults }
        persist()
        return envelope(control)
      }
      if (method === 'GET' && path === '/auth/setting')
        return envelope({
          ...db.system,
          captchaEnable: control.captcha ? 1 : 0
        })
      if (method === 'GET' && path === '/auth/generateCaptcha')
        return envelope({
          captchaId: 'local-preview-captcha',
          captchaImg: fixture.captcha
        })
      if (method === 'GET' && path === '/image/logo')
        return envelope(fixture.logo)
      if (method === 'POST' && path === '/auth/login') {
        const account = Object.prototype.hasOwnProperty.call(
          accounts,
          body.username
        )
          ? accounts[body.username]
          : null
        if (!account || body.pass !== 'preview123')
          reject('Use a preview account and password preview123', 200, 40001)
        if (
          control.captcha &&
          (body.captchaCode !== '1234' ||
            body.captchaId !== 'local-preview-captcha')
        )
          reject('Preview captcha code is 1234', 200, 40002)
        sessions[`Bearer ${account.token}`] = account
        return envelope({ token: account.token })
      }
      if (method === 'POST' && path === '/auth/register')
        reject(
          'Registration is disabled in static preview; use a documented fixture account',
          501,
          50100
        )
      const auth = headers.authorization || headers.Authorization || ''
      const session = sessions[auth]
      if (!session) reject('Sign in with a preview fixture account', 401, 50401)
      const role = control.role || session.role
      const self = byId(db.accounts, session.id)
      if (method === 'POST' && path === '/account/logout') {
        delete sessions[auth]
        return envelope(null, 'Preview session ended')
      }
      if (method === 'GET' && path === '/account/getAccountInfo')
        return envelope({
          ...self,
          roles: role === 'sysadmin' ? ['sysadmin', 'admin'] : [role]
        })
      if (
        dataPaths.includes(path) &&
        (control.mode === 'error' || control.errorPaths.includes(path))
      )
        reject(`Preview error fixture: ${path}`, 200)
      if (method === 'GET') {
        switch (path) {
          case '/dashboard/panelGroup':
            return envelope({
              cpuUsed: control.mode === 'empty' ? 0 : 24,
              memUsed: control.mode === 'empty' ? 0 : 56,
              diskUsed: control.mode === 'empty' ? 0 : 38,
              nodeCount: visible(db.nodes).length,
              accountCount: visible(db.accounts).length,
              quota: self.quota,
              totalFlow: self.quota,
              residualFlow:
                self.quota < 0 ? -1 : self.quota - self.download - self.upload,
              expireTime: self.expireTime
            })
          case '/dashboard/trafficRank':
            return envelope(
              visible(db.accounts)
                .slice(0, 6)
                .map((row) => ({
                  username: row.username,
                  trafficUsed: row.download + row.upload
                }))
            )
          case '/node/selectNodePage':
            return envelope(page(db.nodes, 'nodes', query))
          case '/node/selectNodeById':
          case '/node/selectNodeInfo':
            return envelope(byId(db.nodes, query.id))
          case '/node/nodeDefault':
            return envelope({
              publicKey: 'PREVIEW-NONFUNCTIONAL-PUBLIC-KEY',
              privateKey: 'PREVIEW-NONFUNCTIONAL-PRIVATE-KEY',
              shortId: '00000000',
              spiderX: '/'
            })
          case '/nodeType/selectNodeTypeList':
            return envelope(fixture.nodeTypes)
          case '/nodeServer/selectNodeServerList':
            return envelope(db.nodeServers)
          case '/nodeServer/selectNodeServerPage':
            allowed(role, ['sysadmin', 'admin'])
            return envelope(page(db.nodeServers, 'nodeServers', query))
          case '/nodeServer/selectNodeServerById':
            allowed(role, ['sysadmin', 'admin'])
            return envelope(byId(db.nodeServers, query.id))
          case '/nodeServer/nodeServerState':
            allowed(role, ['sysadmin', 'admin'])
            byId(db.nodeServers, query.id)
            return envelope({ cpuUsed: 24, memUsed: 56, diskUsed: 38 })
          case '/account/selectAccountPage':
            allowed(role, ['sysadmin', 'admin'])
            return envelope(page(db.accounts, 'accounts', query))
          case '/account/selectAccountById':
            allowed(role, ['sysadmin', 'admin'])
            return envelope(byId(db.accounts, query.id))
          case '/role/selectRoleList':
            allowed(role, ['sysadmin', 'admin'])
            return envelope(fixture.roles)
          case '/emailRecord/selectEmailRecordPage':
            allowed(role, ['sysadmin', 'admin'])
            return envelope(page(db.emailRecords, 'emailRecords', query))
          case '/fileTask/selectFileTaskPage':
            allowed(role, ['sysadmin'])
            return envelope(page(db.fileTasks, 'fileTasks', query))
          case '/blackList/selectBlackListPage':
            allowed(role, ['sysadmin'])
            return envelope(page(db.blackLists, 'blackLists', query))
          case '/system/selectSystemByName':
            allowed(role, ['sysadmin'])
            return envelope({
              ...db.system,
              captchaEnable: control.captcha ? 1 : 0
            })
          case '/account/clashSubscribe':
          case '/account/clashSubscribeForSb':
            return envelope(
              null,
              '模拟预览不提供真实订阅，请在实际面板中生成。Preview only: create a real subscription in your own panel.',
              40000
            )
        }
      }
      if (method === 'POST') {
        const crud = {
          '/node/createNode': ['nodes', 'create', ['sysadmin', 'admin']],
          '/node/updateNodeById': ['nodes', 'update', ['sysadmin', 'admin']],
          '/node/deleteNodeById': ['nodes', 'delete', ['sysadmin', 'admin']],
          '/nodeServer/createNodeServer': [
            'nodeServers',
            'create',
            ['sysadmin']
          ],
          '/nodeServer/updateNodeServerById': [
            'nodeServers',
            'update',
            ['sysadmin']
          ],
          '/nodeServer/deleteNodeServerById': [
            'nodeServers',
            'delete',
            ['sysadmin']
          ],
          '/account/createAccount': [
            'accounts',
            'create',
            ['sysadmin', 'admin']
          ],
          '/account/updateAccountById': [
            'accounts',
            'update',
            ['sysadmin', 'admin']
          ],
          '/account/deleteAccountById': [
            'accounts',
            'delete',
            ['sysadmin', 'admin']
          ],
          '/fileTask/deleteFileTaskById': ['fileTasks', 'delete', ['sysadmin']]
        }[path]
        if (crud) {
          allowed(role, crud[2])
          delete body.pass
          delete body.password
          if (crud[0] === 'accounts' && Number(body.id) <= 3)
            reject(
              'The three sign-in fixtures are protected; use another row',
              409
            )
          const rows = db[crud[0]]
          let row
          if (crud[1] === 'create') {
            if (!body.name && !body.username)
              reject('A preview name is required')
            row = {
              ...clone(rows[rows.length - 1] || {}),
              ...body,
              id: Math.max(0, ...rows.map((a) => a.id)) + 1,
              createTime: fixture.NOW
            }
            rows.push(row)
          } else {
            row = byId(rows, body.id)
            if (crud[1] === 'update') Object.assign(row, body, { id: row.id })
            else rows.splice(rows.indexOf(row), 1)
          }
          return envelope(
            row,
            'Preview-only change saved in memory; reload resets data'
          )
        }
        if (path === '/system/updateSystemById') {
          allowed(role, ['sysadmin'])
          if (body.emailPassword)
            reject('Never enter real credentials in this preview')
          Object.assign(db.system, body, { id: 1, emailPassword: '' })
          control.captcha = db.system.captchaEnable === 1
          persist()
          return envelope(db.system, 'Preview settings changed in memory only')
        }
        if (
          path === '/blackList/createBlackList' ||
          path === '/blackList/deleteBlackListByIp'
        ) {
          allowed(role, ['sysadmin'])
          if (!body.ip) reject('A preview IP is required')
          const index = db.blackLists.findIndex((row) => row.ip === body.ip)
          if (path.endsWith('createBlackList')) {
            if (index >= 0) reject('This preview IP already exists', 409)
            db.blackLists.push({ ip: body.ip, createTime: fixture.NOW })
          } else {
            if (index < 0) reject('Preview fixture not found', 404)
            db.blackLists.splice(index, 1)
          }
          return envelope(null, 'Preview blocklist changed in memory only')
        }
        if (path === '/account/resetAccountDownloadAndUpload') {
          allowed(role, ['sysadmin', 'admin'])
          const account = byId(db.accounts, body.id)
          account.upload = 0
          account.download = 0
          return envelope(account, 'Preview traffic reset in memory only')
        }
        if (path === '/node/nodeURL') {
          const node = byId(db.nodes, body.id)
          return envelope(
            `trojan://PREVIEW-NOT-A-CREDENTIAL@${node.domain}:${node.port}#LocalPreview`
          )
        }
      }
      reject(
        `Not implemented in static preview: ${method} ${path}. No request was sent.`,
        404,
        40400
      )
    } catch (error) {
      return envelope(
        null,
        error.message || 'Static preview request failed',
        error.code || 50000,
        error.status || 500
      )
    }
  }

  // Never construct or delegate to a native XMLHttpRequest, even for unknown URLs.
  class PreviewXHR {
    constructor() {
      this.readyState = 0
      this.status = 0
      this.statusText = ''
      this.response = null
      this.responseText = ''
      this.responseType = ''
      this.responseURL = ''
      this.timeout = 0
      this.withCredentials = false
      this.onreadystatechange = null
      this.onloadend = null
      this.onload = null
      this.onerror = null
      this.onabort = null
      this.ontimeout = null
      this.headers = {}
      this.listeners = {}
      this.upload = { addEventListener() {}, removeEventListener() {} }
    }
    open(method, url, async = true) {
      if (async === false)
        throw new Error('Synchronous requests are disabled in static preview')
      this.method = method.toUpperCase()
      this.url = String(url)
      this.readyState = 1
      this.emit('readystatechange')
    }
    setRequestHeader(name, value) {
      this.headers[name.toLowerCase()] = String(value)
    }
    getAllResponseHeaders() {
      return 'content-type: application/json\r\nx-ui-preview: synthetic-client-only\r\n'
    }
    getResponseHeader(name) {
      return name.toLowerCase() === 'content-type' ? 'application/json' : null
    }
    addEventListener(type, callback) {
      ;(this.listeners[type] || (this.listeners[type] = [])).push(callback)
    }
    removeEventListener(type, callback) {
      this.listeners[type] = (this.listeners[type] || []).filter(
        (fn) => fn !== callback
      )
    }
    emit(type) {
      const event = {
        type,
        target: this,
        currentTarget: this,
        loaded: this.responseText.length,
        total: this.responseText.length,
        lengthComputable: true
      }
      if (typeof this[`on${type}`] === 'function') this[`on${type}`](event)
      for (const callback of this.listeners[type] || [])
        callback.call(this, event)
    }
    send(input) {
      this.aborted = false
      const delay = Math.max(0, Number(control.delayMs) || 0)
      this.timer = window.setTimeout(
        () => {
          if (this.aborted) return
          if (this.timeout > 0 && this.timeout < delay) {
            this.emit('timeout')
            this.emit('loadend')
            return
          }
          const result = handle(this.method, this.url, this.headers, input)
          this.status = result.status
          this.statusText =
            result.status < 400 ? 'OK' : 'Preview request denied'
          this.responseURL = new URL(this.url, window.location.href).href
          this.responseText = JSON.stringify(result.body)
          this.response =
            this.responseType === 'json'
              ? result.body
              : this.responseType === 'blob'
              ? new window.Blob([this.responseText], {
                  type: 'application/json'
                })
              : this.responseText
          this.readyState = 4
          this.emit('readystatechange')
          this.emit('progress')
          this.emit('load')
          this.emit('loadend')
        },
        this.timeout > 0 ? Math.min(delay, this.timeout) : delay
      )
    }
    abort() {
      this.aborted = true
      window.clearTimeout(this.timer)
      this.readyState = 0
      this.status = 0
      this.emit('abort')
      this.emit('loadend')
    }
    overrideMimeType() {}
  }
  for (const [key, value] of Object.entries({
    UNSENT: 0,
    OPENED: 1,
    HEADERS_RECEIVED: 2,
    LOADING: 3,
    DONE: 4
  })) {
    PreviewXHR[key] = value
    PreviewXHR.prototype[key] = value
  }
  window.XMLHttpRequest = PreviewXHR
  window.fetch = function previewFetch(input, init = {}) {
    const url =
      typeof input === 'string' || input instanceof URL
        ? String(input)
        : input.url
    const headers = Object.fromEntries(
      new window.Headers(init.headers || (input && input.headers) || {})
    )
    const result = handle(
      (init.method || (input && input.method) || 'GET').toUpperCase(),
      url,
      headers,
      init.body
    )
    return Promise.resolve(
      new window.Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' }
      })
    )
  }
  window.WebSocket = function () {
    throw new Error('Network connections are disabled in static preview')
  }
  window.EventSource = function () {
    throw new Error('Network connections are disabled in static preview')
  }
  if (window.navigator && window.navigator.sendBeacon)
    window.navigator.sendBeacon = () => false

  // Vue creates the logo via both DOM attributes and image properties. Rewrite before assignment.
  const localImage = (value) => {
    try {
      const url = new URL(String(value), window.location.href)
      if (/^\/api(?:\/|$)/.test(url.pathname)) return fixture.logo
      if (
        url.origin === window.location.origin &&
        fixture.images &&
        fixture.images[url.pathname]
      )
        return fixture.images[url.pathname]
    } catch (_) {
      /* Preserve ordinary local image values. */
    }
    return value
  }
  if (window.HTMLImageElement && window.Element) {
    const descriptor = Object.getOwnPropertyDescriptor(
      window.HTMLImageElement.prototype,
      'src'
    )
    if (descriptor && descriptor.set)
      Object.defineProperty(window.HTMLImageElement.prototype, 'src', {
        ...descriptor,
        set(value) {
          descriptor.set.call(this, localImage(value))
        }
      })
    const original = window.Element.prototype.setAttribute
    window.Element.prototype.setAttribute = function (name, value) {
      return original.call(
        this,
        name,
        this.tagName === 'IMG' && name.toLowerCase() === 'src'
          ? localImage(value)
          : value
      )
    }
  }

  const document = window.document
  function setToken(token) {
    document.cookie = `Authorization=${encodeURIComponent(
      `Bearer ${token}`
    )}; path=/; SameSite=Strict`
  }
  // Fresh visits go straight to the fixture dashboard. ?previewLogin=1 opens the real login UI.
  let opened = false
  try {
    opened = window.sessionStorage.getItem(`${storageKey}-opened`) === '1'
    window.sessionStorage.setItem(`${storageKey}-opened`, '1')
  } catch (_) {
    /* Browser still works without storage. */
  }
  if (new URL(window.location.href).searchParams.has('previewLogin'))
    document.cookie = 'Authorization=; path=/; max-age=0; SameSite=Strict'
  else if (!opened) setToken(accounts.previewadmin.token)

  window.__TP_PREVIEW__ = {
    control: () => clone(control),
    calls: () => clone(calls),
    setControl,
    reset: () => {
      db = clone(fixture.db)
      control = { ...defaults }
      persist()
      return clone(control)
    },
    request: handle,
    login: (role) => {
      const account = Object.values(accounts).find((a) => a.role === role)
      if (!account) reject('Invalid role')
      sessions[`Bearer ${account.token}`] = account
      setToken(account.token)
    }
  }
  if (document && document.addEventListener) {
    document.addEventListener('DOMContentLoaded', () => {
      const role = document.getElementById('tp-preview-role')
      const mode = document.getElementById('tp-preview-mode')
      const reset = document.getElementById('tp-preview-reset')
      if (role) {
        role.value = control.role || 'sysadmin'
        role.addEventListener('change', () => {
          setControl({ role: role.value })
          window.__TP_PREVIEW__.login(role.value)
          window.location.hash = '#/dashboard/index'
          window.location.reload()
        })
      }
      if (mode) {
        mode.value = control.mode
        mode.addEventListener('change', () => {
          setControl({ mode: mode.value })
          window.location.reload()
        })
      }
      if (reset)
        reset.addEventListener('click', () => {
          window.__TP_PREVIEW__.reset()
          window.__TP_PREVIEW__.login('sysadmin')
          window.location.hash = '#/dashboard/index'
          window.location.reload()
        })
    })
    document.addEventListener(
      'click',
      (event) => {
        const anchor =
          event.target &&
          event.target.closest &&
          event.target.closest('a[href]')
        if (!anchor) return
        const url = new URL(anchor.href, window.location.href)
        if (url.origin !== window.location.origin && url.protocol !== 'blob:') {
          event.preventDefault()
          const status = document.getElementById('tp-preview-status')
          if (status)
            status.textContent =
              'Preview only: external navigation is disabled.'
        }
      },
      true
    )
  }
})(window)
