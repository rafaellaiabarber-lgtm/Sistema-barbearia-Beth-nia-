"use client";

import dynamic from "next/dynamic";

const MotoristaApp = dynamic(() => import("./motorista-app"), { ssr: false });

export function MotoristaLoader() {
  return <MotoristaApp />;
}
