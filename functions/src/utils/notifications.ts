import * as admin from "firebase-admin";

export function notificationId(parts: string[]) {
  return parts.map((part) => part.split("/").join("_")).join("__");
}

export async function getPartnerTokens(coupleId: string, actorUserId: string) {
  const snapshot = await admin.firestore().collection("couples").doc(coupleId).collection("fcmTokens").get();
  return snapshot.docs
    .map((doc) => doc.data() as { token: string; userId: string })
    .filter((token) => token.userId !== actorUserId);
}

export async function sendToTokens(tokens: string[], title: string, body: string, data: Record<string, string>) {
  if (tokens.length === 0) return;
  await admin.messaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data,
    android: {
      notification: {
        channelId: "schedule_reminders",
        color: "#B75D69"
      }
    }
  });
}

export async function sendOnce({
  coupleId,
  id,
  targetType,
  targetId,
  notificationType,
  sentToUserIds,
  send
}: {
  coupleId: string;
  id: string;
  targetType: "schedule" | "budget" | "checklist";
  targetId: string;
  notificationType: string;
  sentToUserIds: string[];
  send: () => Promise<void>;
}) {
  const ref = admin.firestore().collection("couples").doc(coupleId).collection("sentNotifications").doc(id);
  const shouldSend = await admin.firestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (snapshot.exists) return false;
    transaction.set(ref, {
      notificationId: id,
      targetType,
      targetId,
      notificationType,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      sentToUserIds
    });
    return true;
  });
  if (shouldSend) await send();
}
