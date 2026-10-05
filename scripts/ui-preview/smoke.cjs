#!/usr/bin/env node
'use strict'

// Starts a fresh isolated fixture server on an OS-assigned loopback port.
const assert = require('node:assert/strict')
const http = require('node:http')
const { createPreviewServer } = require('./server.cjs')

async function main() {
  const server = createPreviewServer({ quiet: true })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  let count = 0
  const check = (condition, label) => {
    assert.ok(condition, label)
    count++
    console.log(`PASS ${label}`)
  }
  const request = (path, { method = 'GET', data, token, origin } = {}) =>
    new Promise((resolve, reject) => {
      const body = data === undefined ? undefined : JSON.stringify(data)
      const headers = {
        ...(body
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(body)
            }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(origin ? { Origin: origin } : {})
      }
      const req = http.request(
        { hostname: '127.0.0.1', port, path: `/api${path}`, method, headers },
        (res) => {
          let text = ''
          res.on('data', (chunk) => {
            text += chunk
          })
          res.on('end', () =>
            resolve({
              status: res.statusCode,
              body: text.startsWith('{') ? JSON.parse(text) : text,
              headers: res.headers
            })
          )
        }
      )
      req.on('error', reject)
      if (body) req.write(body)
      req.end()
    })
  const control = (data) =>
    request('/__preview/control', { method: 'POST', data })
  try {
    let response = await request('/__preview')
    check(
      response.body.data.synthetic && response.body.data.persistent === false,
      'preview explicitly reports synthetic, non-persistent data'
    )
    response = await request('/auth/setting')
    check(
      response.body.code === 20000 &&
        response.body.data.systemName.includes('Preview'),
      'axios envelope and preview label'
    )
    response = await request('/auth/generateCaptcha/')
    check(
      response.body.data.captchaImg.startsWith('data:image/svg+xml;base64,'),
      'captcha is a local image fixture'
    )
    response = await request('/image/logo')
    check(
      response.headers['content-type'] === 'image/svg+xml',
      'logo served locally'
    )
    response = await request('/account/getAccountInfo')
    check(
      response.status === 401 && response.body.code === 50401,
      'protected endpoint requires a preview session'
    )
    response = await request('/auth/login', {
      method: 'POST',
      data: { username: 'previewadmin', pass: 'wrong' }
    })
    check(response.body.code !== 20000, 'bad credentials do not succeed')
    response = await request('/auth/login', {
      method: 'POST',
      data: { username: 'previewadmin', pass: 'preview123' }
    })
    const token = response.body.data.token
    check(
      token.startsWith('preview-'),
      'fixture login returns a clearly labeled session'
    )
    response = await request('/account/getAccountInfo', { token })
    check(
      response.body.data.roles.includes('sysadmin') &&
        response.body.data.roles.includes('admin'),
      'system admin exercises admin dashboard and routes'
    )
    for (const [path, key] of [
      ['/node/selectNodePage', 'nodes'],
      ['/nodeServer/selectNodeServerPage', 'nodeServers'],
      ['/account/selectAccountPage', 'accounts'],
      ['/emailRecord/selectEmailRecordPage', 'emailRecords'],
      ['/fileTask/selectFileTaskPage', 'fileTasks'],
      ['/blackList/selectBlackListPage', 'blackLists']
    ]) {
      response = await request(path, { token })
      check(
        response.body.code === 20000 &&
          response.body.data[key].length > 0 &&
          response.body.data.total > 0,
        `list contract ${path}`
      )
    }
    response = await request('/dashboard/panelGroup', { token })
    check(
      response.body.data.cpuUsed === 24 &&
        response.body.data.nodeCount === 6 &&
        response.body.data.accountCount === 24,
      'dashboard units and counts'
    )
    response = await request('/dashboard/trafficRank', { token })
    check(
      response.body.data.every((row) => row.username && row.trafficUsed > 0),
      'traffic rank contract'
    )
    response = await request(
      '/account/selectAccountPage?pageNum=2&pageSize=5',
      { token }
    )
    check(
      response.body.data.accounts.length === 5 &&
        response.body.data.accounts[0].id === 6 &&
        response.body.data.total === 24,
      'pagination returns true totals and distinct rows'
    )
    response = await request('/node/selectNodePage?name=SG&nodeServerId=1', {
      token
    })
    check(
      response.body.data.nodes.length === 2 && response.body.data.total === 2,
      'name and server filtering'
    )
    response = await request('/account/selectAccountPage?deleted=1', { token })
    check(
      response.body.data.accounts.length === 1 &&
        response.body.data.accounts[0].deleted === 1,
      'numeric state filtering'
    )
    response = await request('/account/selectAccountPage?lastLoginTime=0', {
      token
    })
    check(
      response.body.data.accounts.length === 1 &&
        response.body.data.accounts[0].lastLoginTime === 0,
      'unused-account filter'
    )
    response = await request(
      '/account/selectAccountPage?orderFields=quota&orderBy=asc',
      { token }
    )
    check(
      response.body.data.accounts[0].quota === -1,
      'sorting maps API snake_case fields'
    )
    response = await request('/node/createNode', {
      method: 'POST',
      token,
      data: {
        name: 'Preview UI test',
        domain: 'test.example.invalid',
        nodeServerId: 1,
        nodeTypeId: 1,
        port: 443
      }
    })
    const id = response.body.data.id
    response = await request(`/node/selectNodeById?id=${id}`, { token })
    check(
      response.body.data.name === 'Preview UI test',
      'supported create changes readback in memory'
    )
    response = await request('/node/updateNodeById', {
      method: 'POST',
      token,
      data: { id, name: 'Preview changed' }
    })
    check(
      response.body.data.name === 'Preview changed',
      'supported update persists in memory'
    )
    await request('/node/deleteNodeById', {
      method: 'POST',
      token,
      data: { id }
    })
    response = await request(`/node/selectNodeById?id=${id}`, { token })
    check(response.status === 404, 'supported delete is reflected in readback')
    response = await request('/node/deleteNodeById', {
      method: 'POST',
      token,
      data: { id: 999999 }
    })
    check(response.status === 404, 'nonexistent writes fail')
    response = await request('/account/exportAccount', {
      method: 'POST',
      token,
      data: {}
    })
    check(
      response.status === 404 &&
        response.body.message.includes('Not implemented'),
      'unsupported export visibly fails'
    )
    response = await request('/does-not-exist', { token })
    check(
      response.status === 404 && response.body.code !== 20000,
      'generic missing endpoints never return success'
    )
    await control({ mode: 'empty' })
    response = await request('/node/selectNodePage', { token })
    check(
      response.body.data.nodes.length === 0 && response.body.data.total === 0,
      'empty state control'
    )
    await control({ mode: 'error' })
    response = await request('/node/selectNodePage', { token })
    check(
      response.status === 200 && response.body.code === 50000,
      'error fixture exercises axios application-error branch'
    )
    response = await request('/account/getAccountInfo', { token })
    check(
      response.body.code === 20000,
      'error mode preserves authentication for retry UI'
    )
    await control({ mode: 'normal', errorPaths: ['/node/selectNodePage'] })
    response = await request('/node/selectNodePage', { token })
    check(response.body.code === 50000, 'targeted API error control')
    response = await request('/account/selectAccountPage', { token })
    check(
      response.body.code === 20000,
      'targeted error does not affect other endpoints'
    )
    await control({ role: 'user', errorPaths: [] })
    response = await request('/account/getAccountInfo', { token })
    check(
      response.body.data.roles.join(',') === 'user',
      'role override supports user-route verification'
    )
    response = await request('/account/selectAccountPage', { token })
    check(
      response.status === 403,
      'user role cannot read administrative account list'
    )
    response = await request('/node/createNode', {
      token,
      method: 'POST',
      data: { name: 'Rejected' }
    })
    check(
      response.status === 403,
      'user role cannot make administrative changes'
    )
    await control({ role: null, captcha: true })
    response = await request('/auth/login', {
      method: 'POST',
      data: { username: 'previewuser', pass: 'preview123' }
    })
    check(
      response.body.code === 40002,
      'enabled captcha rejects absent fixture answer'
    )
    response = await request('/auth/login', {
      method: 'POST',
      data: {
        username: 'previewuser',
        pass: 'preview123',
        captchaCode: '1234',
        captchaId: 'local-preview-captcha'
      }
    })
    check(
      response.body.code === 20000,
      'enabled captcha accepts known fixture answer'
    )
    response = await request('/__preview/control', {
      method: 'POST',
      data: { mode: 'empty' },
      origin: 'https://example.invalid'
    })
    check(
      response.status === 403,
      'cross-site preview control requests rejected'
    )
    await request('/__preview/reset', { method: 'POST', data: {} })
    response = await request('/__preview')
    check(
      response.body.data.mode === 'normal' &&
        response.body.data.role === null &&
        response.body.data.captcha === false,
      'reset restores deterministic control state'
    )
    await request('/account/logout', { method: 'POST', token, data: {} })
    response = await request('/account/getAccountInfo', { token })
    check(response.status === 401, 'logout invalidates preview session')
    console.log(
      `\n${count} preview checks passed. No production services contacted.`
    )
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
