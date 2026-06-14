import { initializeApp, type FirebaseApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth
} from "firebase/auth";
import {
  Timestamp,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  setDoc,
  type Firestore
} from "firebase/firestore";

const projectId = "we-mohae";
const password = "password123";

export const e2eUsers = {
  weddingOwner: {
    email: "qa.wedding.owner@example.com",
    displayName: "웨딩 오너"
  },
  weddingPartner: {
    email: "qa.wedding.partner@example.com",
    displayName: "웨딩 파트너"
  },
  coupleOwner: {
    email: "qa.couple.owner@example.com",
    displayName: "커플 오너"
  }
} as const;

export const e2eSeed = {
  password,
  weddingCoupleId: "qa-wedding-couple",
  coupleModeCoupleId: "qa-couple-mode-couple",
  weddingInviteCode: "WED2026",
  coupleInviteCode: "CPL2026"
} as const;

export default async function globalSetup() {
  await resetAuthEmulator();

  const app = initializeApp({
    apiKey: "AIzaSyDUMMYKEYFORLOCALTESTS123456789",
    authDomain: "we-mohae.firebaseapp.com",
    projectId,
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:demo"
  });
  const auth = getAuth(app);
  const db = getFirestore(app);

  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);

  const weddingOwnerUid = await createAuthUser(auth, e2eUsers.weddingOwner.email, e2eUsers.weddingOwner.displayName);
  const weddingPartnerUid = await createAuthUser(auth, e2eUsers.weddingPartner.email, e2eUsers.weddingPartner.displayName);
  const coupleOwnerUid = await createAuthUser(auth, e2eUsers.coupleOwner.email, e2eUsers.coupleOwner.displayName);

  await seedWeddingCouple(auth, db, weddingOwnerUid, weddingPartnerUid);
  await seedCoupleModeUser(auth, db, coupleOwnerUid);
  await signOut(auth);
}

async function resetAuthEmulator() {
  await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/accounts`, {
    method: "DELETE"
  }).catch(() => {
    // The emulator may already be clean. Seeding below will surface hard failures.
  });
}

async function createAuthUser(auth: Auth, email: string, displayName: string) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  const { uid } = credential.user;
  await signOut(auth);
  return uid;
}

async function seedWeddingCouple(auth: Auth, db: Firestore, weddingOwnerUid: string, weddingPartnerUid: string) {
  const createdAt = Timestamp.fromDate(new Date("2026-06-01T00:00:00+09:00"));
  const today = new Date();
  today.setSeconds(0, 0);
  const scheduleAt = Timestamp.fromDate(today);
  const contractDate = Timestamp.fromDate(new Date("2026-06-10T00:00:00+09:00"));
  const balanceDate = Timestamp.fromDate(new Date("2026-06-30T00:00:00+09:00"));

  await signInWithEmailAndPassword(auth, e2eUsers.weddingOwner.email, password);

  await setDoc(doc(db, "users", weddingOwnerUid), {
    uid: weddingOwnerUid,
    ...e2eUsers.weddingOwner,
    coupleId: e2eSeed.weddingCoupleId,
    mode: "wedding",
    createdAt,
    updatedAt: createdAt
  });
  await setDoc(doc(db, "couples", e2eSeed.weddingCoupleId), {
    coupleId: e2eSeed.weddingCoupleId,
    mode: "wedding",
    memberIds: [weddingOwnerUid, weddingPartnerUid],
    inviteCode: e2eSeed.weddingInviteCode,
    createdBy: weddingOwnerUid,
    createdAt,
    updatedAt: createdAt
  });
  await setDoc(doc(db, "inviteCodes", e2eSeed.weddingInviteCode), {
    coupleId: e2eSeed.weddingCoupleId,
    createdBy: weddingOwnerUid,
    createdAt
  });
  await setDoc(doc(db, "couples", e2eSeed.weddingCoupleId, "schedules", "qa-wedding-schedule"), {
    scheduleId: "qa-wedding-schedule",
    title: "웨딩홀 상담",
    description: "계약 전 상담",
    startAt: scheduleAt,
    endAt: null,
    allDay: false,
    category: "웨딩홀",
    type: "wedding",
    createdBy: weddingOwnerUid,
    updatedBy: weddingOwnerUid,
    reminderEnabled: false,
    reminderMinutesBefore: null,
    createdAt,
    updatedAt: createdAt
  });
  await setDoc(doc(db, "couples", e2eSeed.weddingCoupleId, "schedules", "qa-couple-schedule"), {
    scheduleId: "qa-couple-schedule",
    title: "QA 데이트 일정",
    description: "수정 삭제 검증용",
    startAt: scheduleAt,
    endAt: null,
    allDay: false,
    category: "데이트",
    type: "couple",
    createdBy: weddingOwnerUid,
    updatedBy: weddingOwnerUid,
    reminderEnabled: false,
    reminderMinutesBefore: null,
    createdAt,
    updatedAt: createdAt
  });
  await setDoc(doc(db, "couples", e2eSeed.weddingCoupleId, "budgets", "qa-budget"), {
    budgetId: "qa-budget",
    title: "웨딩홀 계약",
    category: "웨딩홀",
    subCategory: "대관료",
    estimatedAmount: 1000000,
    contractAmount: 300000,
    paidAmount: 300000,
    payer: "shared",
    paymentDate: balanceDate,
    contractPaymentDate: contractDate,
    balancePaymentDate: balanceDate,
    memo: "QA seed",
    relatedScheduleId: "qa-wedding-schedule",
    createdBy: weddingOwnerUid,
    updatedBy: weddingOwnerUid,
    createdAt,
    updatedAt: createdAt
  });
  await signOut(auth);

  await signInWithEmailAndPassword(auth, e2eUsers.weddingPartner.email, password);
  await setDoc(doc(db, "users", weddingPartnerUid), {
    uid: weddingPartnerUid,
    ...e2eUsers.weddingPartner,
    coupleId: e2eSeed.weddingCoupleId,
    mode: "wedding",
    createdAt,
    updatedAt: createdAt
  });
  await signOut(auth);
}

async function seedCoupleModeUser(auth: Auth, db: Firestore, coupleOwnerUid: string) {
  const createdAt = Timestamp.fromDate(new Date("2026-06-01T00:00:00+09:00"));

  await signInWithEmailAndPassword(auth, e2eUsers.coupleOwner.email, password);
  await setDoc(doc(db, "users", coupleOwnerUid), {
    uid: coupleOwnerUid,
    ...e2eUsers.coupleOwner,
    coupleId: e2eSeed.coupleModeCoupleId,
    mode: "couple",
    createdAt,
    updatedAt: createdAt
  });
  await setDoc(doc(db, "couples", e2eSeed.coupleModeCoupleId), {
    coupleId: e2eSeed.coupleModeCoupleId,
    mode: "couple",
    memberIds: [coupleOwnerUid],
    inviteCode: e2eSeed.coupleInviteCode,
    createdBy: coupleOwnerUid,
    createdAt,
    updatedAt: createdAt
  });
  await setDoc(doc(db, "inviteCodes", e2eSeed.coupleInviteCode), {
    coupleId: e2eSeed.coupleModeCoupleId,
    createdBy: coupleOwnerUid,
    createdAt
  });
  await signOut(auth);
}
