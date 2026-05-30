import OpenAI from 'openai'
import { getServerEnv } from '@/config/env'
import type { ScrapedContent } from './scraper'
import type { BrandMeta } from '@/types'

type BrandAnalysis = Omit<BrandMeta, 'id' | 'updatedAt'>

let _client: OpenAI | null = null
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: getServerEnv().OPENAI_API_KEY })
  }
  return _client
}

function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export async function analyzeBrand(
  scraped: ScrapedContent,
  pdfTexts: string[],
  url: string,
): Promise<{ meta: BrandAnalysis; brandbook: string }> {
  const client = getClient()

  const contentParts = [
    `Website URL: ${url}`,
    scraped.title && `Title: ${scraped.title}`,
    scraped.metaDescription && `Meta Description: ${scraped.metaDescription}`,
    scraped.headings.length > 0 &&
      `Headings:\n${scraped.headings.join('\n')}`,
    scraped.bodyText && `Body Text:\n${scraped.bodyText}`,
    ...pdfTexts
      .filter(Boolean)
      .map((t, i) => `PDF Document ${i + 1}:\n${t}`),
  ]
    .filter(Boolean)
    .join('\n\n')

  const systemPrompt = `You are a brand analyst. Analyze the provided website content and extract brand information.
Return a JSON object with these exact fields:
- companyName (string): the company or brand name
- websiteUrl (string): the website URL provided
- colors (string[]): brand colors as hex codes if identifiable, otherwise descriptive names
- tone (string): brand voice/tone in 2-3 words (e.g. "friendly and professional")
- taglines (string[]): any taglines or slogans found
- productNames (string[]): key products or services
- brandbook (string): a concise markdown brand summary (3-5 paragraphs) covering identity, values, visual style, and target audience

If the website content is empty or minimal, infer what you can from the URL domain and provide reasonable defaults.`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: contentParts },
      ],
      temperature: 0.4,
      max_tokens: 2000,
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw)

    const meta: BrandAnalysis = {
      companyName: parsed.companyName || domainFromUrl(url),
      websiteUrl: url,
      colors: Array.isArray(parsed.colors) ? parsed.colors : [],
      tone: parsed.tone || 'professional',
      taglines: Array.isArray(parsed.taglines) ? parsed.taglines : [],
      productNames: Array.isArray(parsed.productNames)
        ? parsed.productNames
        : [],
    }

    return {
      meta,
      brandbook: parsed.brandbook || `# ${meta.companyName}\n\nBrand analysis pending.`,
    }
  } catch {
    const fallbackName = domainFromUrl(url)
    return {
      meta: {
        companyName: fallbackName,
        websiteUrl: url,
        colors: [],
        tone: 'professional',
        taglines: [],
        productNames: [],
      },
      brandbook: `# ${fallbackName}\n\nUnable to analyze brand. Please provide more information.`,
    }
  }
}

export async function generateImagePrompt(
  meta: BrandAnalysis,
  params: { gender: string; description?: string; mascotName?: string },
): Promise<string> {
  const client = getClient()

  const systemPrompt = `You are a mascot prompt director for GPT Image 2. You produce a single text-to-image prompt that generates a high-quality animal mascot character from a brand description.

PROMPT STRUCTURE (follow this three-paragraph format exactly):

Paragraph 1 — Style + Character:
Open with the style register sentence. Then describe the animal mascot: species, proportions (head-to-body ratio, limb thickness), fur/feather/scale colors mapped to brand palette, face (eye size, expression, mouth), pose (stance, gesture, body language), and any props or clothing that reflect the brand.

Paragraph 2 — Composition:
"Full body character centered in frame against a pure solid white (#FFFFFF) background — no gradient, no texture, no environment, no shadow except a subtle drop shadow directly beneath the character's feet. Clean readable silhouette. The character should work as a standalone brand asset — simple enough to recognize at icon size, detailed enough to hold up at poster size."

Paragraph 3 — Quality close:
"High-quality 3D rendered character with soft matte materials, subtle ambient occlusion, clean global illumination, no harsh shadows. Surfaces read as premium toy-quality — smooth, tactile, slightly rounded edges. Consistent soft studio lighting from above-left. No specular hotspots, no reflective surfaces, no photorealistic textures. Render quality of a modern animation studio character sheet — clean, professional, brand-ready."

RULES:
- Front-load the style in the very first sentence
- Be specific on proportions (e.g. "large head relative to body, roughly 1:2.5 head-to-body ratio")
- Map brand colors onto the character naturally (fur, clothing, accent elements)
- No brand names, no text/lettering on the character, no logos
- Keep the prompt 150–350 words total
- Return ONLY the prompt text, nothing else

EXAMPLE OUTPUT (for a social chat commerce brand, tone: conversational and smart, colors: orange and teal):

Clean 3D rendered character, minimal geometric shapes, soft matte materials. A fox mascot character for a social chat commerce brand. Compact friendly proportions — large head relative to body (roughly 1:2.5 head-to-body ratio), short rounded limbs, slightly oversized paws. Warm orange fur across the body with a clean white chest patch extending from chin to belly and white-tipped tail. Soft teal minimal collar around the neck as the single accent element. Large expressive amber eyes with a warm confident sparkle, small black nose, friendly closed-mouth smile with a slight head tilt to the right suggesting active listening. Standing upright on two legs in a relaxed welcoming pose — weight centered, right paw raised in a small open-palm wave, left paw relaxed at the side. Ears perked forward attentively. Tail curled gently behind with a natural soft arc.

Full body character centered in frame against a pure solid white (#FFFFFF) background — no gradient, no texture, no environment, no shadow except a subtle drop shadow directly beneath the character's feet. Clean readable silhouette. The character should work as a standalone brand asset — simple enough to recognize at icon size, detailed enough to hold up at poster size.

High-quality 3D rendered character with soft matte materials, subtle ambient occlusion, clean global illumination, no harsh shadows. Surfaces read as premium toy-quality — smooth, tactile, slightly rounded edges. Consistent soft studio lighting from above-left. No specular hotspots, no reflective surfaces, no photorealistic textures. Render quality of a modern animation studio character sheet — clean, professional, brand-ready.`

  const userContent = [
    `Brand: ${meta.companyName}`,
    meta.colors.length > 0 && `Brand Colors: ${meta.colors.join(', ')}`,
    `Tone: ${meta.tone}`,
    `Gender: ${params.gender}`,
    params.mascotName && `Character Name: ${params.mascotName}`,
    params.description && `Character Description: ${params.description}`,
  ]
    .filter(Boolean)
    .join('\n')

  const completion = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: 0.7,
    max_tokens: 500,
  })

  return completion.choices[0]?.message?.content?.trim() ?? ''
}
