'use strict'

// Synthetic, reserved-domain data. This file is only loaded by preview tooling, never the production app.
const GiB = 1024 ** 3
const DAY = 86400000
const NOW = Date.UTC(2026, 9, 5, 12)
const roles = [
  { id: 1, name: 'sysadmin', desc: 'System administrator' },
  { id: 2, name: 'admin', desc: 'Administrator' },
  { id: 3, name: 'user', desc: 'User' }
]
const nodeTypes = [
  { id: 1, name: 'Xray' },
  { id: 2, name: 'Trojan-Go' },
  { id: 3, name: 'Hysteria' },
  { id: 4, name: 'NaiveProxy' },
  { id: 5, name: 'Hysteria 2' }
]

function makeFixtures() {
  const nodeServers = [
    { id: 1, name: 'Preview Singapore', ip: '192.0.2.10', status: 1 },
    { id: 2, name: 'Preview Frankfurt', ip: '198.51.100.20', status: 1 },
    { id: 3, name: 'Preview Tokyo', ip: '203.0.113.30', status: 0 }
  ].map((row, i) => ({
    ...row,
    grpcPort: 8100,
    trojanPanelCoreVersion: '2.3.0-preview',
    createTime: NOW - (80 - i * 15) * DAY
  }))
  const nodes = [
    ['Preview SG 01', 1, 1, 1],
    ['Preview SG 02', 1, 5, 1],
    ['Preview DE 01', 2, 2, 1],
    ['Preview DE 02', 2, 1, 1],
    ['Preview JP 01', 3, 3, 0],
    ['Preview JP 02', 3, 4, 0]
  ].map(([name, nodeServerId, nodeTypeId, status], i) => ({
    id: i + 1,
    name,
    nodeServerId,
    nodeTypeId,
    status,
    nodeSubId: i + 1,
    domain: `preview-${i + 1}.example.invalid`,
    port: 443 + i,
    priority: 100 - i,
    createTime: NOW - (60 - i * 5) * DAY,
    password: 'preview-only-not-a-secret',
    uuid: '00000000-0000-4000-8000-000000000001',
    xrayProtocol: 'vless',
    xrayFlow: '',
    xraySSMethod: 'aes-256-gcm',
    alterId: 0,
    xraySettings: '{"decryption":"none"}',
    xraySettingsEntity: {
      decryption: 'none',
      fallbacks: [],
      network: 'tcp',
      accounts: [],
      udp: true
    },
    xrayStreamSettings: '{"network":"tcp","security":"tls"}',
    xrayStreamSettingsEntity: {
      network: 'tcp',
      security: 'tls',
      tlsSettings: {
        serverName: 'preview.example.invalid',
        alpn: ['h2', 'http/1.1'],
        allowInsecure: false,
        fingerprint: 'chrome'
      },
      wsSettings: {
        path: '/preview',
        headers: { Host: 'preview.example.invalid' }
      },
      realitySettings: {
        serverNames: [],
        shortIds: [],
        privateKey: 'PREVIEW-PLACEHOLDER',
        spiderX: '/'
      }
    },
    xrayTag: 'preview',
    xraySniffing: '{}',
    xrayAllocate: '{}',
    realityPbk: 'PREVIEW-PLACEHOLDER',
    trojanGoSni: 'preview.example.invalid',
    trojanGoMuxEnable: 0,
    trojanGoWebsocketEnable: 0,
    trojanGoWebsocketPath: '/preview',
    trojanGoWebsocketHost: '',
    trojanGoSsEnable: 0,
    trojanGoSsMethod: 'aes-128-gcm',
    trojanGoSsPassword: 'preview-only',
    hysteriaProtocol: 'udp',
    hysteriaObfs: '',
    hysteriaUpMbps: 50,
    hysteriaDownMbps: 100,
    hysteriaServerName: 'preview.example.invalid',
    hysteriaInsecure: 0,
    hysteriaFastOpen: 0,
    naiveProxyUsername: 'previewuser',
    hysteria2ObfsPassword: 'preview-only',
    hysteria2UpMbps: 50,
    hysteria2DownMbps: 100,
    hysteria2ServerName: 'preview.example.invalid',
    hysteria2Insecure: 0
  }))
  const accounts = Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    username:
      [
        'previewadmin',
        'previewops',
        'previewuser',
        'previewexpired',
        'previewdisabled',
        'previewunused'
      ][i] || `preview${String(i + 1).padStart(2, '0')}`,
    email: `preview${i + 1}@example.invalid`,
    roleId: i < 2 ? i + 1 : 3,
    quota: i === 0 ? 1024 * GiB : i === 1 ? -1 : 100 * GiB,
    download: (48 - i) * GiB,
    upload: (8 - i / 4) * GiB,
    deleted: i === 4 ? 1 : 0,
    lastLoginTime: i === 5 ? 0 : NOW - i * 3600000,
    expireTime: NOW + (i === 3 ? -2 : 30 + i) * DAY,
    presetQuota: i === 5 ? 50 * GiB : 0,
    presetExpire: i === 5 ? 30 : 0,
    createTime: NOW - (100 - i * 3) * DAY
  }))
  return {
    nodes,
    nodeServers,
    accounts,
    emailRecords: [
      {
        id: 1,
        toEmail: 'previewuser@example.invalid',
        subject: '[Preview] Account reminder',
        content: 'Synthetic delivery record. No message was sent.',
        state: 1,
        createTime: NOW - 3600000
      },
      {
        id: 2,
        toEmail: 'previewexpired@example.invalid',
        subject: '[Preview] Expiry notice',
        content: 'Synthetic waiting record. No email provider is connected.',
        state: 0,
        createTime: NOW - 7200000
      },
      {
        id: 3,
        toEmail: 'previewdisabled@example.invalid',
        subject: '[Preview] Delivery failure',
        content: 'Synthetic failure for UI verification.',
        state: -1,
        createTime: NOW - DAY
      }
    ],
    fileTasks: [
      {
        id: 1,
        name: 'preview-accounts.csv',
        type: 1,
        status: 2,
        errMsg: '',
        accountUsername: 'previewadmin',
        createTime: NOW - 3600000
      },
      {
        id: 2,
        name: 'preview-servers.csv',
        type: 2,
        status: 1,
        errMsg: '',
        accountUsername: 'previewops',
        createTime: NOW - 7200000
      },
      {
        id: 3,
        name: 'preview-import.csv',
        type: 3,
        status: -1,
        errMsg: 'Preview fixture: invalid file format',
        accountUsername: 'previewadmin',
        createTime: NOW - DAY
      },
      {
        id: 4,
        name: 'preview-queued.csv',
        type: 4,
        status: 0,
        errMsg: '',
        accountUsername: 'previewadmin',
        createTime: NOW - 2 * DAY
      }
    ],
    blackLists: [
      { ip: '192.0.2.200', createTime: NOW - DAY },
      { ip: '198.51.100.200', createTime: NOW - 2 * DAY }
    ],
    system: {
      id: 1,
      systemName: 'Trojan Panel Preview',
      registerEnable: 1,
      registerQuota: 10240,
      registerExpireDays: 30,
      resetDownloadAndUploadMonth: 1,
      trafficRankEnable: 1,
      captchaEnable: 0,
      emailEnable: 0,
      emailHost: 'smtp.example.invalid',
      emailPort: 587,
      emailUsername: 'preview@example.invalid',
      emailPassword: '',
      expireWarnEnable: 1,
      expireWarnDay: 7,
      clashRule: '# Local-only preview fixture\nMATCH,DIRECT',
      xrayTemplate:
        '{"log":{"loglevel":"warning"},"outbounds":[{"protocol":"freedom"}]}'
    }
  }
}

module.exports = { GiB, NOW, roles, nodeTypes, makeFixtures }
