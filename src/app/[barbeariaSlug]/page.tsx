import { redirect } from "next/navigation";
import { requireBarbeariaBySlug } from "@/lib/tenant";

export default async function BarbeariaHomePage({ params }: { params: Promise<{ barbeariaSlug: string }> }) {
  const { barbeariaSlug } = await params;
  await requireBarbeariaBySlug(barbeariaSlug);
  redirect(`/${barbeariaSlug}/totem`);
}
