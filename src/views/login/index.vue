<template>
  <auth-layout :system-name="systemName" mode="login" v-slot="{ copy }">
    <el-form
      ref="loginForm"
      :model="loginForm"
      :rules="loginRules"
      class="auth-form"
      label-position="top"
      @submit.native.prevent="handleLogin"
    >
      <el-form-item
        prop="username"
        :label="$t('login.username')"
        for="login-username"
      >
        <el-input
          id="login-username"
          ref="username"
          v-model="loginForm.username"
          :placeholder="$t('login.username')"
          name="username"
          type="text"
          autocomplete="username"
          clearable
          ><svg-icon slot="prefix" icon-class="username"
        /></el-input>
      </el-form-item>

      <el-form-item
        prop="pass"
        :label="$t('login.password')"
        for="login-password"
      >
        <div class="auth-password">
          <el-input
            :key="passwordType"
            id="login-password"
            ref="pass"
            v-model="loginForm.pass"
            :type="passwordType"
            :placeholder="$t('login.password')"
            name="password"
            autocomplete="current-password"
            clearable
            ><svg-icon slot="prefix" icon-class="pass"
          /></el-input>
          <button
            class="auth-password-toggle"
            type="button"
            :aria-label="
              passwordType === 'password'
                ? copy.showPassword
                : copy.hidePassword
            "
            :aria-pressed="passwordType !== 'password'"
            @click="showPwd"
          >
            <svg-icon
              :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
            />
          </button>
        </div>
      </el-form-item>

      <el-form-item
        v-if="captchaEnable"
        prop="captchaCode"
        :label="$t('login.code')"
        for="login-captcha"
      >
        <div class="auth-captcha-row">
          <el-input
            id="login-captcha"
            v-model="loginForm.captchaCode"
            autocomplete="off"
            :placeholder="$t('login.code')"
            ><svg-icon slot="prefix" icon-class="valid-code"
          /></el-input>
          <button
            class="auth-captcha"
            type="button"
            :aria-label="copy.refreshCaptcha"
            :title="copy.refreshCaptcha"
            @click="handleCaptchaGenerate"
          >
            <img :alt="$t('login.code')" :src="captchaImg" />
          </button>
        </div>
      </el-form-item>

      <el-button
        :loading="loading"
        native-type="submit"
        type="primary"
        class="auth-submit"
      >
        {{ $t('login.logIn') }}
      </el-button>
      <div v-if="registerEnable === 1" class="auth-switch">
        <span>{{ $t('login.register') }}</span>
        <router-link to="/register">{{ copy.createAccount }}</router-link>
      </div>
    </el-form>
  </auth-layout>
</template>

<script>
import AuthLayout from '@/components/AuthLayout'
import { setting } from '@/api/system'
import { generateCaptcha } from '@/api/account'

export default {
  name: 'LoginPage',
  components: { AuthLayout },
  data() {
    return {
      loginForm: {
        username: '',
        pass: '',
        captchaId: '',
        captchaCode: ''
      },
      captchaImg: '',
      loginRules: {
        username: [
          {
            required: true,
            message: this.$t('valid.username'),
            trigger: ['change', 'blur']
          },
          {
            min: 6,
            max: 20,
            message: this.$t('valid.usernameRange'),
            trigger: ['change', 'blur']
          },
          {
            pattern: /^[A-Za-z0-9]+$/,
            message: this.$t('valid.usernameElement'),
            trigger: ['change', 'blur']
          }
        ],
        pass: [
          {
            required: true,
            message: this.$t('valid.pass'),
            trigger: ['change', 'blur']
          },
          {
            min: 6,
            max: 20,
            message: this.$t('valid.passRange'),
            trigger: ['change', 'blur']
          },
          {
            pattern: /^[A-Za-z0-9]+$/,
            message: this.$t('valid.passElement'),
            trigger: ['change', 'blur']
          }
        ],
        captchaCode: [
          {
            required: true,
            message: this.$t('valid.code'),
            trigger: ['change', 'blur']
          }
        ]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined,
      registerEnable: 0,
      systemName: '',
      captchaEnable: 0
    }
  },
  watch: {
    $route: {
      handler: function (route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  created() {
    this.setting()
    this.handleCaptchaGenerate()
  },
  methods: {
    handleCaptchaGenerate() {
      generateCaptcha().then((response) => {
        this.loginForm.captchaId = response.data.captchaId
        this.captchaImg = response.data.captchaImg
      })
    },
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = 'text'
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.pass.focus()
      })
    },
    handleLogin() {
      if (this.loading) return
      this.$refs.loginForm.validate((valid) => {
        if (valid) {
          this.loading = true
          this.$store
            .dispatch('account/login', this.loginForm)
            .then(() => {
              this.$router
                .push({ path: this.redirect || '/' })
                .catch(() => true)
              this.loading = false
            })
            .catch(() => {
              this.loading = false
              this.handleCaptchaGenerate()
            })
        } else {
          // console.log('error submit!!')
          return false
        }
      })
    },
    setting() {
      setting().then((response) => {
        const { data } = response
        this.registerEnable = data.registerEnable
        this.systemName = data.systemName
        this.captchaEnable = data.captchaEnable
      })
    }
  }
}
</script>
