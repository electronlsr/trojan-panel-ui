<template>
  <auth-layout :system-name="systemName" mode="register" v-slot="{ copy }">
    <el-form
      ref="registerForm"
      :model="registerForm"
      :rules="registerRules"
      class="auth-form"
      label-position="top"
      @submit.native.prevent="handleRegister"
    >
      <el-form-item
        prop="username"
        :label="$t('register.username')"
        for="register-username"
      >
        <el-input
          id="register-username"
          ref="username"
          v-model="registerForm.username"
          :placeholder="$t('register.username')"
          name="username"
          type="text"
          autocomplete="username"
          clearable
          ><svg-icon slot="prefix" icon-class="username"
        /></el-input>
      </el-form-item>

      <el-form-item
        prop="passOne"
        :label="$t('register.passOne')"
        for="register-password"
      >
        <div class="auth-password">
          <el-input
            id="register-password"
            ref="passOne"
            v-model="registerForm.passOne"
            :type="passwordType"
            :placeholder="$t('register.passOne')"
            name="password"
            autocomplete="new-password"
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
            @click="showPwd('passOne')"
          >
            <svg-icon
              :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'"
            />
          </button>
        </div>
      </el-form-item>
      <p class="auth-field-hint">{{ copy.passwordHint }}</p>

      <el-form-item
        prop="pass"
        :label="copy.confirmPassword"
        for="register-confirm-password"
      >
        <div class="auth-password">
          <el-input
            id="register-confirm-password"
            ref="pass"
            v-model="registerForm.pass"
            :type="passwordType"
            :placeholder="copy.confirmPassword"
            name="password-confirmation"
            autocomplete="new-password"
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
            @click="showPwd('pass')"
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
        for="register-captcha"
      >
        <div class="auth-captcha-row">
          <el-input
            id="register-captcha"
            v-model="registerForm.captchaCode"
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
            <img :src="captchaImg" :alt="$t('login.code')" />
          </button>
        </div>
      </el-form-item>

      <el-button
        :loading="loading"
        native-type="submit"
        type="primary"
        class="auth-submit"
      >
        {{ $t('register.register') }}
      </el-button>
      <div class="auth-switch">
        <span>{{ copy.haveAccount }}</span>
        <router-link to="/login">{{ $t('register.login') }}</router-link>
      </div>
    </el-form>
  </auth-layout>
</template>

<script>
import AuthLayout from '@/components/AuthLayout'
import { generateCaptcha } from '@/api/account'
import { setting } from '@/api/system'

export default {
  name: 'RegisterPage',
  components: { AuthLayout },
  data() {
    const validatePass = (rule, value, callback) => {
      if (this.registerForm.passOne !== this.registerForm.pass) {
        callback(new Error(this.$t('valid.passNotSame')))
      } else {
        callback()
      }
    }
    const validateUsername = (rule, value, callback) => {
      if (this.registerForm.username.trim().indexOf('admin') >= 0) {
        callback(new Error(this.$t('valid.usernameNotExistAdmin')))
      } else {
        callback()
      }
    }
    return {
      registerForm: {
        username: '',
        passOne: '',
        pass: '',
        captchaId: '',
        captchaCode: ''
      },
      captchaImg: '',
      captchaEnable: 0,
      systemName: '',
      registerRules: {
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
          },
          {
            validator: validateUsername,
            trigger: ['change', 'blur']
          }
        ],
        passOne: [
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
          },
          {
            validator: validatePass,
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
      passwordType: 'password'
    }
  },
  created() {
    this.handleCaptchaGenerate()
    this.setting()
  },
  methods: {
    handleCaptchaGenerate() {
      generateCaptcha().then((response) => {
        this.registerForm.captchaId = response.data.captchaId
        this.captchaImg = response.data.captchaImg
      })
    },
    showPwd(field = 'pass') {
      if (this.passwordType === 'password') {
        this.passwordType = 'text'
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs[field].focus()
      })
    },
    handleRegister() {
      if (this.loading) return
      this.$refs.registerForm.validate((valid) => {
        if (valid) {
          this.loading = true
          this.$store
            .dispatch('account/register', this.registerForm)
            .then(() => {
              this.$router.push({ path: '/login' })
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
        this.captchaEnable = data.captchaEnable
        this.systemName = data.systemName
      })
    }
  }
}
</script>
