export function isExternalLink(link: string): boolean {
  return /^https?:\/\//i.test(link)
}
