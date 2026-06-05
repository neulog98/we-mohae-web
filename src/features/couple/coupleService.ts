"use client";

import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { Couple, CoupleMode } from "@/types/domain";
import { createInviteCode, normalizeInviteCode } from "@/utils/invite";

export async function createCouple(uid: string, mode: CoupleMode) {
  const coupleRef = doc(collection(db, "couples"));
  const coupleId = coupleRef.id;
  const inviteCode = createInviteCode();
  const couple = {
    coupleId,
    mode,
    memberIds: [uid],
    inviteCode,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const batch = writeBatch(db);
  batch.set(coupleRef, couple);
  batch.set(doc(db, "inviteCodes", inviteCode), {
    coupleId,
    createdBy: uid,
    createdAt: serverTimestamp()
  });
  batch.update(doc(db, "users", uid), {
    coupleId,
    mode,
    updatedAt: serverTimestamp()
  });
  await batch.commit();
  return coupleId;
}

export async function joinCoupleByInviteCode(uid: string, inviteCode: string) {
  const code = normalizeInviteCode(inviteCode);
  const inviteSnapshot = await getDoc(doc(db, "inviteCodes", code));
  if (!inviteSnapshot.exists()) throw new Error("유효한 초대코드를 찾지 못했어요.");

  const coupleId = inviteSnapshot.data().coupleId as string;
  const coupleRef = doc(db, "couples", coupleId);
  await updateDoc(coupleRef, {
    memberIds: arrayUnion(uid),
    updatedAt: serverTimestamp()
  });
  const coupleSnapshot = await getDoc(coupleRef);
  if (!coupleSnapshot.exists()) throw new Error("연결할 커플 정보를 찾지 못했어요.");
  const couple = coupleSnapshot.data() as Couple;
  if (couple.memberIds.length > 2) throw new Error("이미 두 명이 연결된 초대코드예요.");
  await updateDoc(doc(db, "users", uid), {
    coupleId: couple.coupleId,
    mode: couple.mode,
    updatedAt: serverTimestamp()
  });
  return couple.coupleId;
}

export async function refreshInviteCode(coupleId: string) {
  const coupleRef = doc(db, "couples", coupleId);
  const snapshot = await getDoc(coupleRef);
  const currentCode = snapshot.exists() ? (snapshot.data() as Couple).inviteCode : null;
  const inviteCode = createInviteCode();
  await updateDoc(coupleRef, {
    inviteCode,
    updatedAt: serverTimestamp()
  });
  await setDoc(doc(db, "inviteCodes", inviteCode), {
    coupleId,
    createdBy: auth.currentUser?.uid ?? "",
    createdAt: serverTimestamp()
  });
  if (currentCode) await deleteDoc(doc(db, "inviteCodes", currentCode));
  return inviteCode;
}

export async function changeCoupleMode(coupleId: string, uid: string, mode: CoupleMode) {
  const batch = writeBatch(db);
  batch.update(doc(db, "couples", coupleId), {
    mode,
    updatedAt: serverTimestamp()
  });
  batch.update(doc(db, "users", uid), {
    mode,
    updatedAt: serverTimestamp()
  });
  await batch.commit();
}

export async function disconnectCouple(coupleId: string, uid: string) {
  const coupleRef = doc(db, "couples", coupleId);
  const snapshot = await getDoc(coupleRef);
  if (!snapshot.exists()) throw new Error("커플 정보를 찾지 못했어요.");

  const couple = snapshot.data() as Couple;
  const partnerId = couple.memberIds.find((memberId) => memberId !== uid);
  if (!partnerId) throw new Error("연결된 파트너가 없어요.");

  const remainingInviteCode = createInviteCode();
  const newCoupleRef = doc(collection(db, "couples"));
  const newInviteCode = createInviteCode();
  const batch = writeBatch(db);
  const tokenSnapshot = await getDocs(
    query(collection(db, "couples", coupleId, "fcmTokens"), where("userId", "==", uid))
  );

  batch.update(coupleRef, {
    memberIds: [partnerId],
    inviteCode: remainingInviteCode,
    updatedAt: serverTimestamp()
  });
  batch.delete(doc(db, "inviteCodes", couple.inviteCode));
  batch.set(doc(db, "inviteCodes", remainingInviteCode), {
    coupleId,
    createdBy: uid,
    createdAt: serverTimestamp()
  });
  batch.set(newCoupleRef, {
    coupleId: newCoupleRef.id,
    mode: couple.mode,
    memberIds: [uid],
    inviteCode: newInviteCode,
    createdBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  batch.set(doc(db, "inviteCodes", newInviteCode), {
    coupleId: newCoupleRef.id,
    createdBy: uid,
    createdAt: serverTimestamp()
  });
  batch.update(doc(db, "users", uid), {
    coupleId: newCoupleRef.id,
    mode: couple.mode,
    updatedAt: serverTimestamp()
  });
  tokenSnapshot.docs.forEach((tokenDoc) => batch.delete(tokenDoc.ref));
  await batch.commit();
}
