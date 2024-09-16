import { AddBalance, GetBalance } from "@/lib/zod-schema";
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

  async addBalance({
    platformUserId,
    platform,
    amount,
  }: z.infer<typeof AddBalance>) {
    try {
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

      if (!buyer) {
        throw new Error(
          `Buyer not found for platformUserId: ${platformUserId}, platform: ${platform}`
        );
      }

      const newBalance = buyer.balance + amount;

      await prisma.buyer.update({
        where: {
          platform_platformUserId: {
            platform,
            platformUserId,
          },
        },
        data: {
          balance: newBalance,
        },
      });

      console.log(
        `Balance updated successfully for user ${platformUserId}. New balance: ${newBalance}`
      );
    } catch (error) {
      console.error(`Error in addBalance: ${(error as Error).message}`);
      throw error; // Re-throw the error for higher-level error handling
    }
  }

  async updateAllBuyersBalance(amount: number) {
    try {
      const result = await prisma.buyer.updateMany({
        data: {
          balance: amount,
        },
      });

      return {
        success: true,
        updatedCount: result.count,
        message: `Updated balance for ${result.count} buyers`,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update balances: ${(error as Error).message}`,
      };
    }
  }

  async getBalanceLeaderboard(limit: number = 10) {
    try {
      const leaderboard = await prisma.buyer.findMany({
        select: {
          platformUserId: true,
          balance: true,
          username: true,
        },
        orderBy: {
          balance: "desc",
        },
        take: limit,
      });

      return {
        success: true,
        leaderboard,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch leaderboard: ${(error as Error).message}`,
      };
    }
  }
}

export const buyerController = new BuyerController();
