jest.mock('@/lib/scraper', () => ({
  fetchAndParse: jest.fn(),
  extractPdfText: jest.fn(),
}))

jest.mock('@/lib/openai', () => ({
  analyzeBrand: jest.fn(),
  generateImagePrompt: jest.fn(),
}))

import { NextRequest } from 'next/server'
import { POST } from '@/app/api/scrape/route'
import { fetchAndParse, extractPdfText } from '@/lib/scraper'
import { analyzeBrand, generateImagePrompt } from '@/lib/openai'

const mockFetchAndParse = fetchAndParse as jest.Mock
const mockExtractPdfText = extractPdfText as jest.Mock
const mockAnalyzeBrand = analyzeBrand as jest.Mock
const mockGenerateImagePrompt = generateImagePrompt as jest.Mock

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/scrape', () => {
  it('returns 400 when url is missing', async () => {
    const res = await POST(
      makeRequest({ userId: 'u1', gender: 'male', currentMascotCount: 0 }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 429 when currentMascotCount >= 3', async () => {
    const res = await POST(
      makeRequest({
        userId: 'u1',
        url: 'https://example.com',
        gender: 'male',
        currentMascotCount: 3,
      }),
    )
    expect(res.status).toBe(429)
    const body = await res.json()
    expect(body.error).toContain('limit')
  })

  it('returns 200 with brandId, mascotId, brandbook, meta, imagePrompt on happy path', async () => {
    mockFetchAndParse.mockResolvedValueOnce({
      title: 'Acme',
      metaDescription: 'Test',
      headings: [],
      bodyText: 'text',
    })
    mockExtractPdfText.mockResolvedValue('')
    mockAnalyzeBrand.mockResolvedValueOnce({
      meta: {
        companyName: 'Acme',
        websiteUrl: 'https://acme.com',
        colors: ['#f00'],
        tone: 'bold',
        taglines: [],
        productNames: [],
      },
      brandbook: '# Acme',
    })
    mockGenerateImagePrompt.mockResolvedValueOnce('A bold mascot prompt')

    const res = await POST(
      makeRequest({
        userId: 'u1',
        url: 'https://acme.com',
        gender: 'neutral',
        currentMascotCount: 0,
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.brandId).toBeDefined()
    expect(body.mascotId).toBeDefined()
    expect(body.brandbook).toBe('# Acme')
    expect(body.meta.companyName).toBe('Acme')
    expect(body.imagePrompt).toBe('A bold mascot prompt')
  })

  it('returns 200 with fallback prompt when fetchAndParse returns empty content', async () => {
    mockFetchAndParse.mockResolvedValueOnce({
      title: '',
      metaDescription: '',
      headings: [],
      bodyText: '',
    })
    mockAnalyzeBrand.mockResolvedValueOnce({
      meta: {
        companyName: 'example.com',
        websiteUrl: 'https://example.com',
        colors: [],
        tone: 'professional',
        taglines: [],
        productNames: [],
      },
      brandbook: '# example.com',
    })
    mockGenerateImagePrompt.mockResolvedValueOnce('A fallback mascot')

    const res = await POST(
      makeRequest({
        userId: 'u1',
        url: 'https://example.com',
        gender: 'female',
        currentMascotCount: 0,
      }),
    )

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.imagePrompt).toBe('A fallback mascot')
  })

  it('returns 500 on unexpected OpenAI error', async () => {
    mockFetchAndParse.mockResolvedValueOnce({
      title: 'Test',
      metaDescription: '',
      headings: [],
      bodyText: '',
    })
    mockAnalyzeBrand.mockRejectedValueOnce(new Error('OpenAI API down'))

    const res = await POST(
      makeRequest({
        userId: 'u1',
        url: 'https://example.com',
        gender: 'male',
        currentMascotCount: 0,
      }),
    )

    expect(res.status).toBe(500)
  })
})
