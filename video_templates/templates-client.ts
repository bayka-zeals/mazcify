import type { VideoTemplate } from '@/types'

export interface VideoTemplateSummary {
  id: string
  name: string
  description: string
  thumbnail: string
  totalDuration: number
  clipCount: number
  clipPreviews: string[]
}

export function summarizeTemplate(template: VideoTemplate): VideoTemplateSummary {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    thumbnail: template.thumbnail,
    totalDuration: template.clips.reduce((sum, c) => sum + (c.duration ?? 5), 0),
    clipCount: template.clips.length,
    clipPreviews: template.clips
      .slice()
      .sort((a, b) => a.index - b.index)
      .map((c) => c.prompt),
  }
}
