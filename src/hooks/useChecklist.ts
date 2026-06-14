"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { asChecklistItem, checklistQuery } from "@/features/checklist/checklistService";
import type { WeddingChecklistItem } from "@/types/domain";

export function useChecklist(coupleId: string | null | undefined) {
  const [items, setItems] = useState<WeddingChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coupleId) {
      setItems([]);
      return;
    }

    setLoading(true);
    return onSnapshot(checklistQuery(coupleId), (snapshot) => {
      setItems(
        snapshot.docs
          .map((document) => asChecklistItem(document.id, document.data()))
          .sort((left, right) => left.order - right.order)
      );
      setLoading(false);
    });
  }, [coupleId]);

  const summary = useMemo(() => {
    const completed = items.filter((item) => item.completed).length;
    return {
      total: items.length,
      completed,
      remaining: Math.max(items.length - completed, 0),
      progress: items.length ? Math.round((completed / items.length) * 100) : 0
    };
  }, [items]);

  return { items, summary, loading };
}
