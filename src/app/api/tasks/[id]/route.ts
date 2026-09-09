import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["planned", "in_progress", "done"]),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.teamId !== session.user.teamId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (task.authorId !== session.user.id) {
    return NextResponse.json({ error: "Only the author can update this entry." }, { status: 403 });
  }

  const data: { status: string; startedAt?: Date; doneAt?: Date | null } = {
    status: parsed.data.status,
  };
  const now = new Date();
  if (parsed.data.status === "in_progress" && !task.startedAt) {
    data.startedAt = now;
  }
  if (parsed.data.status === "done") {
    data.doneAt = now;
    if (!task.startedAt) data.startedAt = now;
  }
  if (parsed.data.status === "planned") {
    data.doneAt = null;
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data,
    include: { author: { select: { id: true, name: true, role: true } } },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const task = await prisma.task.findUnique({ where: { id: params.id } });
  if (!task || task.teamId !== session.user.teamId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (task.authorId !== session.user.id) {
    return NextResponse.json({ error: "Only the author can delete this entry." }, { status: 403 });
  }

  await prisma.task.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
