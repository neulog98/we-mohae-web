import type { Timestamp } from "firebase/firestore";

export type CoupleMode = "couple" | "wedding";

export type ScheduleCategory =
  | "데이트"
  | "기념일"
  | "약속"
  | "여행"
  | "웨딩홀"
  | "스드메"
  | "드레스"
  | "메이크업"
  | "예복"
  | "예물"
  | "혼수"
  | "신혼여행"
  | "가족 일정"
  | "기타";

export type BudgetCategory =
  | "웨딩홀"
  | "스드메"
  | "드레스"
  | "사진"
  | "메이크업"
  | "예복"
  | "예물"
  | "혼수"
  | "신혼여행"
  | "가족 일정"
  | "기타";

export type PayerType = "groom" | "bride" | "shared";
export type AssigneeType = "groom" | "bride" | "shared";
export type GuestSide = "groom" | "bride" | "shared";
export type GuestAttendanceStatus = "pending" | "attending" | "declined";
export type ChecklistStatus = "todo" | "inProgress" | "blocked" | "vendorCheck" | "done";
export type VendorStatus = "candidate" | "contacted" | "quoted" | "contracted" | "rejected";
export type FcmPlatform = "web" | "ios" | "android";

export type FirestoreDate = Timestamp;

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  coupleId: string | null;
  mode: CoupleMode | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface Couple {
  coupleId: string;
  mode: CoupleMode;
  memberIds: string[];
  inviteCode: string;
  weddingDate?: FirestoreDate | null;
  budgetGoalAmount?: number;
  notificationSettings?: NotificationSettings;
  createdBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface Schedule {
  scheduleId: string;
  title: string;
  description: string;
  startAt: FirestoreDate;
  endAt: FirestoreDate | null;
  allDay: boolean;
  category: ScheduleCategory;
  type: CoupleMode;
  assignee?: AssigneeType;
  vendorName?: string;
  vendorContact?: string;
  createdBy: string;
  updatedBy: string;
  reminderEnabled: boolean;
  reminderMinutesBefore: number | null;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface BudgetItem {
  budgetId: string;
  title: string;
  category: BudgetCategory;
  subCategory?: string;
  estimatedAmount: number;
  contractAmount: number;
  paidAmount: number;
  groomShareAmount?: number;
  brideShareAmount?: number;
  payer: PayerType;
  paymentDate: FirestoreDate | null;
  contractPaymentDate?: FirestoreDate | null;
  balancePaymentDate?: FirestoreDate | null;
  memo: string;
  vendorName?: string;
  vendorContact?: string;
  accountInfo?: string;
  familySupportAmount?: number;
  refundAmount?: number;
  cardHolder?: string;
  relatedScheduleId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface WeddingChecklistItem {
  checklistId: string;
  title: string;
  description: string;
  dueDate: FirestoreDate | null;
  assignee: AssigneeType;
  completed: boolean;
  status?: ChecklistStatus;
  completedAt: FirestoreDate | null;
  order: number;
  createdBy: string;
  updatedBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface Guest {
  guestId: string;
  name: string;
  side: GuestSide;
  relation: string;
  phone: string;
  attendanceStatus: GuestAttendanceStatus;
  companionCount: number;
  mealTicketCount: number;
  giftChecked: boolean;
  congratulatoryAmount: number;
  memo: string;
  createdBy: string;
  updatedBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface VendorAttachment {
  attachmentId: string;
  name: string;
  url: string;
  type: "contract" | "quote" | "photo" | "account" | "etc";
}

export interface VendorQuote {
  quoteId: string;
  title: string;
  amount: number;
  includedItems: string;
  extraCostMemo: string;
  validUntil: FirestoreDate | null;
  createdAt: FirestoreDate;
}

export interface Vendor {
  vendorId: string;
  name: string;
  category: BudgetCategory;
  status: VendorStatus;
  contactName: string;
  phone: string;
  address: string;
  contractAmount: number;
  depositAmount: number;
  balanceAmount: number;
  paymentDueDate: FirestoreDate | null;
  memo: string;
  attachments: VendorAttachment[];
  quotes: VendorQuote[];
  relatedBudgetId: string | null;
  relatedScheduleId: string | null;
  createdBy: string;
  updatedBy: string;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface NotificationSettings {
  scheduleDayBefore: boolean;
  scheduleSameDay: boolean;
  budgetDueDate: boolean;
  checklistDueDate: boolean;
}

export interface FcmToken {
  token: string;
  userId: string;
  platform: FcmPlatform;
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

export interface SentNotification {
  notificationId: string;
  targetType: "schedule" | "budget" | "checklist";
  targetId: string;
  notificationType: string;
  sentAt: FirestoreDate;
  sentToUserIds: string[];
}

export const coupleScheduleCategories: ScheduleCategory[] = [
  "데이트",
  "기념일",
  "약속",
  "여행",
  "기타"
];

export const weddingScheduleCategories: ScheduleCategory[] = [
  "웨딩홀",
  "스드메",
  "드레스",
  "메이크업",
  "예복",
  "예물",
  "혼수",
  "신혼여행",
  "가족 일정",
  "기타"
];

export const budgetCategories: BudgetCategory[] = [
  "웨딩홀",
  "스드메",
  "드레스",
  "사진",
  "메이크업",
  "예복",
  "예물",
  "혼수",
  "신혼여행",
  "가족 일정",
  "기타"
];

export const budgetSubCategorySuggestions: Partial<Record<BudgetCategory, string[]>> = {
  웨딩홀: ["대관료", "식대", "보증 인원", "장식"],
  스드메: ["스튜디오", "드레스", "메이크업", "패키지 추가금"],
  드레스: ["촬영 드레스", "본식 드레스", "촬영 헬퍼", "본식 헬퍼", "추가금", "2부 드레스"],
  사진: ["본식 스냅", "서브 스냅", "아이폰 스냅", "영상"],
  메이크업: ["신랑 메이크업", "신부 메이크업", "혼주 메이크업"],
  예복: ["맞춤 예복", "대여 예복", "구두"],
  예물: ["웨딩링", "예물", "시계"],
  혼수: ["가전", "가구", "생활용품"],
  신혼여행: ["항공", "숙소", "현지 투어", "여행 경비"],
  "가족 일정": ["상견례", "혼주 의상", "가족 식사"],
  기타: ["헤어 변형", "부케", "청첩장", "답례품", "사회·축가", "폐백"]
};

export const reminderOptions = [
  { label: "10분 전", minutes: 10 },
  { label: "30분 전", minutes: 30 },
  { label: "1시간 전", minutes: 60 },
  { label: "하루 전", minutes: 1440 }
];
