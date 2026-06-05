"use client";

import { useEffect, useMemo, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { Couple, UserProfile } from "@/types/domain";

export function useCouple(profile: UserProfile | null) {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPartner(null);
    if (!profile?.coupleId) {
      setCouple(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, "couples", profile.coupleId), (snapshot) => {
      setCouple(snapshot.exists() ? (snapshot.data() as Couple) : null);
      setLoading(false);
    });

    return unsubscribe;
  }, [profile?.coupleId]);

  useEffect(() => {
    const partnerId = couple?.memberIds.find((memberId) => memberId !== profile?.uid);
    if (!partnerId) {
      setPartner(null);
      return;
    }
    return onSnapshot(doc(db, "users", partnerId), (snapshot) => {
      setPartner(snapshot.exists() ? (snapshot.data() as UserProfile) : null);
    });
  }, [couple?.memberIds, profile?.uid]);

  const connected = useMemo(() => Boolean(couple && couple.memberIds.length === 2), [couple]);
  const mode = couple?.mode ?? profile?.mode ?? null;

  return { couple, partner, connected, loading, mode };
}
