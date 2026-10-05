#!/usr/bin/env node
'use strict'

// Keep both servers in the same network namespace (important for isolated shells).
const { spawn } = require('node:child_process')
const path = require('node:path')
const { createPreviewServer } = require('./server.cjs')
const root = path.resolve(__dirname, '../..')
const backend = createPreviewServer()
let frontend
let closing = false

function stop(code = 0) {
  if (closing) return
  closing = true
  if (frontend) frontend.kill('SIGTERM')
  backend.close()
  // A development websocket must not keep the local preview running after Ctrl+C.
  setTimeout(() => process.exit(code), 500).unref()
}

backend.on('error', (error) => {
  console.error(`Preview backend could not start: ${error.message}`)
  stop(1)
})
backend.listen(8081, '127.0.0.1', () => {
  console.log('LOCAL-ONLY SYNTHETIC UI PREVIEW: http://localhost:8888/#/login')
  console.log('Login: previewadmin / preview123. Never enter real credentials.')
  console.log('Fixture controls: http://127.0.0.1:8081/__preview')
  frontend = spawn(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    [
      'run',
      'serve',
      '--',
      '--host',
      '127.0.0.1',
      '--port',
      '8888',
      '--no-open'
    ],
    { cwd: root, env: process.env, stdio: 'inherit' }
  )
  frontend.on('error', (error) => {
    console.error(`Frontend could not start: ${error.message}`)
    stop(1)
  })
  frontend.on('exit', (code) => stop(code || 0))
})
process.on('SIGINT', () => stop())
process.on('SIGTERM', () => stop())
