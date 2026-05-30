import * as cheerio from 'cheerio'
import { PDFParse } from 'pdf-parse'

export interface ScrapedContent {
  title: string
  metaDescription: string
  headings: string[]
  bodyText: string
}

const BODY_TEXT_LIMIT = 4_000
const PDF_TEXT_LIMIT = 3_000
const FETCH_TIMEOUT_MS = 8_000

const EMPTY_CONTENT: ScrapedContent = {
  title: '',
  metaDescription: '',
  headings: [],
  bodyText: '',
}

export async function fetchAndParse(url: string): Promise<ScrapedContent> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; Mazcify/1.0; +https://mazcify.com)',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return EMPTY_CONTENT

    const html = await res.text()
    const $ = cheerio.load(html)

    $('script, style, noscript').remove()

    const title = $('title').first().text().trim()
    const metaDescription =
      $('meta[name="description"]').attr('content')?.trim() ?? ''

    const headings: string[] = []
    $('h1, h2, h3').each((_, el) => {
      const text = $(el).text().trim()
      if (text) headings.push(text)
    })

    const bodyText = ($('body').text() ?? '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, BODY_TEXT_LIMIT)

    return { title, metaDescription, headings, bodyText }
  } catch {
    return EMPTY_CONTENT
  }
}

export async function extractPdfText(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    if (!res.ok) return ''
    const buffer = Buffer.from(await res.arrayBuffer())
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    return result.text.slice(0, PDF_TEXT_LIMIT)
  } catch {
    return ''
  }
}
