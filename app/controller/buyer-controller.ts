import { GetBalance } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { z } from "zod";

class BuyerController {
  async getBalance({ platformUserId, platform }: z.infer<typeof GetBalance>) {
    const buyer = await prisma.buyer.findUnique({
      where: {
        platform_platformUserId: {
          platform,
          platformUserId,
        },
      },
      select: {
        balance: true,
      },
    });

    // Check if buyer exists and return the balance or handle the case where buyer is not found
    if (buyer) {
      return { balance: buyer.balance };
    } else {
      throw new Error("Buyer not found");
    }
  }
}
