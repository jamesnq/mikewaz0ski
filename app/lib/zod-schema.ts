import { $Enums } from "@prisma/client";
import { z } from "zod";

export const YoutubePremiumDataSchema = z.object({
  email: z.string().email(),
});
export type YoutubePremiumData = z.infer<typeof YoutubePremiumDataSchema>;

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

    data: z.any(),
  })
  .refine(
    (data) => {
      if (data.type === "BrawlCoins") {
        return BrawlCoinsDataSchema.safeParse(data.data).success;
      }
      if (data.type === "YoutubePremium") {
        return YoutubePremiumDataSchema.safeParse(data.data).success;
      }
      return false;
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

export const GetBalance = z.object({
  platform: z.nativeEnum($Enums.BuyerPlatform),
  platformUserId: z.string(),
});
