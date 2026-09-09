import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  mode: z.enum(["create", "join"]),
  teamName: z.string().optional(),
  inviteCode: z.string().optional(),
});

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your details and try again." }, { status: 400 });
  }
  const { name, email, password, mode, teamName, inviteCode } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "That email is already registered." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  if (mode === "create") {
    if (!teamName) {
      return NextResponse.json({ error: "Team name is required." }, { status: 400 });
    }
    let code = generateInviteCode();
    while (await prisma.team.findUnique({ where: { inviteCode: code } })) {
      code = generateInviteCode();
    }
    const team = await prisma.team.create({
      data: { name: teamName, inviteCode: code },
    });
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "director",
        teamId: team.id,
      },
    });
    return NextResponse.json({ ok: true, inviteCode: code });
  }

  if (mode === "join") {
    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
    }
    const team = await prisma.team.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });
    if (!team) {
      return NextResponse.json({ error: "That invite code doesn't match a team." }, { status: 404 });
    }
    await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        role: "member",
        teamId: team.id,
      },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}
