import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const csv = [
    "number,title,block,zone,discipline,status",
    "DEMO-AUR-B101-STR-900,Synthetic deck insert,B101,PORT,STRUCTURE,ACTIVE",
  ].join("\r\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="drawing-register-template.csv"',
      "cache-control": "no-store",
    },
  });
}
