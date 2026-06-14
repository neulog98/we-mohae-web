"use client";

import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { asVendor, vendorsQuery } from "@/features/vendor/vendorService";
import type { Vendor } from "@/types/domain";

export function useVendors(coupleId: string | null | undefined) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!coupleId) {
      setVendors([]);
      return;
    }
    setLoading(true);
    return onSnapshot(vendorsQuery(coupleId), (snapshot) => {
      setVendors(snapshot.docs.map((document) => asVendor(document.id, document.data())));
      setLoading(false);
    });
  }, [coupleId]);

  const summary = useMemo(() => {
    return vendors.reduce(
      (current, vendor) => {
        current.total += 1;
        current.contractAmount += vendor.contractAmount;
        current.depositAmount += vendor.depositAmount;
        current.balanceAmount += vendor.balanceAmount;
        current.quoteAmount += vendor.quotes.reduce((sum, quote) => sum + quote.amount, 0);
        if (vendor.status === "candidate") current.candidate += 1;
        if (vendor.status === "contracted") current.contracted += 1;
        return current;
      },
      {
        total: 0,
        candidate: 0,
        contracted: 0,
        contractAmount: 0,
        depositAmount: 0,
        balanceAmount: 0,
        quoteAmount: 0
      }
    );
  }, [vendors]);

  return { vendors, summary, loading };
}
