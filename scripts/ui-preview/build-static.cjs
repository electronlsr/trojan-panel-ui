#!/usr/bin/env node
'use strict'

// Builds a separate static artifact. Never edits dist, src, API modules or app entry points.
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const { checkRuntime } = require('../check-vue-runtime.cjs')
const { NOW, roles, nodeTypes, makeFixtures } = require('./fixtures.cjs')
const root = path.resolve(__dirname, '../..')
const source = path.join(root, 'dist')
const destination = path.join(root, 'preview-dist')
const indexPath = path.join(source, 'index.html')
const logo =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#4f7cff"/><path d="M18 19h28v8H36v21h-8V27H18z" fill="white"/></svg>'
const captcha =
  '<svg xmlns="http://www.w3.org/2000/svg" width="130" height="40"><rect width="130" height="40" fill="#eef2ff"/><text x="18" y="29" font-size="26" font-family="monospace">1234</text></svg>'
const dataImage = (svg) =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
function filesUnder(dir, relative = '') {
  return fs
    .readdirSync(path.join(dir, relative), { withFileTypes: true })
    .flatMap((entry) => {
      const name = path.join(relative, entry.name)
      return entry.isDirectory() ? filesUnder(dir, name) : [name]
    })
    .sort()
}
function digestTree(dir) {
  const hash = crypto.createHash('sha256')
  for (const name of filesUnder(dir))
    hash.update(name).update(fs.readFileSync(path.join(dir, name)))
  return hash.digest('hex')
}
function main() {
  checkRuntime()
  if (!fs.existsSync(indexPath))
    throw new Error(
      'Build the production application first: npm run build. This script does not build or modify it.'
    )
  const index = fs.readFileSync(indexPath, 'utf8')
  if (!index.includes('<head>') || !index.includes('<body>'))
    throw new Error('Expected head and body elements in dist/index.html')
  const sourceHash = crypto.createHash('sha256').update(index).digest('hex')
  const sourceTreeHash = digestTree(source)
  if (fs.existsSync(destination)) {
    const marker = path.join(destination, 'ui-preview/manifest.json')
    if (
      !fs.existsSync(marker) ||
      JSON.parse(fs.readFileSync(marker, 'utf8')).kind !==
        'synthetic-static-preview'
    )
      throw new Error(
        'Refusing to replace an unrecognized preview-dist directory'
      )
    fs.rmSync(destination, { recursive: true })
  }
  fs.mkdirSync(destination, { recursive: true })
  fs.cpSync(source, destination, { recursive: true })
  const previewDir = path.join(destination, 'ui-preview')
  fs.mkdirSync(previewDir, { recursive: true })
  const imageTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.avif': 'image/avif'
  }
  const images = {}
  for (const name of filesUnder(source)) {
    const type = imageTypes[path.extname(name).toLowerCase()]
    if (type)
      images[`/${name.split(path.sep).join('/')}`] = `data:${type};base64,${fs
        .readFileSync(path.join(source, name))
        .toString('base64')}`
  }
  const payload = {
    db: makeFixtures(),
    NOW,
    roles,
    nodeTypes,
    images,
    logo: dataImage(logo),
    captcha: dataImage(captcha)
  }
  const adapter = `window.__TP_PREVIEW_FIXTURES__=${JSON.stringify(
    payload
  )};\n${fs.readFileSync(path.join(__dirname, 'browser-adapter.js'), 'utf8')}\n`
  fs.writeFileSync(path.join(previewDir, 'adapter.js'), adapter)
  fs.writeFileSync(path.join(previewDir, 'logo.svg'), logo)
  const policy =
    "default-src 'self'; connect-src 'none'; img-src data: blob:; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; media-src 'none'; object-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'self'"
  const banner =
    '<aside id="tp-preview-banner" aria-label="Synthetic UI preview"><strong>模拟预览 · MOCK PREVIEW</strong><span id="tp-preview-status">仅含模拟数据，不连接真实服务器 / Synthetic data only. Never enter real credentials.</span><label>角色 Role <select id="tp-preview-role"><option value="sysadmin">System admin</option><option value="admin">Admin</option><option value="user">User</option></select></label><label>状态 State <select id="tp-preview-mode"><option value="normal">Normal</option><option value="empty">Empty</option><option value="error">Error</option></select></label><button type="button" id="tp-preview-reset">重置 Reset</button></aside>'
  const css =
    'body{padding-bottom:64px!important}#tp-preview-banner{margin:0;border-radius:0;box-sizing:border-box;position:fixed;z-index:2147483647;bottom:0;left:0;right:0;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;padding:10px 16px;background:#fff6db;color:#664510;border-top:1px solid #e6c675;font:12px/1.5 system-ui,sans-serif;box-shadow:0 -2px 12px #11111112}#tp-preview-banner strong{font-size:11px;letter-spacing:.08em;background:#7a4d00;color:#fff;padding:3px 7px;border-radius:4px}#tp-preview-banner label{display:flex;gap:5px;align-items:center;white-space:nowrap}#tp-preview-banner select,#tp-preview-banner button{border:1px solid #c9af79;border-radius:5px;background:#fff;color:#493713;padding:4px 6px;font:inherit}#tp-preview-banner button{cursor:pointer}#tp-preview-banner :focus-visible{outline:3px solid #3658bb;outline-offset:2px}@media(max-width:700px){body{padding-bottom:110px!important}#tp-preview-banner{gap:6px;padding:7px 9px}#tp-preview-status{font-size:10px;max-width:220px}}'
  fs.writeFileSync(path.join(previewDir, 'banner.css'), css)
  const head = `<head><meta http-equiv="Content-Security-Policy" content="${policy}"><meta name="robots" content="noindex,nofollow"><script src="/ui-preview/adapter.js"></script><link rel="stylesheet" href="/ui-preview/banner.css">`
  const html = index
    .replace('<head>', head)
    .replace('<body>', `<body>${banner}`)
    .replaceAll('/api/image/logo', dataImage(logo))
    .replace(
      /<title>.*?<\/title>/,
      '<title>Trojan Panel · Mock Preview</title>'
    )
  fs.writeFileSync(path.join(destination, 'index.html'), html)
  fs.writeFileSync(
    path.join(previewDir, 'manifest.json'),
    JSON.stringify(
      {
        kind: 'synthetic-static-preview',
        sourceIndexSha256: sourceHash,
        sourceTreeSha256: sourceTreeHash,
        apiNetwork: 'blocked',
        published: false
      },
      null,
      2
    )
  )
  if (digestTree(source) !== sourceTreeHash)
    throw new Error(
      'Production build changed while copying; rerun after the build finishes'
    )
  console.log(`Prepared ${destination}`)
  console.log(
    'Not published. Source dist and production application are unchanged.'
  )
  console.log(
    'API network access is blocked; fixture adapter runs before application JavaScript.'
  )
}
if (require.main === module) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
module.exports = { main }
