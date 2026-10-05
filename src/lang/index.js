import Vue from 'vue'
import VueI18n from 'vue-i18n'
import Cookies from 'js-cookie'
import elementEnLocale from 'element-ui/lib/locale/lang/en' // element-ui lang
import elementZhLocale from 'element-ui/lib/locale/lang/zh-CN' // element-ui lang
import elementKoLocale from 'element-ui/lib/locale/lang/ko' // element-ui lang
import elementFaLocale from 'element-ui/lib/locale/lang/fa' // element-ui lang
import enLocale from './en'
import zhLocale from './zh'
import koLocale from './ko'
import faLocale from './fa'
import shell from './shell'
import modern from './modern'

Vue.use(VueI18n)

const messages = {
  en: {
    ...enLocale,
    shell: shell.en,
    modern: modern.en,
    ...elementEnLocale
  },
  zh: {
    ...zhLocale,
    shell: shell.zh,
    modern: modern.zh,
    ...elementZhLocale
  },
  ko: {
    ...koLocale,
    shell: shell.ko,
    modern: modern.ko,
    ...elementKoLocale
  },
  fa: {
    ...faLocale,
    shell: shell.fa,
    modern: modern.fa,
    ...elementFaLocale
  }
}

export function getLanguage() {
  const chooseLanguage = Cookies.get('language')
  if (chooseLanguage) return chooseLanguage

  // if has not choose language
  const language = (
    navigator.language || navigator.browserLanguage
  ).toLowerCase()
  const locales = Object.keys(messages)
  for (const locale of locales) {
    if (language.indexOf(locale) > -1) {
      return locale
    }
  }
  return 'en'
}

const i18n = new VueI18n({
  // set locale
  // options: en | zh | es
  locale: getLanguage(),
  // set locale messages
  messages
})

export default i18n
