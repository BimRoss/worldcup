import { NextResponse } from "next/server";
import { fetchUSOpen } from "../../usopen";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const usopen = await fetchUSOpen();
    return NextResponse.json({ usopen });
  } catch {
    return NextResponse.json({ usopen: null });
  }
}
