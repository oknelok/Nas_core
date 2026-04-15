/** Server-side only — never import in client components */
export function getDrupalBaseUrl(): string {
  const url = process.env.DRUPAL_BASE_URL
  if (!url) throw new Error('DRUPAL_BASE_URL environment variable is not set')
  return url.replace(/\/$/, '')
}
