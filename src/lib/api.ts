const TOKEN_KEY = 'nambo-token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit & { formData?: FormData } = {},
): Promise<T> {
  const { formData, headers: initHeaders, body: initBody, ...rest } = options
  const headers = new Headers(initHeaders || {})
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let body: BodyInit | null | undefined = initBody
  if (formData) {
    body = formData
    // Let the browser set multipart boundary — do not set Content-Type manually
    headers.delete('Content-Type')
  } else if (body && !(body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const res = await fetch(path, { ...rest, headers, body })
  const data = await res.json().catch(() => ({} as { error?: string }))
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (data as { error?: string }).error || res.statusText || 'Request failed',
    )
  }
  return data as T
}
