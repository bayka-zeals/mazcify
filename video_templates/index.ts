import 'server-only'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import type { VideoTemplate } from '@/types'

const PROMPTS_DIR = join(process.cwd(), 'video_templates', 'prompts')

let cachedTemplates: VideoTemplate[] | null = null

function loadTemplatesFromDisk(): VideoTemplate[] {
  let entries: string[]
  try {
    entries = readdirSync(PROMPTS_DIR)
  } catch (err) {
    console.error('[video_templates] Failed to read prompts directory:', err)
    return []
  }

  const templates: VideoTemplate[] = []

  for (const entry of entries) {
    const entryPath = join(PROMPTS_DIR, entry)
    let isDir = false
    try {
      isDir = statSync(entryPath).isDirectory()
    } catch {
      continue
    }
    if (!isDir) continue

    const filePath = join(entryPath, 'template.json')
    try {
      const raw = readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(raw) as VideoTemplate
      if (!parsed.id || !parsed.name || !Array.isArray(parsed.clips)) {
        console.warn(`[video_templates] Skipping malformed template at ${filePath}`)
        continue
      }
      templates.push(parsed)
    } catch (err) {
      console.warn(`[video_templates] Failed to load ${filePath}:`, err)
    }
  }

  templates.sort((a, b) => a.name.localeCompare(b.name))
  return templates
}

export function getVideoTemplates(): VideoTemplate[] {
  if (!cachedTemplates) {
    cachedTemplates = loadTemplatesFromDisk()
  }
  return cachedTemplates
}

export function getVideoTemplateById(id: string): VideoTemplate | null {
  return getVideoTemplates().find((t) => t.id === id) ?? null
}

export function clearVideoTemplateCache() {
  cachedTemplates = null
}

/**
 * Inject mascot description into a template's clip prompts, replacing
 * the {mascot_description} placeholder.
 */
export function resolveTemplatePrompts(
  template: VideoTemplate,
  mascotDescription: string,
): VideoTemplate {
  const safeDesc =
    mascotDescription && mascotDescription.trim().length > 0
      ? mascotDescription.trim()
      : 'the mascot character'

  return {
    ...template,
    clips: template.clips.map((c) => ({
      ...c,
      prompt: c.prompt.replace(/\{mascot_description\}/g, safeDesc),
    })),
  }
}
