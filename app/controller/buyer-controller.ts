import {
  AddBalanceSchema,
  BuyerSchema,
  SendBalanceSchema,
} from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { Buyer, BuyerPlatform } from "@prisma/client";
import { z } from "zod";

class BuyerController {
  async getBalance(buyerData: z.infer<typeof BuyerSchema>) {
    const result = BuyerSchema.safeParse(buyerData);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const { platform, platformUserId } = result.data;
    const buyer = await prisma.buyer.findUnique({
      where: {
        platform_platformUserId: {
          platform,
          platformUserId,
        },
      },
      select: {
        Wallet: {
          select: {
            balance: true,
          },
        },
      },
    });

    // Check if buyer exists and return the balance or handle the case where buyer is not found
    if (!buyer) {
      throw new Error("Buyer not found");
    }
    return { balance: !buyer.Wallet ? 0 : buyer.Wallet.balance };
  }

  async sendBalance(sendBalanceData: z.infer<typeof SendBalanceSchema>) {
    const result = SendBalanceSchema.safeParse(sendBalanceData);
    if (!result.success) {
      throw new Error(result.error.message);
    }
    const { amount, sendWalletId, receiveWalletId, type } = result.data;

    const sendWallet = await prisma.wallet.findUnique({
      where: {
        id: sendWalletId,
      },
    });

    const receiveWallet = await prisma.wallet.findUnique({
      where: {
        id: receiveWalletId,
      },
    });

    if (!sendWallet || !receiveWallet) {
      throw new Error("Invalid wallet");
    }

    if (sendWallet.balance < amount) {
      throw new Error("Insufficient balance");
    }

    await prisma.transactionHistory.create({
      data: {
        amount,
        type: type,
        sendWalletId,
        receiveWalletId,
      },
    });

    return {
      success: true,
      message: `Transferred ${amount} from ${sendWalletId} to ${receiveWalletId}`,
    };
  }

  // async adminAddBalance(addBalanceData: z.infer<typeof AddBalanceSchema>) {
  //   const result = AddBalanceSchema.safeParse(addBalanceData);
  //   if (!result.success) {
  //     throw new Error(result.error.message);
  //   }
  //   const { platform, platformUserId, amount, type } = result.data;

  //   const user = await prisma.buyer.update({
  //     where: {
  //       platform_platformUserId: {
  //         platform,
  //         platformUserId,
  //       },
  //     },
  //     data: {
  //       Wallet: {
  //         upsert: {
  //           update: {
  //             balance: {
  //               increment: amount,
  //             },
  //           },
  //           create: {
  //             balance: amount,
  //           },
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       Wallet: {
  //         select: {
  //           balance: true,
  //           id: true,
  //         },
  //       },
  //     },
  //   });

  //   return {
  //     success: true,
  //     message: `Added ${amount} to buyer ${platformUserId}. User new balance is ${
  //       user.Wallet!.balance
  //     }`,
  //   };
  // }

  // async userSendBalance(addBalanceData: z.infer<typeof AddBalanceSchema>) {
  //   const result = AddBalanceSchema.safeParse(addBalanceData);
  //   if (!result.success) {
  //     throw new Error(result.error.message);
  //   }
  //   const { platform, platformUserId, amount, type } = result.data;

  //   const user = await prisma.buyer.update({
  //     where: {
  //       platform_platformUserId: {
  //         platform,
  //         platformUserId,
  //       },
  //     },
  //     data: {
  //       Wallet: {
  //         upsert: {
  //           update: {
  //             balance: {
  //               increment: amount,
  //             },
  //           },
  //           create: {
  //             balance: amount,
  //           },
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       Wallet: {
  //         select: {
  //           balance: true,
  //           id: true,
  //         },
  //       },
  //     },
  //   });

  //   return {
  //     success: true,
  //     message: `Added ${amount} to buyer ${platformUserId}. User new balance is ${
  //       user.Wallet!.balance
  //     }`,
  //   };
  // }

  // async updateAllBuyersBalance(amount: number) {
  //   try {
  //     const result = await prisma.buyer.updateMany({
  //       where: {
  //         walletId: {
  //           equals: undefined,
  //         },
  //       },
  //       data: {},
  //     });

  //     return {
  //       success: true,
  //       updatedCount: result.count,
  //       message: `Updated balance for ${result.count} buyers`,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: `Failed to update balances: ${(error as Error).message}`,
  //     };
  //   }
  // }

  // async getBalanceLeaderboard(limit: number = 10) {
  //   try {
  //     const leaderboard = await prisma.buyer.findMany({
  //       select: {
  //         platformUserId: true,
  //         Wallet: {
  //           select: {
  //             balance: true,
  //           },
  //         },
  //         username: true,
  //       },
  //       orderBy: {
  //         Wallet: {
  //           balance: "desc",
  //         },
  //       },
  //       take: limit,
  //     });

  //     return {
  //       success: true,
  //       leaderboard,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error: `Failed to fetch leaderboard: ${(error as Error).message}`,
  //     };
  //   }
  // }

  // async updateAllWallet(): Promise<void> {
  //   const buyer = await prisma.buyer.findMany({
  //     where: {
  //       Wallet: {
  //         is: null,
  //       },
  //     },
  //   });

  //   if (buyer.length === 0) {
  //     return;
  //   }
  //   for (const b of buyer) {
  //     const wallet = await prisma.wallet.create({
  //       data: {},
  //     });
  //     await prisma.buyer.update({
  //       where: {
  //         id: b.id,
  //       },
  //       data: {
  //         walletId: wallet.id,
  //       },
  //     });
  //   }
  // }
}

export const buyerController = new BuyerController();
