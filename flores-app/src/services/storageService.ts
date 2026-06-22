// Storage service — uploads receipt/comprobante images to Firebase Storage.
// Firebase-backed when configured; in the mock it just echoes the local URI so
// the UI can still preview the picked image.
import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured, auth } from './firebaseService';
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

function errorDetails(error: unknown): { code?: string; message?: string } {
  if (error && typeof error === 'object') {
    const candidate = error as { code?: unknown; message?: unknown };
    return {
      code: typeof candidate.code === 'string' ? candidate.code : undefined,
      message: typeof candidate.message === 'string' ? candidate.message : undefined,
    };
  }
  if (typeof error === 'string') return { message: error };
  return {};
}

async function readBase64FromUri(uri: string, ext: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists) {
    return FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  if (!FileSystem.cacheDirectory) {
    throw new Error('No se pudo leer el comprobante y no hay cacheDirectory disponible.');
  }

  const cacheUri = `${FileSystem.cacheDirectory}receipt-${Date.now()}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: cacheUri });
  const cachedInfo = await FileSystem.getInfoAsync(cacheUri);
  if (!cachedInfo.exists) {
    throw new Error('No se pudo copiar el comprobante a cache para leerlo.');
  }

  return FileSystem.readAsStringAsync(cacheUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export const storageService = {
  /** Upload a comprobante image and return its download URL. */
  async uploadComprobante(localUri: string, mimeType?: string): Promise<string> {
    if (isFirebaseConfigured && storage) {
      const uid = auth?.currentUser?.uid ?? authService.currentUserId();
      const ext = fileExtensionFromMimeType(mimeType);
      const path = uid ? `comprobantes/${uid}/${Date.now()}.${ext}` : undefined;

      try {
        console.error('[storageService] uploadReceipt start', {
          uri: localUri,
          mimeType,
          ext,
          path,
          uid: auth?.currentUser?.uid ?? null,
        });

        if (!uid) {
          throw new Error('No hay usuario autenticado para subir el comprobante.');
        }

        const base64 = await readBase64FromUri(localUri, ext);
        const storageRef = ref(storage, path);
        await uploadString(storageRef, base64, 'base64', {
          contentType: mimeType || 'image/jpeg',
        });
        return await getDownloadURL(storageRef);
      } catch (error) {
        const details = errorDetails(error);
        console.error('[storageService] uploadReceipt failed', {
          uri: localUri,
          mimeType,
          ext,
          path,
          uid: auth?.currentUser?.uid ?? null,
          code: details.code,
          message: details.message,
          error,
        });
        throw error;
      }
    }
    // Mock: echo the local URI back so the picked image can be previewed.
    return localUri;
  },
};
