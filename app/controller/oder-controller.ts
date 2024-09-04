import { CreateOrderSchema } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { z } from "zod";

class OrderController {
  async create(data: z.infer<typeof CreateOrderSchema>) {
    const order = CreateOrderSchema.parse(data);
    return await prisma.order.create({
      data: {
        type: "BrawlCoins",
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
}

export const orderController = new OrderController();
