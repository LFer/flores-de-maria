// Storage service — uploads receipt/comprobante images to Firebase Storage.
// Firebase-backed when configured; in the mock it just echoes the local URI so
// the UI can still preview the picked image.
import * as FileSystem from 'expo-file-system/legacy';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured, auth } from './firebaseService';

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

function storageBucket(): string {
  return process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'flores-de-maria.firebasestorage.app';
}

function downloadUrlFromToken(bucket: string, path: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media&token=${encodeURIComponent(token)}`;
}

export const storageService = {
  /** Upload a comprobante image and return its download URL. */
  async uploadComprobante(localUri: string, mimeType?: string): Promise<string> {
    if (isFirebaseConfigured && storage) {
      const currentUser = auth?.currentUser;
      const uid = currentUser?.uid;
      const ext = fileExtensionFromMimeType(mimeType);
      const path = uid ? `comprobantes/${uid}/${Date.now()}.${ext}` : undefined;
      const bucket = storageBucket();

      try {
        console.log('[storageService] uploadReceipt start', {
          uri: localUri,
          mimeType,
          ext,
          path,
          uid: uid ?? null,
          bucket,
        });

        if (!currentUser || !uid) {
          throw new Error('No hay usuario autenticado para subir el comprobante.');
        }
        if (!path) {
          throw new Error('No se pudo construir el path del comprobante.');
        }

        const idToken = await currentUser.getIdToken();
        const uploadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o?uploadType=media&name=${encodeURIComponent(path)}`;
        console.log('[storageService] uploadReceipt token ready', {
          uri: localUri,
          path,
          uid,
          bucket,
        });

        const response = await FileSystem.uploadAsync(uploadUrl, localUri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': mimeType || 'image/jpeg',
          },
        });
        console.log('[storageService] uploadReceipt response', {
          uri: localUri,
          path,
          uid,
          bucket,
          status: response.status,
        });

        if (response.status < 200 || response.status >= 300) {
          console.error('[storageService] uploadReceipt HTTP failed', {
            uri: localUri,
            mimeType,
            ext,
            path,
            uid,
            bucket,
            status: response.status,
            body: response.body,
          });
          throw new Error(`No se pudo subir el comprobante. Firebase Storage respondió ${response.status}.`);
        }

        const responseJson = JSON.parse(response.body || '{}') as { downloadTokens?: string };
        const token = responseJson.downloadTokens?.split(',')[0];
        if (token) {
          const downloadURL = downloadUrlFromToken(bucket, path, token);
          console.log('[storageService] uploadReceipt success', {
            path,
            uid,
            bucket,
            usedToken: true,
          });
          return downloadURL;
        }

        const downloadURL = await getDownloadURL(ref(storage, path));
        console.log('[storageService] uploadReceipt success', {
          path,
          uid,
          bucket,
          usedToken: false,
        });
        return downloadURL;
      } catch (error) {
        const details = errorDetails(error);
        console.error('[storageService] uploadReceipt failed', {
          uri: localUri,
          mimeType,
          ext,
          path,
          uid: uid ?? null,
          bucket,
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
