import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data: Record<string, unknown> = {};

    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.description === "string") data.description = body.description;
    if (typeof body.tags === "string") data.tags = body.tags;
    if (typeof body.price === "number") data.price = body.price;
    if (typeof body.stock === "number") data.stock = body.stock;
    if (typeof body.published === "boolean") data.published = body.published;

    const product = await prisma.product.update({
      where: { id: params.id },
      data,
      include: { category: true },
    });

    return NextResponse.json({ product });
  } catch (error) {
    logError(error, { route: "/api/admin/products/[id] PATCH", id: params.id });
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await prisma.product.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logError(error, { route: "/api/admin/products/[id] DELETE", id: params.id });
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
