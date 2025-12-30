import { NextResponse } from "next/server";
import { ensureAppReady, seedExampleProject } from "@/lib/bootstrap";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "error", message: "Seed je na voljo le v razvojnih okoljih" }, { status: 403 });
  }

  await ensureAppReady();

  try {
    const project = await seedExampleProject();
    return NextResponse.json({ status: "success", project }, { status: 201 });
  } catch (error: any) {
    const message = error?.message || "Napaka pri pripravi vzorčnega projekta";
    return NextResponse.json({ status: "error", message }, { status: 500 });
  }
}
