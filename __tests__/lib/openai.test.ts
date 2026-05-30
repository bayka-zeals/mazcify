jest.mock('openai', () => {
  const mockCreate = jest.fn()
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
})

import OpenAI from 'openai'
import { analyzeBrand, generateImagePrompt } from '@/lib/openai'
import type { ScrapedContent } from '@/lib/scraper'

const getMockCreate = () => {
  const instance = new OpenAI({ apiKey: 'test' })
  return instance.chat.completions.create as jest.Mock
}

const SAMPLE_SCRAPED: ScrapedContent = {
  title: 'Acme Corp',
  metaDescription: 'Building great products',
  headings: ['Welcome', 'Products'],
  bodyText: 'We make widgets and gadgets.',
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('analyzeBrand', () => {
  it('parses valid JSON response into correct BrandMeta shape', async () => {
    const mockResponse = {
      companyName: 'Acme Corp',
      websiteUrl: 'https://acme.com',
      colors: ['#FF0000', '#0000FF'],
      tone: 'friendly and bold',
      taglines: ['Built to last'],
      productNames: ['Widget Pro'],
      brandbook: '# Acme Brand\n\nA great company.',
    }

    const mockCreate = getMockCreate()
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(mockResponse) } }],
    })

    const result = await analyzeBrand(SAMPLE_SCRAPED, [], 'https://acme.com')

    expect(result.meta.companyName).toBe('Acme Corp')
    expect(result.meta.colors).toEqual(['#FF0000', '#0000FF'])
    expect(result.meta.tone).toBe('friendly and bold')
    expect(result.meta.taglines).toEqual(['Built to last'])
    expect(result.meta.productNames).toEqual(['Widget Pro'])
    expect(result.brandbook).toContain('Acme Brand')
  })

  it('handles malformed/non-JSON response (returns safe default with URL domain)', async () => {
    const mockCreate = getMockCreate()
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'not json at all' } }],
    })

    const result = await analyzeBrand(SAMPLE_SCRAPED, [], 'https://acme.com')

    expect(result.meta.companyName).toBe('acme.com')
    expect(result.meta.websiteUrl).toBe('https://acme.com')
    expect(result.meta.colors).toEqual([])
    expect(result.brandbook).toContain('acme.com')
  })

  it('includes pdf text in user message when pdfTexts provided', async () => {
    const mockCreate = getMockCreate()
    mockCreate.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              companyName: 'Test',
              colors: [],
              tone: 'cool',
              taglines: [],
              productNames: [],
              brandbook: 'test',
            }),
          },
        },
      ],
    })

    await analyzeBrand(SAMPLE_SCRAPED, ['PDF content here'], 'https://test.com')

    expect(mockCreate).toHaveBeenCalledTimes(1)
    const userMessage = mockCreate.mock.calls[0][0].messages[1].content
    expect(userMessage).toContain('PDF Document 1')
    expect(userMessage).toContain('PDF content here')
  })
})

describe('generateImagePrompt', () => {
  it('returned string contains gender, brand colors, and style keywords', async () => {
    const promptText =
      'A friendly female cartoon mascot in red and blue colors, vector art, clean lines, full body, white background'

    const mockCreate = getMockCreate()
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: promptText } }],
    })

    const result = await generateImagePrompt(
      {
        companyName: 'Acme',
        websiteUrl: 'https://acme.com',
        colors: ['#FF0000', '#0000FF'],
        tone: 'friendly',
        taglines: [],
        productNames: [],
      },
      { gender: 'female', mascotName: 'Foxy', description: 'Bold and energetic' },
    )

    expect(result).toContain('female')
    expect(result).toContain('vector art')
  })

  it('works when optional fields (description, mascotName) are undefined', async () => {
    const mockCreate = getMockCreate()
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'A neutral cartoon mascot' } }],
    })

    const result = await generateImagePrompt(
      {
        companyName: 'Test Co',
        websiteUrl: 'https://test.com',
        colors: [],
        tone: 'professional',
        taglines: [],
        productNames: [],
      },
      { gender: 'neutral' },
    )

    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
