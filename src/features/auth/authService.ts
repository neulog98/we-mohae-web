"use client";

import {
  EmailAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/domain";

function assertFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase 설정이 없어요. 프로젝트 루트에 .env.local을 만들고 Firebase Web App 설정값을 입력해주세요.");
  }
}

export function getAuthErrorMessage(error: unknown) {
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : null;

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "이메일/패스워드가 다릅니다. 확인 후, 다시 시도해주세요.";
    case "auth/email-already-in-use":
      return "이미 가입된 이메일이에요. 로그인해주세요.";
    case "auth/invalid-email":
      return "올바른 이메일 주소를 입력해주세요.";
    case "auth/weak-password":
      return "비밀번호는 6자 이상 입력해주세요.";
    case "auth/requires-recent-login":
      return "보안을 위해 다시 로그인한 후 비밀번호를 변경해주세요.";
    case "auth/too-many-requests":
      return "로그인 시도가 너무 많아요. 잠시 후 다시 시도해주세요.";
    case "auth/network-request-failed":
      return "네트워크 연결을 확인한 후 다시 시도해주세요.";
    default:
      return error instanceof Error ? error.message : "인증 처리에 실패했어요. 잠시 후 다시 시도해주세요.";
  }
}

export function subscribeAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snapshot = await getDoc(ref);
  if (snapshot.exists()) return snapshot.data() as UserProfile;

  const profile = {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? user.email?.split("@")[0] ?? "사용자",
    coupleId: null,
    mode: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await setDoc(ref, profile);
  return (await getDoc(ref)).data() as UserProfile;
}

export async function signUpWithEmail(email: string, password: string, displayName: string) {
  assertFirebaseConfigured();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  return ensureUserProfile(credential.user);
}

export async function signInWithEmail(email: string, password: string) {
  assertFirebaseConfigured();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return ensureUserProfile(credential.user);
}

export async function signOutUser() {
  await signOut(auth);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  assertFirebaseConfigured();
  const user = auth.currentUser;
  if (!user?.email) throw new Error("로그인 정보를 확인할 수 없어요. 다시 로그인해주세요.");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function sendPasswordResetEmailToUser(email: string) {
  assertFirebaseConfigured();
  auth.languageCode = "ko";
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
        ? error.code
        : null;
    // 계정 존재 여부를 외부에 노출하지 않는다.
    if (code === "auth/user-not-found") return;
    throw error;
  }
}
