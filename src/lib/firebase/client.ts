"use client";

import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, enableIndexedDbPersistence, getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

export const isFirebaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "demo.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "000000000000",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "1:000000000000:web:demo"
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

declare global {
  interface Window {
    __WE_MOHAE_FIREBASE_EMULATOR_CONNECTED__?: boolean;
    __WE_MOHAE_FIRESTORE_PERSISTENCE_ENABLED__?: boolean;
  }
}

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
  !window.__WE_MOHAE_FIREBASE_EMULATOR_CONNECTED__
) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  window.__WE_MOHAE_FIREBASE_EMULATOR_CONNECTED__ = true;
}

if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR !== "true" &&
  !window.__WE_MOHAE_FIRESTORE_PERSISTENCE_ENABLED__
) {
  window.__WE_MOHAE_FIRESTORE_PERSISTENCE_ENABLED__ = true;
  enableIndexedDbPersistence(db).catch(() => {
    // 멀티 탭 또는 브라우저 제한 환경에서는 네트워크 동기화만 사용한다.
  });
}

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;
  const supported = await isSupported();
  return supported ? getMessaging(firebaseApp) : null;
}
