import { CreateOrderSchema, OrderConfirmRequest } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { z } from "zod";

class OrderController {
  async create(data: z.infer<typeof CreateOrderSchema>) {
    const order = CreateOrderSchema.parse(data);
    return await prisma.order.create({
      data: {
        type: order.type,
        Buyer: {
          connectOrCreate: {
            where: {
              platform_platformUserId: {
                platform: order.buyer.platform,
                platformUserId: order.buyer.platformUserId,
              },
            },
            create: order.buyer,
          },
        },
        data: order.data,
      },
    });
  }
  async confirm({ orderId }: z.infer<typeof OrderConfirmRequest>) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, type: true, status: true },
    });
    if (!order) {
      throw Error("Confirm fail order not found!");
    }
    if (order.status !== "Pending") {
      throw Error(
        "Confirm fail cannot confirm when the status is not Pending!"
      );
    }
    if (order.type === "BrawlCoins") {
    }
    return await prisma.order.update({
      where: { id: orderId },
      data: { status: "InProcess" },
    });
  }
}

export const orderController = new OrderController();
