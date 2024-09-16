import { GetBalance } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { z } from "zod";

class BuyerController {
  async getBalance({ platformUserId, platform }: z.infer<typeof GetBalance>) {
    // const buyer = await prisma.buyer.findUnique({
    //     where: { platformUserId: platformUserId, platform: platform},
    //     select: {  },
    //   });
  }
}
