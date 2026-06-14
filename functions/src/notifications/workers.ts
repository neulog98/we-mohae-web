import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { notificationId, sendOnce, sendToTokens } from "../utils/notifications";

const KOREA_OFFSET_MS = 9 * 60 * 60 * 1000;

type NotificationSettings = {
  scheduleDayBefore?: boolean;
  scheduleSameDay?: boolean;
  budgetDueDate?: boolean;
  checklistDueDate?: boolean;
};

function notificationSettings(data: FirebaseFirestore.DocumentData): Required<NotificationSettings> {
  const settings = (data.notificationSettings ?? {}) as NotificationSettings;
  return {
    scheduleDayBefore: settings.scheduleDayBefore !== false,
    scheduleSameDay: settings.scheduleSameDay !== false,
    budgetDueDate: settings.budgetDueDate !== false,
    checklistDueDate: settings.checklistDueDate !== false
  };
}

function koreaDayRange(daysFromToday: number) {
  const koreaNow = new Date(Date.now() + KOREA_OFFSET_MS);
  const startAsKoreaUtc = Date.UTC(
    koreaNow.getUTCFullYear(),
    koreaNow.getUTCMonth(),
    koreaNow.getUTCDate() + daysFromToday,
    0,
    0,
    0,
    0
  );
  const start = new Date(startAsKoreaUtc - KOREA_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  const targetKoreaDate = new Date(startAsKoreaUtc);
  const dateKey = `${targetKoreaDate.getUTCFullYear()}-${String(targetKoreaDate.getUTCMonth() + 1).padStart(2, "0")}-${String(
    targetKoreaDate.getUTCDate()
  ).padStart(2, "0")}`;
  return { start, end, dateKey };
}

export const scheduledReminderWorker = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "Asia/Seoul"
  },
  async () => {
    const today = koreaDayRange(0);
    const tomorrow = koreaDayRange(1);
    const couples = await admin.firestore().collection("couples").get();

    await Promise.all(
      couples.docs.map(async (couple) => {
        const settings = notificationSettings(couple.data());
        if (!settings.scheduleDayBefore && !settings.scheduleSameDay) return;
        const [schedules, tokenSnapshot] = await Promise.all([
          couple.ref
            .collection("schedules")
            .where("startAt", ">=", admin.firestore.Timestamp.fromDate(today.start))
            .where("startAt", "<=", admin.firestore.Timestamp.fromDate(tomorrow.end))
            .get(),
          couple.ref.collection("fcmTokens").get()
        ]);
        const tokens = tokenSnapshot.docs.map((doc) => doc.data() as { token: string; userId: string });

        await Promise.all(
          schedules.docs
            .filter((scheduleDoc) => scheduleDoc.data().reminderEnabled === true)
            .map((scheduleDoc) => {
              const schedule = scheduleDoc.data();
              const startAt = schedule.startAt?.toDate?.() as Date | undefined;
              if (!startAt) return Promise.resolve();
              const isToday = startAt >= today.start && startAt <= today.end;
              if (isToday && !settings.scheduleSameDay) return Promise.resolve();
              if (!isToday && !settings.scheduleDayBefore) return Promise.resolve();
              const target = isToday
                ? { notificationType: "schedule-day-of-9am", dateKey: today.dateKey, label: "오늘" }
                : { notificationType: "schedule-day-before-9am", dateKey: tomorrow.dateKey, label: "내일" };
              const id = notificationId(["schedule", scheduleDoc.id, target.notificationType, target.dateKey]);

              return sendOnce({
                coupleId: couple.id,
                id,
                targetType: "schedule",
                targetId: scheduleDoc.id,
                notificationType: target.notificationType,
                sentToUserIds: tokens.map((token) => token.userId),
                send: () =>
                  sendToTokens(tokens.map((token) => token.token), `${target.label} 일정이 있어요`, schedule.title ?? "일정을 확인해보세요", {
                    coupleId: couple.id,
                    scheduleId: scheduleDoc.id
                  })
              });
            })
        );
      })
    );
  }
);

export const scheduledBudgetPaymentReminderWorker = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "Asia/Seoul"
  },
  async () => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const couples = await admin.firestore().collection("couples").where("mode", "==", "wedding").get();
    await Promise.all(
      couples.docs.map(async (couple) => {
        const settings = notificationSettings(couple.data());
        if (!settings.budgetDueDate) return;
        const paymentTargets = [
          { field: "contractPaymentDate", notificationType: "contract-payment-day-before", label: "계약금" },
          { field: "paymentDate", notificationType: "balance-payment-day-before", label: "잔금" }
        ] as const;
        const budgetSnapshots = await Promise.all(
          paymentTargets.map((target) =>
            couple.ref
              .collection("budgets")
              .where(target.field, ">=", admin.firestore.Timestamp.fromDate(start))
              .where(target.field, "<=", admin.firestore.Timestamp.fromDate(end))
              .get()
          )
        );
        const tokenSnapshot = await couple.ref.collection("fcmTokens").get();
        const tokens = tokenSnapshot.docs.map((doc) => doc.data() as { token: string; userId: string });

        await Promise.all(
          paymentTargets.flatMap((target, index) =>
            budgetSnapshots[index].docs.map((budgetDoc) => {
              const budget = budgetDoc.data();
              const id = notificationId(["budget", budgetDoc.id, target.notificationType, start.toISOString()]);
              return sendOnce({
                coupleId: couple.id,
                id,
                targetType: "budget",
                targetId: budgetDoc.id,
                notificationType: target.notificationType,
                sentToUserIds: tokens.map((token) => token.userId),
                send: () =>
                  sendToTokens(tokens.map((token) => token.token), "다가오는 결제일이 있어요", `내일 ${target.label} 결제 예정인 항목을 확인해보세요`, {
                    coupleId: couple.id,
                    budgetId: budgetDoc.id,
                    title: budget.title ?? ""
                  })
              });
            })
          )
        );
      })
    );
  }
);

export const scheduledChecklistReminderWorker = onSchedule(
  {
    schedule: "every day 09:00",
    timeZone: "Asia/Seoul"
  },
  async () => {
    const today = koreaDayRange(0);
    const couples = await admin.firestore().collection("couples").where("mode", "==", "wedding").get();

    await Promise.all(
      couples.docs.map(async (couple) => {
        const settings = notificationSettings(couple.data());
        if (!settings.checklistDueDate) return;

        const [checklistSnapshot, tokenSnapshot] = await Promise.all([
          couple.ref
            .collection("checklist")
            .where("dueDate", ">=", admin.firestore.Timestamp.fromDate(today.start))
            .where("dueDate", "<=", admin.firestore.Timestamp.fromDate(today.end))
            .get(),
          couple.ref.collection("fcmTokens").get()
        ]);
        const tokens = tokenSnapshot.docs.map((doc) => doc.data() as { token: string; userId: string });

        await Promise.all(
          checklistSnapshot.docs
            .filter((checklistDoc) => {
              const checklist = checklistDoc.data();
              return checklist.completed !== true && checklist.status !== "done";
            })
            .map((checklistDoc) => {
              const checklist = checklistDoc.data();
              const id = notificationId(["checklist", checklistDoc.id, "due-date", today.dateKey]);
              return sendOnce({
                coupleId: couple.id,
                id,
                targetType: "checklist",
                targetId: checklistDoc.id,
                notificationType: "checklist-due-date",
                sentToUserIds: tokens.map((token) => token.userId),
                send: () =>
                  sendToTokens(tokens.map((token) => token.token), "오늘 마감인 준비 항목이 있어요", checklist.title ?? "체크리스트를 확인해보세요", {
                    coupleId: couple.id,
                    checklistId: checklistDoc.id
                  })
              });
            })
        );
      })
    );
  }
);
