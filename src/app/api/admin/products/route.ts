import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/requireAdmin";
import { prisma } from "@/lib/prisma";
import { saveImageFromFile } from "@/lib/saveImage";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await req.formData();
    const image = form.get("image");
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const tags = String(form.get("tags") ?? "").trim();
    const categoryName = String(form.get("category") ?? "").trim();
    const price = parseFloat(String(form.get("price") ?? "0")) || 0;
    const stock = parseInt(String(form.get("stock") ?? "0"), 10) || 0;
    const aiGenerated = String(form.get("aiGenerated") ?? "false") === "true";

    if (!(image instanceof File)) {
      return NextResponse.json({ error: "An image file is required" }, { status: 400 });
    }
    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const imageUrl = await saveImageFromFile(image);

    let categoryId: string | undefined;
    if (categoryName) {
      const slug = categoryName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      const category = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name: categoryName, slug },
      });
      categoryId = category.id;
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        tags,
        price,
        stock,
        imageUrl,
        aiGenerated,
        categoryId,
      },
      include: { category: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    logError(error, { route: "/api/admin/products POST" });
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
