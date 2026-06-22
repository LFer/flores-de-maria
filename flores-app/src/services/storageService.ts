// Storage service — uploads receipt/comprobante images to Firebase Storage.
// Firebase-backed when configured; in the mock it just echoes the local URI so
// the UI can still preview the picked image.
import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseService';
import { authService } from './authService';

function fileExtensionFromMimeType(mimeType?: string): string {
  if (!mimeType) return 'jpg';
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/jpg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic') return 'heic';
  if (mimeType === 'image/heif') return 'heif';
  if (mimeType === 'image/gif') return 'gif';
  return mimeType.split('/')[1]?.replace(/[^a-z0-9]+/gi, '') || 'jpg';
}

export const storageService = {
  /** Upload a comprobante image and return its download URL. */
  async uploadComprobante(localUri: string, mimeType?: string): Promise<string> {
    if (isFirebaseConfigured && storage) {
      const uid = authService.currentUserId();
      if (!uid) throw new Error('No hay una sesión activa para subir el comprobante.');

      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const ext = fileExtensionFromMimeType(mimeType);
      const path = `comprobantes/${uid}/${Date.now()}.${ext}`;
      const r = ref(storage, path);
      await uploadString(r, base64, 'base64', {
        contentType: mimeType || 'image/jpeg',
      });
      return getDownloadURL(r);
    }
    // Mock: echo the local URI back so the picked image can be previewed.
    return localUri;
  },
};
