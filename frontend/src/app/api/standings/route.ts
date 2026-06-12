import { NextResponse } from "next/server";
import { fetchStandings } from "../../standings";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const standings = await fetchStandings();
    return NextResponse.json({ standings });
  } catch {
    return NextResponse.json({ standings: [] });
  }
}
