"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase/client";
import type { UserProfile } from "@/types/domain";
import { ensureUserProfile, subscribeAuth } from "@/features/auth/authService";
import { getUserFacingErrorMessage } from "@/utils/errors";

export function useAuthProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;
    const unsubscribeAuth = subscribeAuth(async (nextUser) => {
      unsubscribeProfile?.();
      setUser(nextUser);
      setError(null);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        await ensureUserProfile(nextUser);
        unsubscribeProfile = onSnapshot(doc(db, "users", nextUser.uid), (snapshot) => {
          setProfile(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
          setLoading(false);
        });
      } catch (nextError) {
        setError(getUserFacingErrorMessage(nextError, "인증 정보를 불러오지 못했어요."));
        setLoading(false);
      }
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  return { user, profile, loading, error };
}
