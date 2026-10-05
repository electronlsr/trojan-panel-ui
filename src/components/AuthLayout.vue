<template>
  <div class="auth-shell" :dir="$i18n.locale === 'fa' ? 'rtl' : 'ltr'">
    <header class="auth-topbar">
      <router-link to="/login" class="auth-brand">
        <span class="auth-brand-mark">
          <img
            v-if="!logoFailed"
            src="/api/image/logo"
            alt=""
            @error="logoFailed = true"
          />
          <svg v-else viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3 21 8 12 13 3 8 12 3Z" fill="currentColor" />
            <path
              d="m3 12 9 5 9-5M3 16l9 5 9-5"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span>{{ systemName || $t('login.title') }}</span>
      </router-link>
      <div class="auth-language">
        <span>{{ languageName }}</span>
        <lang-select />
      </div>
    </header>

    <main class="auth-main">
      <section class="auth-intro">
        <div class="auth-eyebrow"><span></span>{{ copy.workspace }}</div>
        <h1>
          {{ copy.headline }}<br /><span>{{ copy.headlineAccent }}</span>
        </h1>
        <p class="auth-intro-description">{{ copy.description }}</p>

        <div class="auth-network" aria-hidden="true">
          <svg class="auth-network-lines" viewBox="0 0 440 260" fill="none">
            <rect
              x="48"
              y="28"
              width="344"
              height="204"
              rx="102"
              stroke="#dce6f8"
              stroke-dasharray="5 7"
            />
            <path
              d="M100 70h54a28 28 0 0 1 28 28v32h76a28 28 0 0 0 28-28V70h54M220 130v67"
              stroke="#c5d7f8"
              stroke-width="2"
            />
            <circle cx="182" cy="115" r="4" fill="#6e9bf2" />
            <circle cx="286" cy="96" r="4" fill="#6e9bf2" />
            <circle cx="220" cy="181" r="4" fill="#6e9bf2" />
          </svg>
          <div class="auth-network-node auth-network-server">
            <i class="el-icon-monitor"></i>
          </div>
          <div class="auth-network-node auth-network-account">
            <i class="el-icon-user"></i>
          </div>
          <div class="auth-network-hub">
            <svg viewBox="0 0 40 40" fill="none">
              <path d="m20 6 14 8-14 8L6 14l14-8Z" fill="white" />
              <path
                d="m6 21 14 8 14-8M6 28l14 8 14-8"
                stroke="white"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
          <div class="auth-network-node auth-network-endpoint">
            <i class="el-icon-connection"></i>
          </div>
        </div>

        <div class="auth-capabilities">
          <span
            ><i class="el-icon-monitor" aria-hidden="true"></i
            >{{ $t('route.serverManage') }}</span
          >
          <span
            ><i class="el-icon-connection" aria-hidden="true"></i
            >{{ $t('route.nodeManage') }}</span
          >
          <span
            ><i class="el-icon-user" aria-hidden="true"></i
            >{{ $t('route.accountManage') }}</span
          >
        </div>
      </section>

      <section class="auth-card" :aria-labelledby="`${mode}-heading`">
        <div class="auth-card-icon">
          <i
            :class="mode === 'register' ? 'el-icon-user' : 'el-icon-right'"
            aria-hidden="true"
          ></i>
        </div>
        <h2 :id="`${mode}-heading`">
          {{ mode === 'register' ? copy.registerTitle : copy.loginTitle }}
        </h2>
        <p class="auth-card-description">
          {{
            mode === 'register'
              ? copy.registerDescription
              : copy.loginDescription
          }}
        </p>
        <slot :copy="copy"></slot>
      </section>
    </main>
    <footer class="auth-footer">
      {{ systemName || $t('login.title') }}<span aria-hidden="true">·</span
      >{{ copy.footer }}
    </footer>
  </div>
</template>

<script>
import LangSelect from '@/components/LangSelect'

const messages = {
  en: {
    workspace: 'YOUR NETWORK WORKSPACE',
    headline: 'Your network.',
    headlineAccent: 'One clear view.',
    description:
      'A simpler way to manage your servers, nodes and accounts. Everything you need, together in one place.',
    loginTitle: 'Welcome back',
    loginDescription: 'Sign in to your account to continue.',
    registerTitle: 'Create your account',
    registerDescription: 'Enter your details to get started.',
    footer: 'A connected workspace',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    refreshCaptcha: 'Refresh verification code',
    confirmPassword: 'Confirm password',
    createAccount: 'Create an account',
    haveAccount: 'Already have an account?',
    passwordHint: 'Use 6–20 letters and numbers.'
  },
  zh: {
    workspace: '你的网络管理空间',
    headline: '连接每一处，',
    headlineAccent: '尽在掌握。',
    description:
      '服务器、节点与账户，一站式轻松管理。让日常运维更清晰，让每一次连接更简单。',
    loginTitle: '欢迎回来',
    loginDescription: '登录账户，继续管理你的网络。',
    registerTitle: '创建你的账户',
    registerDescription: '填写以下信息，开启你的管理空间。',
    footer: '连接你的管理空间',
    showPassword: '显示密码',
    hidePassword: '隐藏密码',
    refreshCaptcha: '刷新验证码',
    confirmPassword: '确认密码',
    createAccount: '创建账户',
    haveAccount: '已有账户？',
    passwordHint: '使用 6–20 位英文字母或数字。'
  },
  ko: {
    workspace: '나의 네트워크 워크스페이스',
    headline: '나의 네트워크를',
    headlineAccent: '한눈에.',
    description:
      '서버, 노드, 계정을 간편하게 관리하세요. 필요한 모든 것을 한곳에서 확인할 수 있습니다.',
    loginTitle: '다시 오신 것을 환영합니다',
    loginDescription: '계속하려면 계정에 로그인하세요.',
    registerTitle: '계정 만들기',
    registerDescription: '아래 정보를 입력하고 시작하세요.',
    footer: '연결된 워크스페이스',
    showPassword: '비밀번호 표시',
    hidePassword: '비밀번호 숨기기',
    refreshCaptcha: '인증 코드 새로고침',
    confirmPassword: '비밀번호 확인',
    createAccount: '계정 만들기',
    haveAccount: '이미 계정이 있으신가요?',
    passwordHint: '영문과 숫자 6–20자를 사용하세요.'
  },
  fa: {
    workspace: 'فضای مدیریت شبکه شما',
    headline: 'شبکه شما،',
    headlineAccent: 'در یک نگاه.',
    description:
      'راهی ساده‌تر برای مدیریت سرورها، نودها و حساب‌ها. هرآنچه نیاز دارید، در یک مکان.',
    loginTitle: 'خوش آمدید',
    loginDescription: 'برای ادامه وارد حساب خود شوید.',
    registerTitle: 'ساخت حساب کاربری',
    registerDescription: 'برای شروع، اطلاعات خود را وارد کنید.',
    footer: 'فضای مدیریت یکپارچه',
    showPassword: 'نمایش رمز عبور',
    hidePassword: 'پنهان کردن رمز عبور',
    refreshCaptcha: 'دریافت کد تأیید جدید',
    confirmPassword: 'تأیید رمز عبور',
    createAccount: 'ساخت حساب',
    haveAccount: 'قبلاً حساب ساخته‌اید؟',
    passwordHint: 'از ۶ تا ۲۰ حرف انگلیسی یا عدد استفاده کنید.'
  }
}

export default {
  name: 'AuthLayout',
  components: { LangSelect },
  props: {
    systemName: { type: String, default: '' },
    mode: { type: String, default: 'login' }
  },
  data() {
    return { logoFailed: false }
  },
  computed: {
    copy() {
      return messages[this.$i18n.locale] || messages.en
    },
    languageName() {
      return (
        { en: 'English', zh: '中文', ko: '한국어', fa: 'فارسی' }[
          this.$i18n.locale
        ] || 'English'
      )
    }
  }
}
</script>

<style lang="scss">
.auth-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--ui-ink, #17243d);
  background: radial-gradient(ellipse at 10% 45%, #eaf1ff 0, transparent 55%),
    var(--ui-bg, #f5f7fb);

  .auth-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    width: 100%;
    padding: 28px 48px;
  }

  .auth-brand {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.4px;
    line-height: 1.4;

    > span:last-child {
      overflow-wrap: anywhere;
    }
  }

  .auth-brand-mark {
    display: grid;
    place-items: center;
    flex: 0 0 38px;
    height: 38px;
    color: var(--ui-primary, #2563eb);
    background: #fff;
    border: 1px solid var(--ui-border, #e6ebf2);
    border-radius: 11px;

    img,
    svg {
      width: 26px;
      height: 26px;
      object-fit: contain;
    }
  }

  .auth-language {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-shrink: 0;
    font-size: 12px;
    color: #58677f;

    .international {
      cursor: pointer;
      font-size: 18px;
      color: #58677f;
    }
    .international > div {
      padding: 8px;
      border-radius: 8px;
    }
    .international > div:hover {
      background: #e8eef9;
    }
  }

  .auth-main {
    flex: 1;
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(360px, 432px);
    align-items: center;
    gap: 88px;
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
    padding: 28px 40px 48px;
  }

  .auth-eyebrow {
    display: flex;
    align-items: center;
    gap: 9px;
    margin-bottom: 22px;
    color: #4970af;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.4px;

    span {
      height: 6px;
      width: 6px;
      border-radius: 50%;
      background: #5284e9;
    }
  }

  .auth-intro h1 {
    margin: 0;
    font-size: clamp(34px, 4vw, 48px);
    font-weight: 700;
    letter-spacing: -1.8px;
    line-height: 1.22;

    span {
      color: var(--ui-primary, #2563eb);
    }
  }

  .auth-intro-description {
    max-width: 400px;
    margin: 22px 0 0;
    color: #64748b;
    font-size: 15px;
    line-height: 1.9;
  }

  .auth-network {
    position: relative;
    width: 100%;
    max-width: 440px;
    height: 260px;
    margin: 12px 0 0;
    direction: ltr;
  }
  .auth-network-lines {
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;
  }
  .auth-network-node,
  .auth-network-hub {
    position: absolute;
    display: grid;
    place-items: center;
  }
  .auth-network-node {
    width: 62px;
    height: 62px;
    border-radius: 18px;
    background: #fff;
    border: 1px solid #e5ecf8;
    color: #6688bf;
    box-shadow: 0 10px 24px rgba(55, 88, 146, 0.06);
    font-size: 27px;
  }
  .auth-network-server {
    left: calc(22.7% - 31px);
    top: 39px;
    transform: rotate(-8deg);
  }
  .auth-network-account {
    left: calc(77.3% - 31px);
    top: 39px;
    transform: rotate(8deg);
  }
  .auth-network-endpoint {
    left: calc(50% - 26px);
    top: 185px;
    width: 52px;
    height: 52px;
    border-radius: 16px;
    font-size: 24px;
  }
  .auth-network-hub {
    top: 91px;
    left: calc(50% - 39px);
    width: 78px;
    height: 78px;
    border: 6px solid #f3f7ff;
    border-radius: 23px;
    background: var(--ui-primary, #2563eb);
    box-shadow: 0 12px 28px rgba(37, 99, 235, 0.2);
  }
  .auth-network-hub svg {
    width: 40px;
    height: 40px;
  }
  .auth-capabilities {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 18px;
    color: #64748b;
    font-size: 11px;
  }
  .auth-capabilities span {
    display: inline-flex;
    gap: 6px;
    align-items: center;
  }
  .auth-capabilities i {
    color: #6d8bb6;
    font-size: 15px;
  }

  .auth-card {
    padding: 36px;
    background: var(--ui-surface, #fff);
    border: 1px solid var(--ui-border, #e6ebf2);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(32, 57, 97, 0.06),
      0 2px 6px rgba(32, 57, 97, 0.02);
  }

  .auth-card-icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-bottom: 22px;
    border-radius: 13px;
    color: var(--ui-primary, #2563eb);
    background: #edf3ff;
    font-size: 23px;
  }
  .auth-card h2 {
    margin: 0;
    color: var(--ui-ink, #17243d);
    font-size: 26px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: -0.6px;
  }
  .auth-card-description {
    margin: 9px 0 28px;
    color: var(--ui-muted, #718096);
    font-size: 13px;
    line-height: 1.7;
  }
  .auth-form .el-form-item {
    margin-bottom: 23px;
  }
  .auth-form .el-form-item__label {
    padding: 0 0 8px;
    color: #445169;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.4;
  }
  .auth-form .el-form-item__content {
    line-height: 46px;
  }
  .auth-form .el-input__inner {
    width: 100%;
    height: 46px;
    border: 1px solid #dfe5ee;
    border-radius: 9px;
    color: var(--ui-ink, #17243d);
    background: #fbfcfe;
    font-size: 13px;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .auth-form .el-input__inner:hover {
    border-color: #b9c8de;
  }
  .auth-form .el-input__inner:focus {
    border-color: var(--ui-primary, #2563eb);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    background: #fff;
  }
  .auth-form .el-input__inner::placeholder {
    color: #a0aaba;
  }
  .auth-form .el-input--prefix .el-input__inner {
    padding-left: 41px;
  }
  .auth-form .el-input__prefix {
    left: 14px;
    display: flex;
    align-items: center;
    color: #92a0b5;
  }
  .auth-form .el-input__suffix {
    right: 12px;
  }
  .auth-form .el-input__inner:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px #fbfcfe inset;
    -webkit-text-fill-color: #17243d;
    caret-color: #17243d;
  }
  .auth-form .is-error .el-input__inner {
    border-color: #e16565;
  }
  .auth-form .el-form-item__error {
    padding-top: 5px;
    font-size: 11px;
    line-height: 1.25;
  }
  .auth-password {
    position: relative;
  }
  .auth-password .el-input__inner {
    padding-right: 67px;
  }
  .auth-password .el-input__suffix {
    right: 40px;
  }
  .auth-password-toggle {
    position: absolute;
    top: 5px;
    right: 7px;
    display: grid;
    place-items: center;
    height: 36px;
    width: 32px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: #7c8ca4;
    font-size: 17px;
    cursor: pointer;
  }
  .auth-password-toggle:hover {
    color: var(--ui-primary, #2563eb);
    background: #eff4fd;
  }
  .auth-field-hint {
    margin: -9px 0 20px;
    color: #8895a7;
    font-size: 11px;
    line-height: 1.6;
  }
  .auth-captcha-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .auth-captcha-row .el-input {
    flex: 1;
    min-width: 0;
  }
  .auth-captcha {
    display: flex;
    flex: 0 0 108px;
    height: 46px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    padding: 0;
    border: 1px solid #dfe5ee;
    border-radius: 9px;
    background: #f5f8fc;
    cursor: pointer;
  }
  .auth-captcha img {
    max-width: 100%;
    height: 42px;
    object-fit: contain;
  }
  .auth-submit.el-button {
    display: block;
    width: 100%;
    height: 46px;
    margin-top: 6px;
    border-color: var(--ui-primary, #2563eb);
    border-radius: 9px;
    background: var(--ui-primary, #2563eb);
    font-size: 13px;
    font-weight: 600;
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.14);
  }
  .auth-submit.el-button:hover {
    filter: brightness(1.06);
  }
  .auth-submit.el-button.is-loading {
    filter: none;
  }
  .auth-switch {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
    margin: 26px 0 0;
    padding-top: 22px;
    border-top: 1px solid #edf0f5;
    color: #8090a6;
    font-size: 12px;
    line-height: 1.6;
  }
  .auth-switch a {
    color: var(--ui-primary, #2563eb);
    font-weight: 600;
  }
  .auth-switch a:hover {
    text-decoration: underline;
  }
  .auth-footer {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 9px;
    padding: 0 24px 22px;
    color: #8b98ab;
    font-size: 11px;
    line-height: 1.7;
    text-align: center;
  }
  a:focus-visible,
  button:focus-visible,
  .international > div:focus-visible {
    outline: 2px solid var(--ui-primary, #2563eb);
    outline-offset: 4px;
  }

  &[dir='rtl'] {
    .auth-intro h1,
    .auth-eyebrow {
      letter-spacing: 0;
    }
    .el-form-item__label {
      float: none;
      text-align: right;
    }
    .el-input__inner {
      text-align: right;
    }
  }

  @media (max-width: 1000px) {
    .auth-main {
      gap: 40px;
      padding-inline: 32px;
    }
    .auth-topbar {
      padding: 24px 32px;
    }
    .auth-intro h1 {
      font-size: 38px;
    }
    .auth-card {
      padding: 30px;
    }
  }

  @media (max-width: 760px) {
    .auth-topbar {
      padding: 22px 24px;
    }
    .auth-brand {
      font-size: 16px;
    }
    .auth-language {
      gap: 2px;
    }
    .auth-main {
      display: block;
      max-width: 480px;
      padding: 30px 24px 44px;
    }
    .auth-intro {
      display: none;
    }
    .auth-card {
      padding: 30px;
      border-radius: 16px;
    }
    .auth-card h2 {
      font-size: 25px;
    }
    .auth-footer {
      padding-bottom: 20px;
    }
  }

  @media (max-width: 380px) {
    .auth-main {
      padding-inline: 16px;
    }
    .auth-card {
      padding: 24px;
    }
    .auth-topbar {
      padding-inline: 20px;
    }
    .auth-language > span {
      display: none;
    }
  }
}
</style>
