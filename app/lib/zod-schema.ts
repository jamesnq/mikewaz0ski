import { $Enums } from "@prisma/client";
import { z } from "zod";

export const BrawlCoinsDataSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  pack: z.string(),
});
export type BrawlCoinsData = z.infer<typeof BrawlCoinsDataSchema>;

export const CreateOrderSchema = z
  .object({
    type: z.nativeEnum($Enums.OderType),
    buyer: z.object({
      platform: z.nativeEnum($Enums.BuyerPlatform),
      platformUserId: z.string(),
      username: z.string().optional(),
    }),
    data: BrawlCoinsDataSchema,
    // data: z.union([
    //   z.object({}), // An empty object schema for non-BrawlCoins types
    //   BrawlCoinsDataSchema,
    // ]),
  })
  .refine(
    (data) => {
      if (data.type === "BrawlCoins") {
        return BrawlCoinsDataSchema.safeParse(data.data).success;
      }
      return true;
    },
    (data) => {
      return {
        message: `Invalid data structure for ${data.type} order type`,
        path: ["data"],
      };
    }
  );
export const OrderConfirmRequest = z.object({
  orderId: z.string(),
});
