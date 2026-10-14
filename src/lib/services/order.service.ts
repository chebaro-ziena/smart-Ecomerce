import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type { CheckoutInput } from "@/lib/validation/checkout";
import { OrderStatus } from "@prisma/client";


const currentOrderInclude = {
  items: {
    orderBy: { id: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          price: true,
          imageUrl: true,
          stock: true,
          published: true,
        },
      },
    },
  },
};

async function getOrCreatePendingOrder(userId: string) {
  const existingOrder = await prisma.order.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingOrder) {
    return existingOrder;
  }

  return prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      total: 0,
    },
  });
}

export async function getCurrentOrder(userId: string) {
  const order = await prisma.order.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: currentOrderInclude,
  });

  if (!order) {
    return {
      id: null,
      status: "PENDING" as const,
      items: [],
      itemCount: 0,
      total: 0,
    };
  }

  return formatOrder(order);
}

export async function addToOrder(
  userId: string,
  productId: string,
  quantity: number,
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      published: true,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
    },
  });

  if (!product) {
    throw new Error("PRODUCT_NOT_FOUND");
  }

  if (product.stock <= 0) {
    throw new Error("PRODUCT_OUT_OF_STOCK");
  }

  if (quantity > product.stock) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  const order = await getOrCreatePendingOrder(userId);

  const existingItem = await prisma.orderItem.findUnique({
    where: {
      orderId_productId: {
        orderId: order.id,
        productId,
      },
    },
  });

  const newQuantity = existingItem
    ? existingItem.quantity + quantity
    : quantity;

  if (newQuantity > product.stock) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  /*
   * We store the current product price as the order-item
   * snapshot price.
   *
   * Checkout will recalculate/validate pricing before payment.
   */
  await prisma.orderItem.upsert({
    where: {
      orderId_productId: {
        orderId: order.id,
        productId,
      },
    },
    create: {
      orderId: order.id,
      productId,
      quantity,
      price: product.price,
    },
    update: {
      quantity: newQuantity,
      price: product.price,
    },
  });

  await recalculateOrderTotal(order.id);

  return getCurrentOrder(userId);
}

export async function updateOrderItem(
  userId: string,
  itemId: string,
  quantity: number,
) {
  const item = await prisma.orderItem.findFirst({
    where: {
      id: itemId,
      order: {
        userId,
        status: "PENDING",
      },
    },
    include: {
      product: {
        select: {
          stock: true,
          published: true,
          price: true,
        },
      },
    },
  });

  if (!item) {
    throw new Error("ORDER_ITEM_NOT_FOUND");
  }

  if (!item.product.published) {
    throw new Error("PRODUCT_NOT_AVAILABLE");
  }

  if (item.product.stock <= 0) {
    throw new Error("PRODUCT_OUT_OF_STOCK");
  }

  if (quantity > item.product.stock) {
    throw new Error("INSUFFICIENT_STOCK");
  }

  await prisma.orderItem.update({
    where: {
      id: item.id,
    },
    data: {
      quantity,
      price: item.product.price,
    },
  });

  await recalculateOrderTotal(item.orderId);

  return getCurrentOrder(userId);
}

export async function removeOrderItem(
  userId: string,
  itemId: string,
) {
  const item = await prisma.orderItem.findFirst({
    where: {
      id: itemId,
      order: {
        userId,
        status: "PENDING",
      },
    },
  });

  if (!item) {
    throw new Error("ORDER_ITEM_NOT_FOUND");
  }

  await prisma.orderItem.delete({
    where: {
      id: item.id,
    },
  });

  await recalculateOrderTotal(item.orderId);

  return getCurrentOrder(userId);
}

async function recalculateOrderTotal(orderId: string) {
  const items = await prisma.orderItem.findMany({
    where: {
      orderId,
    },
    select: {
      quantity: true,
      price: true,
    },
  });

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  await prisma.order.update({
    where: {
      id: orderId,
    },
    data: {
      total,
    },
  });
}

function formatOrder(order: {
  id: string;
  status: OrderStatus;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      name: string;
      price: number;
      imageUrl: string;
      stock: number;
      published: boolean;
    };
  }>;
}) {
  const items = order.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    price: item.price,
    product: item.product,
    subtotal: item.price * item.quantity,
  }));

  const itemCount = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    id: order.id,
    status: order.status,
    items,
    itemCount,
    total: order.total,
  };
}

export async function prepareCheckout(
  userId: string,
  checkout: CheckoutInput,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: {
        userId,
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.items.length === 0) {
      throw new Error("EMPTY_ORDER");
    }

    const productIds = order.items.map((item) => item.productId);

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        stock: true,
        published: true,
      },
    });

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    let total = 0;

    for (const item of order.items) {
      const product = productMap.get(item.productId);

      if (!product || !product.published) {
        throw new Error("PRODUCT_NOT_AVAILABLE");
      }

      if (product.stock <= 0) {
        throw new Error("PRODUCT_OUT_OF_STOCK");
      }

      if (item.quantity > product.stock) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      // Keep the OrderItem price synchronized with
      // the current Product price.
      if (item.price !== product.price) {
        await tx.orderItem.update({
          where: {
            id: item.id,
          },
          data: {
            price: product.price,
          },
        });
      }

      total += product.price * item.quantity;
    }

    const updatedOrder = await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        firstName: checkout.firstName,
        lastName: checkout.lastName,
        email: checkout.email,
        phone: checkout.phone,
        address: checkout.address,
        city: checkout.city,
        total,
      },
      include: {
        items: {
          orderBy: {
            id: "asc",
          },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                imageUrl: true,
                stock: true,
                published: true,
              },
            },
          },
        },
      },
    });

    return updatedOrder;
  });
}

export async function decreaseProductStock(
  tx: Prisma.TransactionClient,
  productId: string,
  quantity: number,
) {
  const result = await tx.product.updateMany({
    where: {
      id: productId,
      published: true,
      stock: {
        gte: quantity,
      },
    },
    data: {
      stock: {
        decrement: quantity,
      },
    },
  });

  if (result.count !== 1) {
    throw new Error("INSUFFICIENT_STOCK");
  }
}

export async function reserveOrderStock(
  orderId: string,
  paymentId?: string,
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new Error("ORDER_NOT_FOUND");
    }

    if (order.items.length === 0) {
      throw new Error("EMPTY_ORDER");
    }

    // Already completed successfully.
    if (order.status === "PAID") {
      return order;
    }

    if (order.status !== "PENDING") {
      throw new Error("ORDER_NOT_PENDING");
    }

    // If this operation is connected to a payment,
    // mark that payment as SUCCEEDED inside the same transaction.
    if (paymentId) {
      const payment = await tx.payment.findFirst({
        where: {
          id: paymentId,
          orderId: order.id,
        },
      });

      if (!payment) {
        throw new Error("PAYMENT_NOT_FOUND");
      }

      // Idempotency:
      // if the payment is already succeeded, don't process it again.
      if (payment.status === "SUCCEEDED") {
        throw new Error("PAYMENT_ALREADY_COMPLETED");
      }

      if (payment.status !== "PENDING") {
        throw new Error("PAYMENT_NOT_PENDING");
      }

      await tx.payment.update({
        where: {
          id: payment.id,
          status: "PENDING",
        },
        data: {
          status: "SUCCEEDED",
        },
      });
    }

    // Decrease stock atomically.
    for (const item of order.items) {
      await decreaseProductStock(
        tx,
        item.productId,
        item.quantity,
      );
    }

    // Mark order as PAID.
    const updatedOrder = await tx.order.update({
      where: {
        id: order.id,
        status: "PENDING",
      },
      data: {
        status: "PAID",
      },
      include: {
        items: true,
      },
    });

    return updatedOrder;
  });
}