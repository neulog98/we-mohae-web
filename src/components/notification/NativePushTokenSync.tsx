"use client";

import { useEffect } from "react";
import { syncNativeFcmToken } from "@/features/notification/notificationService";
import type { UserProfile } from "@/types/domain";

export function NativePushTokenSync({ profile }: { profile: UserProfile }) {
  useEffect(() => {
    if (!profile.coupleId) return;
    syncNativeFcmToken(profile.coupleId, profile.uid).catch(() => {
      // 사용자가 설정에서 알림 권한을 요청할 때 다시 동기화한다.
    });
  }, [profile.coupleId, profile.uid]);

  return null;
}
