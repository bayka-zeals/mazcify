import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { generateImages, generateCharacterSheet } from '@/lib/pixverse'

const PostBodySchema = z.object({
  userId: z.string().min(1),
  brandId: z.string().min(1),
  mascotId: z.string().min(1),
  imagePrompt: z.string().min(1),
})

const PatchBodySchema = z.object({
  userId: z.string().min(1),
  brandId: z.string().min(1),
  mascotId: z.string().min(1),
  chosenVariationId: z.string().min(1),
  chosenImageUrl: z.string().url(),
  mascotName: z.string().optional(),
  gender: z.enum(['male', 'female', 'neutral']),
  description: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = PostBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { imagePrompt } = parsed.data

    const variations = await generateImages(imagePrompt, 3)

    return NextResponse.json({ variations })
  } catch (err) {
    console.error('[POST /api/mascot]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = PatchBodySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { chosenImageUrl, mascotName, gender, description } = parsed.data

    const result = await generateCharacterSheet(chosenImageUrl, {
      mascotName,
      gender,
      description,
    })

    return NextResponse.json({
      characterSheetUrl: result.url,
      characterSheetImageId: String(result.imageId),
    })
  } catch (err) {
    console.error('[PATCH /api/mascot]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
