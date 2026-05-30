import type { PromptTemplate } from '@/types'

/**
 * Mascot reference anchor — used at the top of every clip prompt to lock
 * identity from the hero image passed via --image. PixVerse I2V reads the
 * reference image for visual identity; this text reinforces consistency.
 */
const CHAR_ANCHOR =
  'Same mascot character from the reference image — keep the exact colors, proportions, face, body shape, clothing, accessories, and materials perfectly consistent throughout.'

const STYLE_CLOSE =
  'Style: premium 3D animated feature quality, soft matte toy-like materials, clean rounded forms, cinematic lighting with soft shadows, smooth camera movement, expressive character acting, polished commercial animation. No text, no logos, no extra characters, no distorted proportions, no flickering, no photorealistic textures.'

export const MASCOT_INTRO_30S: PromptTemplate = {
  id: 'mascot-intro-30s',
  name: 'Mascot Brand Intro (30s)',
  clips: [
    {
      clipIndex: 0,
      description: 'The Spark — mascot materializes from particles of light',
      prompt: [
        `A still silhouette of the mascot character stands alone in the center of a dark minimal void,`,
        `barely visible against a deep dark background with soft ambient light.`,
        `${CHAR_ANCHOR}`,
        `A single bright spark ignites at the character's chest and rapidly spreads outward — glowing particles`,
        `cascade across the body revealing full color, texture, and detail from the center out. The mascot's eyes`,
        `light up last with a warm confident glow. As the reveal completes, the character takes a first breath,`,
        `shoulders rising gently, head tilting slightly upward with curiosity. Tiny luminous particles drift away`,
        `from the body like embers. The camera starts on a tight close-up of the dark silhouette chest, then slowly`,
        `pulls back as the light reveal expands, ending on a clean medium full-body shot. The background transitions`,
        `from pure dark to a subtle soft gradient glow behind the character.`,
        ``,
        STYLE_CLOSE,
      ].join(' '),
    },
    {
      clipIndex: 1,
      description: 'The World — mascot discovers a digital landscape',
      prompt: [
        `The mascot character stands on a sleek reflective surface in a vast open digital space,`,
        `looking around with wide curious eyes and alert ears.`,
        `${CHAR_ANCHOR}`,
        `Soft glowing grid lines extend across the floor in all directions, pulsing gently with light.`,
        `Floating translucent UI fragments — rounded rectangles, circles, chat bubble shapes — drift slowly`,
        `through the air at various heights like digital fireflies. The mascot turns its head left, then right,`,
        `tracking the floating elements with genuine curiosity. One paw reaches out tentatively toward the nearest`,
        `floating shape. The camera orbits slowly around the character in a smooth 180-degree arc at eye level,`,
        `revealing the depth of the digital space. Soft blue and teal ambient light reflects off the floor.`,
        `The mood is wonder and discovery — a character entering its world for the first time.`,
        ``,
        STYLE_CLOSE,
      ].join(' '),
    },
    {
      clipIndex: 2,
      description: 'The Challenge — disconnected messages float past, ignored',
      prompt: [
        `The mascot character stands in the center of the digital space, watching as dozens of small`,
        `gray chat bubble shapes float past in random directions — scattered, disconnected, fading out.`,
        `${CHAR_ANCHOR}`,
        `The floating chat bubbles are dull and lifeless, drifting apart from each other, some flickering`,
        `and dissolving into particles before reaching anyone. The mascot watches with a concerned expression,`,
        `brow furrowed slightly, ears dropping for a moment. Then its expression shifts — eyes narrow with`,
        `determination, a small confident smirk forms. The character plants its feet firmly, squares its`,
        `shoulders, and raises both paws to chest height, ready to act. The camera pushes in from a wide shot`,
        `to a medium close-up as the mascot's expression changes from concern to determination. The gray`,
        `bubbles continue drifting past in the background, creating urgency. A subtle warm glow begins to`,
        `emanate from the character's paws.`,
        ``,
        STYLE_CLOSE,
      ].join(' '),
    },
    {
      clipIndex: 3,
      description: 'The Action — mascot catches and connects the chat bubbles',
      prompt: [
        `The mascot character thrusts both paws forward with confident energy, sending a wave of warm`,
        `golden light radiating outward from its body across the digital space.`,
        `${CHAR_ANCHOR}`,
        `The golden wave catches the drifting gray chat bubbles and instantly transforms them — each bubble`,
        `lights up with vibrant color, glowing bright with warm energy. The newly colored bubbles begin orbiting`,
        `the mascot and connecting to each other with thin luminous threads of light, forming a beautiful`,
        `constellation of linked conversations. The mascot moves dynamically — reaching left to catch a stray`,
        `bubble, spinning to redirect another, guiding them into formation with expressive paw gestures like a`,
        `conductor. The character is in motion throughout: stepping, reaching, spinning with athletic grace and`,
        `playful energy. The camera tracks the action in a dynamic low-angle shot, following the mascot's`,
        `movement. The floor ripples with warm light at each footstep. The mood shifts to excitement and momentum.`,
        ``,
        STYLE_CLOSE,
      ].join(' '),
    },
    {
      clipIndex: 4,
      description: 'The Transformation — world blooms with color and energy',
      prompt: [
        `The connected chat bubble constellation expands rapidly outward from the mascot character,`,
        `transforming the entire digital space from cool minimal to warm and vibrant.`,
        `${CHAR_ANCHOR}`,
        `Waves of color cascade across the floor — the grid lines shift from cool blue to warm gold and the`,
        `reflective surface blooms with soft light. Hundreds of glowing chat bubbles now orbit in organized`,
        `flowing streams around the character, connected by threads of light forming a beautiful network that`,
        `fills the space. The mascot rises slightly off the ground, lifted by the energy below, arms spread wide,`,
        `head tilted back, eyes glowing, expression pure joy. Luminous particles spiral upward around the`,
        `character like a vortex of warm sparks. The camera pulls back rapidly in a dramatic wide reveal — dolly`,
        `zoom starting tight on the mascot's joyful face and pulling all the way out to show the fully transformed`,
        `vibrant world with the small character at its radiant center. The peak emotional moment of the story.`,
        ``,
        STYLE_CLOSE,
      ].join(' '),
    },
    {
      clipIndex: 5,
      description: 'The Hero — mascot lands in confident brand pose, world settles',
      prompt: [
        `The mascot character descends gently back to the ground, landing with a soft confident step.`,
        `The energy settles into a calm, powerful, radiant stillness.`,
        `${CHAR_ANCHOR}`,
        `The character stands tall in a clean hero pose — weight on one leg, slight confident lean, one paw`,
        `on hip, the other relaxed at its side. Warm confident closed-mouth smile, eyes looking directly into`,
        `camera with friendly authority. The connected chat bubble network continues glowing softly in the`,
        `background, now settled into a beautiful ambient pattern like a constellation. The warm particles`,
        `slowly drift downward and fade. The floor reflects the character cleanly. The lighting shifts to a`,
        `single clean key light from above-left, softly illuminating the mascot as the background dims to a`,
        `clean subtle gradient. The camera slowly pushes in from a full-body medium shot to a clean waist-up`,
        `framing, ending on the mascot's confident direct gaze. The final frame is a polished, centered,`,
        `brand-ready hero shot — clean background, perfect lighting, the mascot owning the frame.`,
        ``,
        STYLE_CLOSE,
      ].join(' '),
    },
  ],
}

export const ALL_TEMPLATES: PromptTemplate[] = [MASCOT_INTRO_30S]

export function getTemplate(id: string): PromptTemplate | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id)
}
