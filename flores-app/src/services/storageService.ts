// Storage service — uploads receipt/comprobante images to Firebase Storage.
// Firebase-backed when configured; in the mock it just echoes the local URI so
// the UI can still preview the picked image.
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseService';

export const storageService = {
  /** Upload a comprobante image and return its download URL. */
  async uploadComprobante(localUri: string): Promise<string> {
    if (isFirebaseConfigured && storage) {
      const res = await fetch(localUri);
      const blob = await res.blob();
      const path = `comprobantes/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const r = ref(storage, path);
      await uploadBytes(r, blob);
      return getDownloadURL(r);
    }
    // Mock: echo the local URI back so the picked image can be previewed.
    return localUri;
  },
};
