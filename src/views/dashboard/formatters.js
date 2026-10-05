import { getFlow } from '@/utils/account'

export function hasNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== '' &&
    Number.isFinite(Number(value))
  )
}

export function flowLabel(value) {
  return hasNumber(value)
    ? getFlow(Number(value)).replace(/(KB|MB|GB)$/, ' $1')
    : '—'
}

export function quotaLabel(data, translate) {
  return hasNumber(data.quota) && Number(data.quota) < 0
    ? translate('dashboard.unlimited')
    : flowLabel(data.quota)
}

export function remainingLabel(data, translate) {
  return hasNumber(data.quota) && Number(data.quota) < 0
    ? translate('dashboard.unlimited')
    : flowLabel(data.residualFlow)
}

export function expiryDate(value) {
  if (value === null || value === undefined || value === '') return null
  const date = new Date(
    typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function dateLabel(value, locale) {
  const date = expiryDate(value)
  return date
    ? date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '—'
}
