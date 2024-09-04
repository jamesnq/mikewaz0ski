import { CreateOrderSchema } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { z } from "zod";
export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") return;

  const requestData: z.infer<typeof CreateOrderSchema> = {
    type: "BrawlCoins",
    buyer: {
      platform: "Discord",
      platformUserId: "123",
      username: "rot4tion",
    },
    data: { email: "test@gmail.com", password: "asdasd", pack: "120 coins" },
  };
  const order = CreateOrderSchema.parse(requestData);
  await prisma.order.create({
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
  return new Response("ok");
}
