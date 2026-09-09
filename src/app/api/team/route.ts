import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findUnique({ where: { id: session.user.teamId } });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: team.id, name: team.name, inviteCode: team.inviteCode });
}
