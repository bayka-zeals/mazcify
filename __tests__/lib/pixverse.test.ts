jest.mock('child_process', () => ({
  execFile: jest.fn(),
}))

import { execFile } from 'child_process'
import {
  generateImages,
  generateCharacterSheet,
  PixVerseError,
} from '@/lib/pixverse'

const mockExecFile = execFile as unknown as jest.Mock

beforeEach(() => {
  mockExecFile.mockReset()
})

function mockCliSuccess(result: Record<string, unknown>) {
  mockExecFile.mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
      cb(null, JSON.stringify(result), '')
    },
  )
}

function mockCliFailure(message: string) {
  mockExecFile.mockImplementation(
    (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
      cb(new Error(message), '', message)
    },
  )
}

describe('generateImages', () => {
  it('submits 3 parallel jobs and returns 3 MascotVariation items', async () => {
    let callNum = 0
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
        callNum++
        cb(
          null,
          JSON.stringify({
            image_id: 1000 + callNum,
            status: 'completed',
            image_url: `https://media.pixverse.ai/img${callNum}.jpg`,
            prompt: 'test prompt',
            model: 'qwen-image',
          }),
          '',
        )
      },
    )

    const result = await generateImages('test prompt', 3)

    expect(result).toHaveLength(3)
    result.forEach((v) => {
      expect(v.id).toBeDefined()
      expect(v.imageUrl).toContain('pixverse.ai')
      expect(v.prompt).toBe('test prompt')
    })
    expect(mockExecFile).toHaveBeenCalledTimes(3)
  })

  it('throws PixVerseError when CLI fails', async () => {
    mockCliFailure('Generation failed: insufficient credits')

    await expect(generateImages('test', 1)).rejects.toThrow(PixVerseError)
  })

  it('throws when CLI returns invalid JSON', async () => {
    mockExecFile.mockImplementation(
      (_cmd: string, _args: string[], _opts: unknown, cb: Function) => {
        cb(null, 'not json', '')
      },
    )

    await expect(generateImages('test', 1)).rejects.toThrow(/parse/)
  })
})

describe('generateCharacterSheet', () => {
  it('returns imageId and url on success with first model', async () => {
    mockCliSuccess({
      image_id: 999,
      status: 'completed',
      image_url: 'https://media.pixverse.ai/sheet.jpg',
      prompt: 'test',
      model: 'gpt-image-2.0',
    })

    const result = await generateCharacterSheet(
      'https://example.com/mascot.png',
      { mascotName: 'Foxy', gender: 'female', description: 'Friendly fox' },
    )

    expect(result.imageId).toBe(999)
    expect(result.url).toBe('https://media.pixverse.ai/sheet.jpg')
  })

  it('tries gpt-image-2.0 first; on failure falls through to gemini-3.1-flash', async () => {
    const modelsUsed: string[] = []
    mockExecFile.mockImplementation(
      (_cmd: string, args: string[], _opts: unknown, cb: Function) => {
        const modelIdx = args.indexOf('--model')
        const model = modelIdx >= 0 ? args[modelIdx + 1] : 'unknown'
        modelsUsed.push(model)

        if (model === 'gpt-image-2.0') {
          cb(new Error('model failed'), '', 'Generation failed')
          return
        }
        cb(
          null,
          JSON.stringify({
            image_id: 201,
            status: 'completed',
            image_url: 'https://media.pixverse.ai/sheet2.jpg',
            prompt: 'test',
            model,
          }),
          '',
        )
      },
    )

    const result = await generateCharacterSheet(
      'https://example.com/mascot.png',
      { mascotName: 'Foxy', gender: 'female' },
    )

    expect(modelsUsed).toContain('gpt-image-2.0')
    expect(modelsUsed).toContain('gemini-3.1-flash')
    expect(result.url).toBe('https://media.pixverse.ai/sheet2.jpg')
  })

  it('throws when all models fail', async () => {
    mockCliFailure('All models exhausted')

    await expect(
      generateCharacterSheet('https://example.com/mascot.png', {
        gender: 'male',
      }),
    ).rejects.toThrow()
  })
})
