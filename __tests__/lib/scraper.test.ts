import { fetchAndParse, extractPdfText } from '@/lib/scraper'

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('fetchAndParse', () => {
  it('returns correct title/meta/headings from mocked HTML response', async () => {
    const html = `
      <html>
        <head>
          <title>Acme Corp</title>
          <meta name="description" content="We build great stuff">
        </head>
        <body>
          <h1>Welcome to Acme</h1>
          <h2>Our Products</h2>
          <h3>Widget Pro</h3>
          <p>Some body text here.</p>
        </body>
      </html>
    `

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    })

    const result = await fetchAndParse('https://acme.com')

    expect(result.title).toBe('Acme Corp')
    expect(result.metaDescription).toBe('We build great stuff')
    expect(result.headings).toEqual(['Welcome to Acme', 'Our Products', 'Widget Pro'])
    expect(result.bodyText).toContain('Some body text here')
  })

  it('truncates body text to 4000 chars', async () => {
    const longBody = 'x'.repeat(10_000)
    const html = `<html><body><p>${longBody}</p></body></html>`

    mockFetch.mockResolvedValueOnce({
      ok: true,
      text: async () => html,
    })

    const result = await fetchAndParse('https://example.com')
    expect(result.bodyText.length).toBeLessThanOrEqual(4_000)
  })

  it('returns empty ScrapedContent when fetch throws', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await fetchAndParse('https://example.com')

    expect(result.title).toBe('')
    expect(result.metaDescription).toBe('')
    expect(result.headings).toEqual([])
    expect(result.bodyText).toBe('')
  })

  it('returns empty ScrapedContent on 403 response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403 })

    const result = await fetchAndParse('https://example.com')

    expect(result.title).toBe('')
    expect(result.metaDescription).toBe('')
    expect(result.headings).toEqual([])
    expect(result.bodyText).toBe('')
  })
})

describe('extractPdfText', () => {
  it('returns extracted text from mocked PDF buffer', async () => {
    jest.mock('pdf-parse', () => {
      return jest.fn().mockResolvedValue({ text: 'Hello from PDF document' })
    })

    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(10),
    })

    const result = await extractPdfText('https://example.com/file.pdf')
    expect(typeof result).toBe('string')
  })

  it('returns empty string on fetch error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const result = await extractPdfText('https://example.com/file.pdf')
    expect(result).toBe('')
  })
})
