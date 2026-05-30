import {
  doc,
  setDoc,
  addDoc,
  collection,
  updateDoc,
  serverTimestamp,
  getDocs,
  getDoc,
} from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '@/lib/firebase'
import type {
  BrandMeta,
  Mascot,
  Video,
  VideoFeedback,
  VideoStatus,
} from '@/types'

export interface SavedMascotCard {
  brandId: string
  mascotId: string
  name: string
  gender: string
  description?: string
  imagePrompt: string
  chosenImageUrl: string
  characterSheetUrl?: string
  createdAt: string
  status: string
}

export async function getMascots(uid: string): Promise<SavedMascotCard[]> {
  const brandsRef = collection(db, 'users', uid, 'brands')
  const brandsSnap = await getDocs(brandsRef)

  if (brandsSnap.empty) return []

  const allResults = await Promise.all(
    brandsSnap.docs.map(async (brandDoc) => {
      try {
        const mascotsRef = collection(db, 'users', uid, 'brands', brandDoc.id, 'mascots')
        const mascotsSnap = await getDocs(mascotsRef)

        const cards: SavedMascotCard[] = []
        for (const mascotDoc of mascotsSnap.docs) {
          const d = mascotDoc.data()
          if (d.status !== 'chosen') continue
          cards.push({
            brandId: brandDoc.id,
            mascotId: mascotDoc.id,
            name: d.name || 'Untitled Mascot',
            gender: d.gender || 'neutral',
            description: d.description,
            imagePrompt: d.imagePrompt || '',
            chosenImageUrl: d.chosenImageUrl || '',
            characterSheetUrl: d.characterSheet?.frontUrl,
            createdAt: d.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString(),
            status: d.status,
          })
        }
        return cards
      } catch (err) {
        console.error(`Failed to fetch mascots for brand ${brandDoc.id}:`, err)
        return []
      }
    }),
  )

  return allResults
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function saveBrand(
  uid: string,
  brandId: string,
  data: Omit<BrandMeta, 'id' | 'updatedAt'> & { brandbook: string },
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId)
  await setDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function saveMascot(
  uid: string,
  brandId: string,
  mascotId: string,
  data: Partial<Mascot>,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'mascots', mascotId)
  await setDoc(
    ref,
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function savePromptVersion(
  uid: string,
  brandId: string,
  prompt: string,
): Promise<string> {
  const colRef = collection(db, 'users', uid, 'brands', brandId, 'prompts')
  const docRef = await addDoc(colRef, {
    text: prompt,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateMascotChosen(
  uid: string,
  brandId: string,
  mascotId: string,
  chosenImageUrl: string,
  characterSheetUrl: string,
  mascotName?: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'mascots', mascotId)
  await updateDoc(ref, {
    chosenImageUrl,
    characterSheet: {
      frontUrl: characterSheetUrl,
      generatedAt: new Date().toISOString(),
    },
    status: 'chosen',
    ...(mascotName !== undefined && { name: mascotName }),
    updatedAt: serverTimestamp(),
  })
}

export async function saveUploadedMascot(
  uid: string,
  name: string,
  imageUrl: string,
): Promise<{ brandId: string; mascotId: string }> {
  const brandId = crypto.randomUUID()
  const mascotId = crypto.randomUUID()

  const brandRef = doc(db, 'users', uid, 'brands', brandId)
  await setDoc(brandRef, {
    companyName: 'Uploaded',
    source: 'upload',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  const mascotRef = doc(db, 'users', uid, 'brands', brandId, 'mascots', mascotId)
  await setDoc(mascotRef, {
    name: name || 'Uploaded Mascot',
    gender: 'neutral',
    chosenImageUrl: imageUrl,
    status: 'chosen',
    source: 'upload',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return { brandId, mascotId }
}

// ============================================================
// Videos
// ============================================================

export interface SavedVideoCard {
  id: string
  brandId: string
  mascotId: string
  mascotName: string
  mascotImageUrl: string
  templateId: string
  templateName: string
  status: VideoStatus
  currentClip: number
  totalClips: number
  finalVideoUrl: string | null
  pixverseCdnUrl: string | null
  thumbnailUrl: string | null
  duration: number
  liked: VideoFeedback
  partial: boolean
  createdAt: string
}

function videoDocToCard(
  brandId: string,
  videoId: string,
  d: Record<string, unknown>,
): SavedVideoCard {
  const createdAtIso =
    (d.createdAt as { toDate?: () => Date } | undefined)?.toDate?.()?.toISOString?.() ||
    (typeof d.createdAt === 'string' ? d.createdAt : new Date().toISOString())

  return {
    id: videoId,
    brandId,
    mascotId: (d.mascotId as string) || '',
    mascotName: (d.mascotName as string) || 'Mascot',
    mascotImageUrl: (d.mascotImageUrl as string) || '',
    templateId: (d.templateId as string) || '',
    templateName: (d.templateName as string) || 'Story',
    status: ((d.status as VideoStatus) || 'pending'),
    currentClip: typeof d.currentClip === 'number' ? d.currentClip : 0,
    totalClips: typeof d.totalClips === 'number' ? d.totalClips : 6,
    finalVideoUrl: (d.finalVideoUrl as string) ?? null,
    pixverseCdnUrl: (d.pixverseCdnUrl as string) ?? null,
    thumbnailUrl: (d.thumbnailUrl as string) ?? null,
    duration: typeof d.duration === 'number' ? d.duration : 0,
    liked: (d.liked as VideoFeedback) ?? null,
    partial: (d.partial as boolean) ?? false,
    createdAt: createdAtIso,
  }
}

/**
 * Create a fresh video doc in 'pending' status. Returns the new videoId.
 */
export async function createVideoDoc(
  uid: string,
  data: {
    brandId: string
    mascotId: string
    mascotName: string
    mascotImageUrl: string
    templateId: string
    templateName: string
    totalClips: number
  },
): Promise<string> {
  const videoId = crypto.randomUUID()
  const ref = doc(db, 'users', uid, 'brands', data.brandId, 'videos', videoId)

  const initial: Record<string, unknown> = {
    id: videoId,
    brandId: data.brandId,
    mascotId: data.mascotId,
    mascotName: data.mascotName,
    mascotImageUrl: data.mascotImageUrl,
    templateId: data.templateId,
    templateName: data.templateName,
    status: 'pending' satisfies VideoStatus,
    currentClip: 0,
    totalClips: data.totalClips,
    clipVideoIds: [],
    finalVideoUrl: null,
    pixverseCdnUrl: null,
    thumbnailUrl: null,
    duration: 0,
    liked: null,
    deleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  await setDoc(ref, initial)
  return videoId
}

export async function updateVideoProgress(
  uid: string,
  brandId: string,
  videoId: string,
  data: Partial<Pick<Video, 'status' | 'currentClip' | 'clipVideoIds'>>,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'videos', videoId)
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function finalizeVideo(
  uid: string,
  brandId: string,
  videoId: string,
  data: {
    finalVideoUrl: string | null
    pixverseCdnUrl: string | null
    thumbnailUrl: string | null
    duration: number
    clipVideoIds: string[]
    partial?: boolean
    errorMessage?: string
  },
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'videos', videoId)
  await updateDoc(ref, {
    finalVideoUrl: data.finalVideoUrl,
    pixverseCdnUrl: data.pixverseCdnUrl,
    thumbnailUrl: data.thumbnailUrl,
    duration: data.duration,
    clipVideoIds: data.clipVideoIds,
    status: data.partial ? 'failed' : 'done',
    partial: data.partial ?? false,
    ...(data.errorMessage ? { errorMessage: data.errorMessage } : {}),
    updatedAt: serverTimestamp(),
  })
}

export async function failVideo(
  uid: string,
  brandId: string,
  videoId: string,
  errorMessage: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'videos', videoId)
  await updateDoc(ref, {
    status: 'failed',
    errorMessage,
    updatedAt: serverTimestamp(),
  })
}

export async function setVideoFeedback(
  uid: string,
  brandId: string,
  videoId: string,
  liked: VideoFeedback,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'videos', videoId)
  await updateDoc(ref, {
    liked,
    updatedAt: serverTimestamp(),
  })
}

export async function softDeleteVideo(
  uid: string,
  brandId: string,
  videoId: string,
): Promise<void> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'videos', videoId)
  await updateDoc(ref, {
    deleted: true,
    updatedAt: serverTimestamp(),
  })
}

/**
 * Get all non-deleted videos across every brand the user owns.
 */
export async function getVideos(uid: string): Promise<SavedVideoCard[]> {
  const brandsRef = collection(db, 'users', uid, 'brands')
  const brandsSnap = await getDocs(brandsRef)
  if (brandsSnap.empty) return []

  const allResults = await Promise.all(
    brandsSnap.docs.map(async (brandDoc) => {
      try {
        const videosRef = collection(db, 'users', uid, 'brands', brandDoc.id, 'videos')
        const videosSnap = await getDocs(videosRef)

        const cards: SavedVideoCard[] = []
        for (const videoDoc of videosSnap.docs) {
          const d = videoDoc.data() as Record<string, unknown>
          if (d.deleted === true) continue
          cards.push(videoDocToCard(brandDoc.id, videoDoc.id, d))
        }
        return cards
      } catch (err) {
        console.error(`Failed to fetch videos for brand ${brandDoc.id}:`, err)
        return []
      }
    }),
  )

  return allResults
    .flat()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getVideoById(
  uid: string,
  brandId: string,
  videoId: string,
): Promise<SavedVideoCard | null> {
  const ref = doc(db, 'users', uid, 'brands', brandId, 'videos', videoId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const d = snap.data() as Record<string, unknown>
  if (d.deleted === true) return null
  return videoDocToCard(brandId, videoId, d)
}

export async function countActiveVideos(uid: string): Promise<number> {
  const videos = await getVideos(uid)
  return videos.length
}

/**
 * Download a public video URL and upload it to Firebase Storage as a backup.
 * Returns the new download URL.
 */
export async function uploadVideoBackup(
  uid: string,
  videoId: string,
  sourceUrl: string,
): Promise<string> {
  const res = await fetch(sourceUrl)
  if (!res.ok) {
    throw new Error(`Failed to fetch video for backup: ${res.status}`)
  }
  const blob = await res.blob()
  const path = `videos/${uid}/${videoId}.mp4`
  const ref = storageRef(storage, path)
  await uploadBytes(ref, blob, { contentType: blob.type || 'video/mp4' })
  return await getDownloadURL(ref)
}

