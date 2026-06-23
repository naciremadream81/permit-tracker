/**
 * Firebase (Google Cloud) wiring.
 *
 * Cloud mode turns on when NEXT_PUBLIC_FIREBASE_* env vars are present
 * (.env.local — see SETUP-CLOUD.md). Without them the app runs in local
 * mode: localStorage + IndexedDB, exactly as before.
 */

import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const cloudEnabled = Boolean(config.apiKey && config.projectId && config.appId);

/** Fixed id — one shared team workspace. */
export const WORKSPACE_ID = "main";

let app: FirebaseApp | null = null;

function getApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(config);
  }
  return app;
}

export function db(): Firestore {
  return getFirestore(getApp());
}

export function storage(): FirebaseStorage {
  return getStorage(getApp());
}

export async function signIn(): Promise<void> {
  await signInWithPopup(getAuth(getApp()), new GoogleAuthProvider());
}

export async function signOut(): Promise<void> {
  await fbSignOut(getAuth(getApp()));
}

export function watchAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(getAuth(getApp()), cb);
}

export type { User };
