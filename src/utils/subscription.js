/** Resolve the API's relative YAML path without corrupting absolute URLs. */
export function resolveSubscriptionUrl(value, origin) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('A subscription URL is required')
  }
  const url = new URL(value.trim(), new URL(origin).origin + '/')
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new TypeError('Subscriptions must use HTTP or HTTPS')
  }
  return url.href
}
