// Bytes go to AsyncStorage because camera and picker paths can both be cleared.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Images } from 'react-native-nitro-image';

import type { PickedImage } from '@/types/image';

import { decodeBase64, encodeBase64 } from '../base64';

import type { PersistedPhoto } from '../types';

// Detail past this adds upload seconds on a rural connection and nothing to the diagnosis.
const MAX_EDGE = 1024;

/** Storage quality. Chosen with MAX_EDGE to land a photo around 100-180KB. */
const STORE_QUALITY = 60;

// Higher than STORE_QUALITY so re-encoding already-lossy bytes shows no second generation.
const RESTORE_QUALITY = 92;

const PHOTO_KEY_PREFIX = 'wk.queue.photo.';

const photoKey = (localId: string) => `${PHOTO_KEY_PREFIX}${localId}`;

/** Nitro takes filesystem paths; RN hands out URLs. The prefix has to come off. */
const toNativePath = (uri: string) => uri.replace(/^file:\/\//, '');

/** Longest edge to MAX_EDGE, preserving aspect. Never enlarges a small photo. */
function targetSize(width: number, height: number) {
  const longest = Math.max(width, height);
  if (longest <= MAX_EDGE) {
    return { width, height };
  }
  const scale = MAX_EDGE / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/** Own key rather than inline, so reading the queue does not pull every photo into memory. */
export async function persistPhoto(localId: string, photo: PickedImage): Promise<void> {
  const source = await Images.loadFromFileAsync(toNativePath(photo.uri));
  const size = targetSize(source.width, source.height);

  const sized =
    size.width === source.width && size.height === source.height
      ? source
      : await source.resizeAsync(size.width, size.height);

  const encoded = await sized.toEncodedImageDataAsync('jpg', STORE_QUALITY);

  const stored: PersistedPhoto = {
    base64: encodeBase64(encoded.buffer),
    width: encoded.width,
    height: encoded.height,
  };

  await AsyncStorage.setItem(photoKey(localId), JSON.stringify(stored));
}

/** Bytes back to a temp file for FormData. Null means gone, which the queue treats as fatal. */
export async function restorePhoto(localId: string): Promise<PickedImage | null> {
  const raw = await AsyncStorage.getItem(photoKey(localId));
  if (!raw) {
    return null;
  }

  const stored = JSON.parse(raw) as PersistedPhoto;
  const image = await Images.loadFromEncodedImageDataAsync({
    buffer: decodeBase64(stored.base64),
    width: stored.width,
    height: stored.height,
    imageFormat: 'jpg',
  });

  const path = await image.saveToTemporaryFileAsync('jpg', RESTORE_QUALITY);

  return {
    uri: `file://${path}`,
    type: 'image/jpeg',
    fileName: `${localId}.jpg`,
  };
}

/** Data URI for thumbnails, skipping the Nitro decode and temp file `restorePhoto` needs. */
export async function readPhotoDataUri(localId: string): Promise<string | null> {
  const raw = await AsyncStorage.getItem(photoKey(localId));
  if (!raw) {
    return null;
  }

  const stored = JSON.parse(raw) as PersistedPhoto;
  return `data:image/jpeg;base64,${stored.base64}`;
}

export async function removePhoto(localId: string): Promise<void> {
  await AsyncStorage.removeItem(photoKey(localId));
}

/** Drops photos whose queue entry is gone, e.g. after a crash between two writes. */
export async function pruneOrphanedPhotos(liveIds: readonly string[]): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const live = new Set(liveIds.map(photoKey));
  const orphans = keys.filter(key => key.startsWith(PHOTO_KEY_PREFIX) && !live.has(key));

  if (orphans.length > 0) {
    await AsyncStorage.removeMany(orphans);
  }
}
