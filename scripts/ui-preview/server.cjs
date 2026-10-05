#!/usr/bin/env node
'use strict'

// No dependencies, outgoing requests, production imports, or persistent storage.
const http = require('http')
const { randomBytes } = require('crypto')
const { NOW, roles, nodeTypes, makeFixtures } = require('./fixtures.cjs')
const LOGO =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#4f7cff"/><path d="M18 19h28v8H36v21h-8V27H18z" fill="white"/></svg>'
const CAPTCHA =
  '<svg xmlns="http://www.w3.org/2000/svg" width="130" height="40"><rect width="130" height="40" rx="5" fill="#eef2ff"/><text x="18" y="29" fill="#334155" font-size="26" font-family="monospace">1234</text></svg>'
const dataPaths = new Set([
  '/dashboard/panelGroup',
  '/dashboard/trafficRank',
  '/node/selectNodePage',
  '/nodeServer/selectNodePage',
  '/account/selectAccountPage',
  '/emailRecord/selectEmailRecordPage',
  '/fileTask/selectFileTaskPage',
  '/blackList/selectBlackListPage',
  '/nodeServer/nodeServerState'
])
const normalize = (path) =>
  path.replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/'
const fail = (status, message, code = 50000) =>
  Object.assign(new Error(message), { status, code })

function createPreviewServer(options = {}) {
  let db = makeFixtures()
  let control = {
    mode: 'normal',
    role: null,
    errorPaths: [],
    delayMs: 0,
    captcha: false
  }
  const sessions = new Map()
  const accountsByLogin = {
    previewadmin: ['sysadmin', 1],
    previewops: ['admin', 2],
    previewuser: ['user', 3]
  }
  const pending = new Set()
  const send = (
    res,
    status,
    data,
    message = 'Local preview fixture',
    code = 20000
  ) => {
    res.writeHead(status, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-UI-Preview': 'synthetic-local-only'
    })
    res.end(JSON.stringify({ code, message, data, preview: true }))
  }
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
        for (const key of keys) {
          if (a[key] === b[key]) continue
          return (a[key] > b[key] ? 1 : -1) * (query.orderBy === 'asc' ? 1 : -1)
        }
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
  const byId = (rows, id) => {
    const row = rows.find((item) => item.id === Number(id))
    if (!row) throw fail(404, 'Preview fixture not found', 40400)
    return row
  }
  const requireRole = (role, allowed) => {
    if (!allowed.includes(role))
      throw fail(403, 'This preview role cannot perform that action', 40300)
  }
  const readBody = async (req) => {
    let body = ''
    for await (const chunk of req) {
      body += chunk
      if (body.length > 65536)
        throw fail(413, 'Preview accepts at most 64 KiB of JSON')
    }
    if (!body) return {}
    if (!(req.headers['content-type'] || '').includes('application/json'))
      throw fail(415, 'Preview accepts JSON only; uploads are not implemented')
    try {
      return JSON.parse(body)
    } catch {
      throw fail(400, 'Invalid JSON')
    }
  }
  const server = http.createServer(async (req, res) => {
    const path = normalize(new URL(req.url, 'http://127.0.0.1').pathname)
    const query = Object.fromEntries(
      new URL(req.url, 'http://127.0.0.1').searchParams
    )
    res.on('finish', () => {
      if (!options.quiet)
        console.log(`[preview] ${req.method} ${path} ${res.statusCode}`)
    })
    try {
      const origin = req.headers.origin
      // Requests via the Vue proxy remain same-origin. Do not expose controls cross-site.
      if (
        origin &&
        !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin)
      )
        throw fail(403, 'Local-only preview origin required', 40300)
      if (req.method === 'GET' && path === '/__preview')
        return send(res, 200, {
          ...control,
          synthetic: true,
          persistent: false,
          accounts: Object.keys(accountsByLogin),
          credentials: 'preview123',
          counts: { nodes: db.nodes.length, accounts: db.accounts.length },
          unsupported: 'uploads, exports, password changes, QR code generation'
        })
      if (
        req.method === 'POST' &&
        ['/__preview/control', '/__preview/reset'].includes(path)
      ) {
        const body = await readBody(req)
        if (path.endsWith('/reset')) {
          db = makeFixtures()
          control = {
            mode: 'normal',
            role: null,
            errorPaths: [],
            delayMs: 0,
            captcha: false
          }
        } else {
          if (
            body.mode !== undefined &&
            !['normal', 'empty', 'error'].includes(body.mode)
          )
            throw fail(400, 'mode must be normal, empty or error')
          if (
            body.role !== undefined &&
            ![null, 'sysadmin', 'admin', 'user'].includes(body.role)
          )
            throw fail(400, 'role must be null, sysadmin, admin or user')
          if (
            body.errorPaths !== undefined &&
            (!Array.isArray(body.errorPaths) ||
              body.errorPaths.some((p) => typeof p !== 'string'))
          )
            throw fail(400, 'errorPaths must be an array of paths')
          if (
            body.delayMs !== undefined &&
            (!Number.isFinite(body.delayMs) ||
              body.delayMs < 0 ||
              body.delayMs > 4000)
          )
            throw fail(400, 'delayMs must be between 0 and 4000')
          if (body.captcha !== undefined && typeof body.captcha !== 'boolean')
            throw fail(400, 'captcha must be boolean')
          for (const key of [
            'mode',
            'role',
            'errorPaths',
            'delayMs',
            'captcha'
          ])
            if (body[key] !== undefined)
              control[key] =
                key === 'errorPaths' ? body[key].map(normalize) : body[key]
        }
        return send(
          res,
          200,
          control,
          'Preview controls updated; reload the app to change role'
        )
      }
      if (req.method === 'GET' && path === '/image/logo') {
        res.writeHead(200, {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-store'
        })
        return res.end(LOGO)
      }
      if (req.method === 'GET' && path === '/auth/setting')
        return send(res, 200, {
          ...db.system,
          captchaEnable: control.captcha ? 1 : 0
        })
      if (req.method === 'GET' && path === '/auth/generateCaptcha')
        return send(res, 200, {
          captchaId: 'local-preview-captcha',
          captchaImg: `data:image/svg+xml;base64,${Buffer.from(
            CAPTCHA
          ).toString('base64')}`
        })
      if (req.method === 'POST' && path === '/auth/login') {
        const body = await readBody(req)
        const login = Object.prototype.hasOwnProperty.call(
          accountsByLogin,
          body.username
        )
          ? accountsByLogin[body.username]
          : null
        if (!login || body.pass !== 'preview123')
          throw fail(
            200,
            'Use a documented preview account and password preview123',
            40001
          )
        if (
          control.captcha &&
          (body.captchaCode !== '1234' ||
            body.captchaId !== 'local-preview-captcha')
        )
          throw fail(200, 'Preview captcha code is 1234', 40002)
        const token = `preview-${randomBytes(12).toString('hex')}`
        sessions.set(`Bearer ${token}`, {
          username: body.username,
          role: login[0],
          id: login[1]
        })
        return send(res, 200, { token })
      }
      if (req.method === 'POST' && path === '/auth/register')
        throw fail(
          501,
          'Account registration is not implemented in local preview; use a documented fixture login',
          50100
        )
      const session = sessions.get(req.headers.authorization)
      if (!session)
        throw fail(401, 'Sign in with a preview fixture account', 50401)
      const role = control.role || session.role
      const self = byId(db.accounts, session.id)
      if (req.method === 'POST' && path === '/account/logout') {
        sessions.delete(req.headers.authorization)
        return send(res, 200, null, 'Preview session ended')
      }
      if (req.method === 'GET' && path === '/account/getAccountInfo')
        return send(res, 200, {
          ...self,
          roles: role === 'sysadmin' ? ['sysadmin', 'admin'] : [role]
        })
      if (dataPaths.has(path)) {
        if (control.delayMs)
          await new Promise((resolve) => {
            const timer = setTimeout(() => {
              pending.delete(timer)
              resolve()
            }, control.delayMs)
            pending.add(timer)
          })
        if (control.mode === 'error' || control.errorPaths.includes(path))
          throw fail(200, `Preview error fixture: ${path}`, 50000)
      }
      if (req.method === 'GET') {
        switch (path) {
          case '/dashboard/panelGroup':
            return send(res, 200, {
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
            return send(
              res,
              200,
              visible(db.accounts)
                .slice(0, 6)
                .map((a) => ({
                  username: a.username,
                  trafficUsed: a.download + a.upload
                }))
            )
          case '/node/selectNodePage':
            return send(res, 200, page(db.nodes, 'nodes', query))
          case '/node/selectNodeById':
          case '/node/selectNodeInfo':
            return send(res, 200, byId(db.nodes, query.id))
          case '/node/nodeDefault':
            return send(res, 200, {
              publicKey: 'PREVIEW-NONFUNCTIONAL-PUBLIC-KEY',
              privateKey: 'PREVIEW-NONFUNCTIONAL-PRIVATE-KEY',
              shortId: '00000000',
              spiderX: '/'
            })
          case '/nodeType/selectNodeTypeList':
            return send(res, 200, nodeTypes)
          case '/nodeServer/selectNodeServerList':
            return send(res, 200, db.nodeServers)
          case '/nodeServer/selectNodeServerPage':
            requireRole(role, ['sysadmin', 'admin'])
            return send(res, 200, page(db.nodeServers, 'nodeServers', query))
          case '/nodeServer/selectNodeServerById':
            requireRole(role, ['sysadmin', 'admin'])
            return send(res, 200, byId(db.nodeServers, query.id))
          case '/nodeServer/nodeServerState':
            requireRole(role, ['sysadmin', 'admin'])
            byId(db.nodeServers, query.id)
            return send(res, 200, { cpuUsed: 24, memUsed: 56, diskUsed: 38 })
          case '/account/selectAccountPage':
            requireRole(role, ['sysadmin', 'admin'])
            return send(res, 200, page(db.accounts, 'accounts', query))
          case '/account/selectAccountById':
            requireRole(role, ['sysadmin', 'admin'])
            return send(res, 200, byId(db.accounts, query.id))
          case '/role/selectRoleList':
            requireRole(role, ['sysadmin', 'admin'])
            return send(res, 200, roles)
          case '/emailRecord/selectEmailRecordPage':
            requireRole(role, ['sysadmin', 'admin'])
            return send(res, 200, page(db.emailRecords, 'emailRecords', query))
          case '/fileTask/selectFileTaskPage':
            requireRole(role, ['sysadmin'])
            return send(res, 200, page(db.fileTasks, 'fileTasks', query))
          case '/blackList/selectBlackListPage':
            requireRole(role, ['sysadmin'])
            return send(res, 200, page(db.blackLists, 'blackLists', query))
          case '/system/selectSystemByName':
            requireRole(role, ['sysadmin'])
            return send(res, 200, {
              ...db.system,
              captchaEnable: control.captcha ? 1 : 0
            })
          case '/account/clashSubscribe':
          case '/account/clashSubscribeForSb':
            return send(
              res,
              200,
              null,
              '模拟预览不提供真实订阅，请在实际面板中生成。Preview only: create a real subscription in your own panel.',
              40000
            )
        }
      }
      if (req.method === 'POST') {
        // Explicitly supported mutations only. Changes disappear on reset/restart.
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
          requireRole(role, crud[2])
          const body = await readBody(req)
          delete body.pass
          delete body.password
          const rows = db[crud[0]]
          if (crud[0] === 'accounts' && Number(body.id) <= 3)
            throw fail(
              409,
              'The three sign-in fixtures are protected; use another row'
            )
          let row
          if (crud[1] === 'create') {
            if (!body.name && !body.username)
              throw fail(400, 'A preview name is required')
            const id = Math.max(0, ...rows.map((a) => a.id)) + 1
            row = {
              ...JSON.parse(JSON.stringify(rows[rows.length - 1] || {})),
              ...body,
              id,
              createTime: NOW
            }
            rows.push(row)
          } else {
            row = byId(rows, body.id)
            if (crud[1] === 'update') Object.assign(row, body, { id: row.id })
            else rows.splice(rows.indexOf(row), 1)
          }
          return send(
            res,
            200,
            row,
            'Preview-only change saved in memory; reset restores fixtures'
          )
        }
        if (path === '/system/updateSystemById') {
          requireRole(role, ['sysadmin'])
          const body = await readBody(req)
          if (body.emailPassword)
            throw fail(400, 'Do not enter credentials into the UI preview')
          Object.assign(db.system, body, { id: 1, emailPassword: '' })
          control.captcha = db.system.captchaEnable === 1
          return send(
            res,
            200,
            db.system,
            'Preview settings changed in memory only'
          )
        }
        if (
          path === '/blackList/createBlackList' ||
          path === '/blackList/deleteBlackListByIp'
        ) {
          requireRole(role, ['sysadmin'])
          const body = await readBody(req)
          if (!body.ip) throw fail(400, 'A preview IP is required')
          const index = db.blackLists.findIndex((row) => row.ip === body.ip)
          if (path.endsWith('createBlackList')) {
            if (index >= 0) throw fail(409, 'This preview IP already exists')
            db.blackLists.push({ ip: body.ip, createTime: NOW })
          } else {
            if (index < 0) throw fail(404, 'Preview fixture not found')
            db.blackLists.splice(index, 1)
          }
          return send(
            res,
            200,
            null,
            'Preview blocklist changed in memory only'
          )
        }
        if (path === '/account/resetAccountDownloadAndUpload') {
          requireRole(role, ['sysadmin', 'admin'])
          const body = await readBody(req)
          const account = byId(db.accounts, body.id)
          account.download = 0
          account.upload = 0
          return send(res, 200, account, 'Preview traffic reset in memory only')
        }
        if (path === '/node/nodeURL') {
          const body = await readBody(req)
          const node = byId(db.nodes, body.id)
          return send(
            res,
            200,
            `trojan://PREVIEW-NOT-A-CREDENTIAL@${node.domain}:${node.port}#LocalPreview`
          )
        }
      }
      throw fail(
        404,
        `Not implemented in local preview: ${req.method} ${path}`,
        40400
      )
    } catch (error) {
      if (!res.headersSent)
        send(res, error.status || 500, null, error.message, error.code || 50000)
    }
  })
  server.on('close', () => {
    for (const timer of pending) clearTimeout(timer)
  })
  return server
}

if (require.main === module) {
  const port = Number(process.env.PREVIEW_API_PORT || 8081)
  const server = createPreviewServer()
  server.listen(port, '127.0.0.1', () => {
    console.log(
      `LOCAL-ONLY SYNTHETIC PREVIEW: http://127.0.0.1:${port}/__preview`
    )
    console.log(
      'Login: previewadmin / preview123. No production services or real credentials.'
    )
  })
  server.on('error', (error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}

module.exports = { createPreviewServer }
