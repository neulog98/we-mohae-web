"use client";

import { deleteDoc, doc, serverTimestamp, setDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getFirebaseMessaging } from "@/lib/firebase/client";

interface NativeBridge {
  postMessage: (message: string) => void;
}

interface NativePushTokenDetail {
  type: "pushToken" | "error";
  token?: string;
  previousToken?: string | null;
  permissionGranted?: boolean;
  message?: string;
}

function getNativeBridge() {
  if (typeof window === "undefined") return null;
  return (window as typeof window & { WooriNativeBridge?: NativeBridge }).WooriNativeBridge ?? null;
}

async function saveFcmToken(
  coupleId: string,
  uid: string,
  token: string,
  platform: "web" | "android",
  previousToken?: string | null
) {
  await setDoc(
    doc(db, "couples", coupleId, "fcmTokens", token),
    {
      token,
      userId: uid,
      platform,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
  if (previousToken && previousToken !== token) {
    await deleteDoc(doc(db, "couples", coupleId, "fcmTokens", previousToken));
  }
}

function requestNativePushToken(requestPermission: boolean) {
  const bridge = getNativeBridge();
  if (!bridge) return null;

  return new Promise<NativePushTokenDetail>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Android 앱에서 FCM 토큰 응답을 받지 못했어요."));
    }, 15000);
    const handleToken = (event: Event) => {
      const detail = (event as CustomEvent<NativePushTokenDetail>).detail;
      cleanup();
      if (detail.type === "error") {
        reject(new Error(detail.message ?? "Android FCM 토큰을 발급받지 못했어요."));
        return;
      }
      resolve(detail);
    };
    const cleanup = () => {
      window.clearTimeout(timeout);
      window.removeEventListener("woori-native-push-token", handleToken);
    };

    window.addEventListener("woori-native-push-token", handleToken);
    bridge.postMessage(JSON.stringify({ type: "requestPushToken", requestPermission }));
  });
}

export async function requestAndSaveFcmToken(coupleId: string, uid: string) {
  const nativeRequest = requestNativePushToken(true);
  if (nativeRequest) {
    const result = await nativeRequest;
    if (!result.permissionGranted) throw new Error("앱 알림 권한이 허용되지 않았어요.");
    if (!result.token) throw new Error("Android FCM 토큰을 발급받지 못했어요.");
    await saveFcmToken(coupleId, uid, result.token, "android", result.previousToken);
    return result.token;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("알림 권한이 허용되지 않았어요.");

  const messaging = await getFirebaseMessaging();
  if (!messaging) throw new Error("현재 브라우저는 웹 푸시를 지원하지 않아요.");

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  const token = await getToken(messaging, { vapidKey });
  if (!token) throw new Error("FCM 토큰을 발급받지 못했어요.");

  await saveFcmToken(coupleId, uid, token, "web");
  return token;
}

export async function syncNativeFcmToken(coupleId: string, uid: string) {
  const nativeRequest = requestNativePushToken(false);
  if (!nativeRequest) return null;
  const result = await nativeRequest;
  if (!result.token) return null;
  await saveFcmToken(coupleId, uid, result.token, "android", result.previousToken);
  return result.token;
}

export async function removeFcmToken(coupleId: string, token: string) {
  await deleteDoc(doc(db, "couples", coupleId, "fcmTokens", token));
}

export async function removeCurrentNativeFcmToken(coupleId: string) {
  const nativeRequest = requestNativePushToken(false);
  if (!nativeRequest) return;
  const result = await nativeRequest;
  if (result.token) await removeFcmToken(coupleId, result.token);
  if (result.previousToken && result.previousToken !== result.token) {
    await removeFcmToken(coupleId, result.previousToken);
  }
}
