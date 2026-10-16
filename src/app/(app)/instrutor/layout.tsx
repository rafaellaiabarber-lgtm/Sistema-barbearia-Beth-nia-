import { requireUsuario } from "@/lib/session";
import { SubNavInstrutor } from "./sub-nav";

export default async function InstrutorLayout({ children }: { children: React.ReactNode }) {
  await requireUsuario("INSTRUTOR");
  return (
    <div>
      <SubNavInstrutor />
      {children}
    </div>
  );
}
