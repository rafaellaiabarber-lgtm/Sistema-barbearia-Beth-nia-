"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { BarbeiroNavLink } from "./nav-links";
import { ICONES_NAV_BARBEIRO } from "./nav-icones";

export function BarbeiroSidebarNav({ links }: { links: BarbeiroNavLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {links.map((l) => {
        const ativo = pathname === l.href;
        const Icone = ICONES_NAV_BARBEIRO[l.icone];
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              ativo ? "bg-blue-600 text-white" : "text-blue-100/80 hover:bg-blue-500/10 hover:text-white"
            }`}
          >
            <Icone className="w-4 h-4 shrink-0" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
