"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingView } from "@/components/common/StateView";

export default function IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center p-4">
      <LoadingView />
    </main>
  );
}
