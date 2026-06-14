"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { asGuest, guestsQuery } from "@/features/guest/guestService";
import type { Guest } from "@/types/domain";

export function useGuests(coupleId: string | null | undefined) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coupleId) {
      setGuests([]);
      return;
    }
    setLoading(true);
    return onSnapshot(guestsQuery(coupleId), (snapshot) => {
      setGuests(snapshot.docs.map((document) => asGuest(document.id, document.data())));
      setLoading(false);
    });
  }, [coupleId]);

  const summary = useMemo(() => {
    return guests.reduce(
      (current, guest) => {
        current.total += 1;
        current.expectedHeadcount += 1 + guest.companionCount;
        current.mealTickets += guest.mealTicketCount;
        current.congratulatoryAmount += guest.congratulatoryAmount;
        if (guest.side === "groom") current.groom += 1;
        if (guest.side === "bride") current.bride += 1;
        if (guest.side === "shared") current.shared += 1;
        if (guest.attendanceStatus === "attending") current.attending += 1;
        if (guest.attendanceStatus === "declined") current.declined += 1;
        if (guest.attendanceStatus === "pending") current.pending += 1;
        return current;
      },
      {
        total: 0,
        groom: 0,
        bride: 0,
        shared: 0,
        attending: 0,
        declined: 0,
        pending: 0,
        expectedHeadcount: 0,
        mealTickets: 0,
        congratulatoryAmount: 0
      }
    );
  }, [guests]);

  return { guests, summary, loading };
}
