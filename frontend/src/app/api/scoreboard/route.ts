import { NextResponse } from "next/server";
import { fetchScoreboard } from "../../scores";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const scoreboard = await fetchScoreboard(new Date());
    return NextResponse.json({ scoreboard });
  } catch {
    return NextResponse.json({ scoreboard: [] });
  }
}
