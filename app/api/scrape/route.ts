import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { fetchAndParse, extractPdfText } from '@/lib/scraper'
import { analyzeBrand, generateImagePrompt } from '@/lib/openai'
import { PLAN_LIMITS, isAdmin } from '@/config/constants'

const ScrapeBodySchema = z.object({
  userId: z.string().min(1),
  url: z.string().url(),
  mascotName: z.string().optional(),
  description: z.string().optional(),
  gender: z.enum(['male', 'female', 'neutral']),
  assetStorageUrls: z.array(z.string().url()).optional(),
  currentMascotCount: z.number().int().min(0),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = ScrapeBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { userId, url, mascotName, description, gender, assetStorageUrls, currentMascotCount } =
      parsed.data

    const mascotLimit = PLAN_LIMITS.free.mascotsMax
    if (!isAdmin(userId) && currentMascotCount >= mascotLimit) {
      return NextResponse.json(
        {
          error: 'Mascot limit reached',
          code: 'limit_reached',
          message: `You've reached your free plan limit of ${mascotLimit} mascot${mascotLimit === 1 ? '' : 's'}. Delete an existing mascot first.`,
        },
        { status: 402 }
      )
    }

    const scraped = await fetchAndParse(url)

    const pdfUrls = (assetStorageUrls ?? []).filter((u) => u.toLowerCase().endsWith('.pdf'))
    const pdfTexts = await Promise.all(pdfUrls.map(extractPdfText))

    const { meta, brandbook } = await analyzeBrand(scraped, pdfTexts, url)

    const imagePrompt = await generateImagePrompt(meta, {
      gender,
      description,
      mascotName,
    })

    const brandId = crypto.randomUUID()
    const mascotId = crypto.randomUUID()

    return NextResponse.json({
      brandId,
      mascotId,
      brandbook,
      meta,
      imagePrompt,
    })
  } catch (err) {
    console.error('[POST /api/scrape]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
