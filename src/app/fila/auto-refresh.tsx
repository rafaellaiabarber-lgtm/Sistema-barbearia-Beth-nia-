"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervaloMs = 5000 }: { intervaloMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervaloMs);
    return () => clearInterval(id);
  }, [router, intervaloMs]);

  return null;
}
