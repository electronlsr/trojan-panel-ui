#!/usr/bin/env node
'use strict'

const path = require('path')
const { spawnSync } = require('child_process')

// vue-demi ships a default Vue 3 adapter. Its install hook must run again when
// dependencies are installed with scripts disabled or Vue's version changes.
function checkRuntime({ repair = false } = {}) {
  const packagePath = require.resolve('vue-demi/package.json')
  const packageRoot = path.dirname(packagePath)
  if (repair) {
    const result = spawnSync(
      process.execPath,
      [path.join(packageRoot, 'scripts/postinstall.js')],
      { stdio: 'inherit' }
    )
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error('vue-demi initialization failed')
    for (const key of Object.keys(require.cache)) {
      if (key.startsWith(packageRoot + path.sep)) delete require.cache[key]
    }
  }
  const Vue = require('vue')
  const demi = require('vue-demi')
  const expectedVue2 = Vue.version.startsWith('2.')
  if (
    demi.isVue2 !== expectedVue2 ||
    typeof demi.defineComponent !== 'function'
  ) {
    throw new Error(
      `Vue ${Vue.version} and vue-demi disagree. Run node scripts/check-vue-runtime.cjs --repair, then rebuild the application.`
    )
  }
  return { vue: Vue.version, adapter: demi.isVue2 ? 'Vue 2' : 'Vue 3' }
}
if (require.main === module) {
  try {
    console.log(
      JSON.stringify(
        checkRuntime({ repair: process.argv.includes('--repair') })
      )
    )
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
module.exports = { checkRuntime }
