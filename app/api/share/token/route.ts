import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const share = await prisma.shareToken.findUnique({ where: { userId: session.user.id } });
  if (!share) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/u/${share.token}`;
  return NextResponse.json({ token: share.token, url, isActive: share.isActive });
}

export async function POST() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Upsert: create or regenerate (new cuid token invalidates old link)
  const share = await prisma.shareToken.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: { token: crypto.randomUUID(), isActive: true },
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/u/${share.token}`;
  return NextResponse.json({ token: share.token, url, isActive: share.isActive });
}

export async function PUT(request: NextRequest) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { isActive } = await request.json();
  if (typeof isActive !== "boolean") {
    return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
  }

  const share = await prisma.shareToken.update({
    where: { userId: session.user.id },
    data: { isActive },
  });

  const url = `${process.env.NEXT_PUBLIC_APP_URL}/u/${share.token}`;
  return NextResponse.json({ token: share.token, url, isActive: share.isActive });
}
