import { prisma } from "@/lib/prisma";
import {
  decodeCursor,
  encodeCursor,
  type ProductCursor,
} from "@/lib/pagination";
import type { ProductQuery } from "@/lib/validation/product";

function buildCursorFilter(cursor: ProductCursor) {
  switch (cursor.sort) {
    case "newest":
      return {
        OR: [
          {
            createdAt: {
              lt: new Date(cursor.value),
            },
          },
          {
            createdAt: new Date(cursor.value),
            id: {
              lt: cursor.id,
            },
          },
        ],
      };

    case "oldest":
      return {
        OR: [
          {
            createdAt: {
              gt: new Date(cursor.value),
            },
          },
          {
            createdAt: new Date(cursor.value),
            id: {
              gt: cursor.id,
            },
          },
        ],
      };

    case "price_asc":
      return {
        OR: [
          {
            price: {
              gt: Number(cursor.value),
            },
          },
          {
            price: Number(cursor.value),
            id: {
              gt: cursor.id,
            },
          },
        ],
      };

    case "price_desc":
      return {
        OR: [
          {
            price: {
              lt: Number(cursor.value),
            },
          },
          {
            price: Number(cursor.value),
            id: {
              lt: cursor.id,
            },
          },
        ],
      };

    case "name_asc":
      return {
        OR: [
          {
            name: {
              gt: String(cursor.value),
            },
          },
          {
            name: String(cursor.value),
            id: {
              gt: cursor.id,
            },
          },
        ],
      };

    case "name_desc":
      return {
        OR: [
          {
            name: {
              lt: String(cursor.value),
            },
          },
          {
            name: String(cursor.value),
            id: {
              lt: cursor.id,
            },
          },
        ],
      };
  }
}

function buildOrderBy(sort: ProductQuery["sort"]) {
  switch (sort) {
    case "newest":
      return [
        { createdAt: "desc" as const },
        { id: "desc" as const },
      ];

    case "oldest":
      return [
        { createdAt: "asc" as const },
        { id: "asc" as const },
      ];

    case "price_asc":
      return [
        { price: "asc" as const },
        { id: "asc" as const },
      ];

    case "price_desc":
      return [
        { price: "desc" as const },
        { id: "desc" as const },
      ];

    case "name_asc":
      return [
        { name: "asc" as const },
        { id: "asc" as const },
      ];

    case "name_desc":
      return [
        { name: "desc" as const },
        { id: "desc" as const },
      ];
  }
}

function getCursorFromProduct(
  product: {
    id: string;
    createdAt: Date;
    price: number;
    name: string;
  },
  sort: ProductQuery["sort"],
): ProductCursor {
  switch (sort) {
    case "newest":
    case "oldest":
      return {
        sort,
        value: product.createdAt.toISOString(),
        id: product.id,
      };

    case "price_asc":
    case "price_desc":
      return {
        sort,
        value: product.price,
        id: product.id,
      };

    case "name_asc":
    case "name_desc":
      return {
        sort,
        value: product.name,
        id: product.id,
      };
  }
}

export async function getProducts(query: ProductQuery) {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    limit,
    cursor,
    sort,
  } = query;

  const cursorData = decodeCursor(cursor);

  if (cursor && !cursorData) {
    throw new Error("INVALID_CURSOR");
  }

  if (cursorData && cursorData.sort !== sort) {
    throw new Error("CURSOR_SORT_MISMATCH");
  }

  const filters = [
    {
      published: true,
    },
  ];

  if (category) {
    filters.push({
      category: {
        slug: category,
      },
    } as never);
  }

  if (search) {
    filters.push({
      OR: [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          tags: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    } as never);
  }

  if (minPrice !== undefined) {
    filters.push({
      price: {
        gte: minPrice,
      },
    } as never);
  }

  if (maxPrice !== undefined) {
    filters.push({
      price: {
        lte: maxPrice,
      },
    } as never);
  }

  if (cursorData) {
    filters.push(buildCursorFilter(cursorData) as never);
  }

  const products = await prisma.product.findMany({
    where: {
      AND: filters,
    },
    include: {
      category: true,
    },
    orderBy: buildOrderBy(sort),
    take: limit + 1,
  });

  const hasNextPage = products.length > limit;

  const items = hasNextPage
    ? products.slice(0, limit)
    : products;

  const lastProduct = items[items.length - 1];

  const nextCursor =
    hasNextPage && lastProduct
      ? encodeCursor(
          getCursorFromProduct(lastProduct, sort),
        )
      : null;

  return {
    items,
    pagination: {
      limit,
      hasNextPage,
      nextCursor,
    },
  };
}

