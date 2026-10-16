"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/instrutor", label: "Visão geral" },
  { href: "/instrutor/alunos", label: "Alunos" },
  { href: "/instrutor/tecnicas", label: "Técnicas e desafios" },
];

export function SubNavInstrutor() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 mb-5 overflow-x-auto">
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
            pathname === l.href ? "bg-orange-600 text-white" : "border border-neutral-800 text-neutral-300"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
