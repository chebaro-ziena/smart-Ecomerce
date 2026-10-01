export type ProductSort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc";

export type ProductCursor = {
  sort: ProductSort;
  value: string | number;
  id: string;
};

export function encodeCursor(cursor: ProductCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(cursor?: string): ProductCursor | null {
  if (!cursor) return null;

  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.id !== "string" ||
      typeof parsed.sort !== "string"
    ) {
      return null;
    }

    const validSorts: ProductSort[] = [
      "newest",
      "oldest",
      "price_asc",
      "price_desc",
      "name_asc",
      "name_desc",
    ];

    if (!validSorts.includes(parsed.sort)) {
      return null;
    }

    if (
      typeof parsed.value !== "string" &&
      typeof parsed.value !== "number"
    ) {
      return null;
    }

    return {
      sort: parsed.sort,
      value: parsed.value,
      id: parsed.id,
    };
  } catch {
    return null;
  }
}

