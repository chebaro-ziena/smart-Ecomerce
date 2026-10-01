import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/services/product.service";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PRODUCTS_PER_PAGE = 20;

export default async function HomePage({
  searchParams,
}: {
  searchParams: {
    category?: string;
    cursor?: string;
    sort?: string;
  };
}) {
  const category = searchParams.category;

  const sort = [
    "newest",
    "oldest",
    "price_asc",
    "price_desc",
    "name_asc",
    "name_desc",
  ].includes(searchParams.sort ?? "")
    ? (searchParams.sort as
        | "newest"
        | "oldest"
        | "price_asc"
        | "price_desc"
        | "name_asc"
        | "name_desc")
    : "newest";

  let result;

  try {
    result = await getProducts({
      category,
      cursor: searchParams.cursor,
      limit: PRODUCTS_PER_PAGE,
      sort,
    });
  } catch (error) {
    console.error("Failed to load products:", error);

    result = {
      items: [],
      pagination: {
        limit: PRODUCTS_PER_PAGE,
        hasNextPage: false,
        nextCursor: null,
      },
    };
  }

  const { items: products, pagination } = result;

  const categories = await import("@/lib/prisma").then(
    async ({ prisma }) => {
      return prisma.category.findMany({
        orderBy: {
          name: "asc",
        },
      });
    },
  );

  function buildUrl(params: {
    category?: string;
    cursor?: string | null;
    sort?: string;
  }) {
    const search = new URLSearchParams();

    if (params.category) {
      search.set("category", params.category);
    }

    if (params.sort && params.sort !== "newest") {
      search.set("sort", params.sort);
    }

    if (params.cursor) {
      search.set("cursor", params.cursor);
    }

    const query = search.toString();

    return query ? `/?${query}` : "/";
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-8 text-white">
        <h1 className="text-3xl font-bold">
          Shop smarter, powered by AI
        </h1>

        <p className="mt-2 max-w-xl text-brand-50">
          Every listing here was written automatically — the admin
          just uploads a photo.
        </p>
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={buildUrl({ sort })}
          className={`rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium ${
            !category
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100"
          }`}
        >
          All
        </Link>

        {categories.map((c) => (
          <Link
            key={c.id}
            href={buildUrl({
              category: c.slug,
              sort,
            })}
            className={`rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium ${
              category === c.slug
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={buildUrl({
            category,
            sort: "newest",
          })}
          className={`rounded-lg border px-3 py-2 text-sm ${
            sort === "newest"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Newest
        </Link>

        <Link
          href={buildUrl({
            category,
            sort: "price_asc",
          })}
          className={`rounded-lg border px-3 py-2 text-sm ${
            sort === "price_asc"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Price: Low → High
        </Link>

        <Link
          href={buildUrl({
            category,
            sort: "price_desc",
          })}
          className={`rounded-lg border px-3 py-2 text-sm ${
            sort === "price_desc"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Price: High → Low
        </Link>

        <Link
          href={buildUrl({
            category,
            sort: "name_asc",
          })}
          className={`rounded-lg border px-3 py-2 text-sm ${
            sort === "name_asc"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-700"
          }`}
        >
          Name: A → Z
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">
          No products yet. An admin can add the first one from the{" "}
          <Link
            href="/admin"
            className="text-brand-600 underline"
          >
            dashboard
          </Link>
          .
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>

          {pagination.hasNextPage &&
            pagination.nextCursor && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={buildUrl({
                    category,
                    sort,
                    cursor: pagination.nextCursor,
                  })}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Load more
                </Link>
              </div>
            )}
        </>
      )}
    </div>
  );
}

