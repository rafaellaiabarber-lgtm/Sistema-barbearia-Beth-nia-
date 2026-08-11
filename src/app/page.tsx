import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (session?.role === "ADMIN") redirect("/admin");
  if (session?.role === "BARBEIRO") redirect("/fila");
  redirect("/login");
}
