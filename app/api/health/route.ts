import { NextResponse } from "next/server";
import { getHealth } from "@/lib/bootstrap";

export async function GET() {
  const status = await getHealth();
  return NextResponse.json(status);
}
