import { mockDeep } from 'jest-mock-extended'

export const createMockResponse = (
  ok: boolean = true,
  status: number = 200,
  body: string = '',
  jsonData: any = null,
  headers: [string, string][] = [],
) => {
  const mock = mockDeep<Response>()
  Object.defineProperty(mock, 'ok', { value: ok, writable: true })
  Object.defineProperty(mock, 'status', { value: status, writable: true })
  Object.defineProperty(mock, 'statusText', { value: ok ? 'OK' : 'Error', writable: true })
  Object.defineProperty(mock, 'redirected', { value: false, writable: true })
  Object.defineProperty(mock, 'type', { value: 'basic', writable: true })
  Object.defineProperty(mock, 'url', { value: 'https://example.com', writable: true })
  Object.defineProperty(mock, 'bodyUsed', { value: false, writable: true })
  mock.headers.entries.mockReturnValue(headers[Symbol.iterator]() as any)
  mock.text.mockResolvedValue(body)
  mock.json.mockResolvedValue(jsonData)
  mock.clone.mockReturnValue({
    text: () => Promise.resolve(body),
    json: () => Promise.resolve(jsonData),
  } as any)
  return mock
}

export const mockSuccessResponse = createMockResponse(
  true,
  200,
  '',
  null,
  [],
)

export const mockJsonResponse = createMockResponse(
  true,
  200,
  '',
  { success: true },
  [['content-type', 'application/json']],
)

export const mockErrorResponse = createMockResponse(
  false,
  500,
  '',
  null,
  [],
)
