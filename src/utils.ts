export function parseQRZResponse(response: string): Record<string, string> {
  return response
    .split('&')
    .reduce((acc, pair) => {
      const [key, value] = pair.split('=')
      const camelKey = key.toLowerCase()
        .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      acc[camelKey] = decodeURIComponent(value)
      return acc
    }, {} as Record<string, string>)
}