import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { getPartnerTokens, notificationId, sendOnce, sendToTokens } from "../utils/notifications";

type ScheduleDoc = {
  scheduleId?: string;
  title: string;
  createdBy: string;
  updatedBy: string;
};

export const onScheduleCreated = onDocumentCreated("couples/{coupleId}/schedules/{scheduleId}", async (event) => {
  const coupleId = event.params.coupleId;
  const scheduleId = event.params.scheduleId;
  const schedule = event.data?.data() as ScheduleDoc | undefined;
  if (!schedule) return;

  const tokens = await getPartnerTokens(coupleId, schedule.createdBy);
  const id = notificationId(["schedule", scheduleId, "created", event.time]);
  await sendOnce({
    coupleId,
    id,
    targetType: "schedule",
    targetId: scheduleId,
    notificationType: "created",
    sentToUserIds: tokens.map((token) => token.userId),
    send: () =>
      sendToTokens(tokens.map((token) => token.token), "새 일정이 추가됐어요", "우리뭐해에 새로운 일정이 등록됐어요", {
        coupleId,
        scheduleId
      })
  });
});

export const onScheduleUpdated = onDocumentUpdated("couples/{coupleId}/schedules/{scheduleId}", async (event) => {
  const before = event.data?.before.data() as ScheduleDoc | undefined;
  const after = event.data?.after.data() as ScheduleDoc | undefined;
  if (!before || !after) return;
  if (!before.scheduleId && after.scheduleId) return;

  const coupleId = event.params.coupleId;
  const scheduleId = event.params.scheduleId;
  const tokens = await getPartnerTokens(coupleId, after.updatedBy);
  const id = notificationId(["schedule", scheduleId, "updated", event.time]);
  await sendOnce({
    coupleId,
    id,
    targetType: "schedule",
    targetId: scheduleId,
    notificationType: "updated",
    sentToUserIds: tokens.map((token) => token.userId),
    send: () =>
      sendToTokens(tokens.map((token) => token.token), "일정이 수정됐어요", after.title, {
        coupleId,
        scheduleId
      })
  });
});

export async function sendScheduleReminder(coupleId: string, scheduleId: string, schedule: FirebaseFirestore.DocumentData, scheduledTime: string) {
  const tokenSnapshot = await admin.firestore().collection("couples").doc(coupleId).collection("fcmTokens").get();
  const tokens = tokenSnapshot.docs.map((doc) => doc.data() as { token: string; userId: string });
  const id = notificationId(["schedule", scheduleId, "reminder", scheduledTime]);
  await sendOnce({
    coupleId,
    id,
    targetType: "schedule",
    targetId: scheduleId,
    notificationType: "reminder",
    sentToUserIds: tokens.map((token) => token.userId),
    send: () =>
      sendToTokens(tokens.map((token) => token.token), "곧 일정이 있어요", schedule.title ?? "일정을 확인해보세요", {
        coupleId,
        scheduleId
      })
  });
}
