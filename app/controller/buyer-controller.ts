import {
  AddBalanceSchema,
  BuyerSchema,
  SendBalanceSchema,
} from "@/lib/zod-schema";
import { formatToken } from "@/services/bot/discord/utils/formatToken";
import prisma from "@/services/db.server";
import { z } from "zod";
import { BuyerPlatform } from "@prisma/client";

// Custom Error Classes
class WalletNotFoundError extends Error {
  constructor() {
    super(
      `User does not have a wallet. Please create one using the /wallet create command.`
    );
    this.name = "WalletNotFoundError";
  }
}

class DuplicateWalletError extends Error {
  constructor() {
    super("Wallet already exists for this user.");
    this.name = "DuplicateWalletError";
  }
}

class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient balance.");
    this.name = "InsufficientBalanceError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class BuyerNotFoundError extends Error {
  constructor() {
    super("Buyer not found.");
    this.name = "BuyerNotFoundError";
  }
}

export class BuyerController {
  // Validates that a wallet exists for the given platform and user ID.
  async validateWallet(platform: BuyerPlatform, platformUserId: string) {
    const buyer = await prisma.buyer.findUnique({
      where: { platform_platformUserId: { platform, platformUserId } },
      select: { walletId: true, username: true },
    });

    if (!buyer || !buyer.walletId) {
      throw new WalletNotFoundError();
    }

    return { walletId: buyer.walletId, username: buyer.username };
  }

  async createWallet(buyerData: z.infer<typeof BuyerSchema>) {
    const result = BuyerSchema.safeParse(buyerData);
    if (!result.success) throw new ValidationError(result.error.message);

    const { platform, platformUserId } = result.data;

    const existingBuyer = await prisma.buyer.findUnique({
      where: { platform_platformUserId: { platform, platformUserId } },
    });

    if (existingBuyer?.walletId) {
      throw new DuplicateWalletError();
    }

    const wallet = await prisma.$transaction(async (prisma) => {
      const newWallet = await prisma.wallet.create({ data: { balance: 0 } });
      await prisma.buyer.upsert({
        where: { platform_platformUserId: { platform, platformUserId } },
        create: { platform, platformUserId, walletId: newWallet.id },
        update: { walletId: newWallet.id },
      });
      return newWallet;
    });

    return {
      success: true,
      message: `Wallet created successfully with ID: ${wallet.id}.`,
    };
  }

  async getBalance(buyerData: z.infer<typeof BuyerSchema>) {
    const result = BuyerSchema.safeParse(buyerData);
    if (!result.success) throw new ValidationError(result.error.message);

    const { platform, platformUserId } = result.data;

    const buyer = await prisma.buyer.findUnique({
      where: { platform_platformUserId: { platform, platformUserId } },
      select: { Wallet: { select: { balance: true } } },
    });

    if (!buyer) throw new BuyerNotFoundError();
    if (!buyer.Wallet) throw new WalletNotFoundError();

    const balance = buyer.Wallet.balance;
    return {
      balance,
      message: `Your current balance is ${balance} ${formatToken(balance)}.`,
    };
  }

  async sendBalance(sendBalanceData: z.infer<typeof SendBalanceSchema>) {
    const result = SendBalanceSchema.safeParse(sendBalanceData);
    if (!result.success) throw new ValidationError(result.error.message);

    const { amount, sendWalletId, receiveWalletId, type } = result.data;

    // Validate both sender and receiver wallets.
    const [sender, receiver] = await Promise.all([
      this.validateWallet(BuyerPlatform.Discord, sendWalletId),
      this.validateWallet(BuyerPlatform.Discord, receiveWalletId),
    ]);

    const sendWallet = await prisma.wallet.findUnique({
      where: { id: sender.walletId },
    });
    const receiveWallet = await prisma.wallet.findUnique({
      where: { id: receiver.walletId },
    });

    if (!sendWallet || !receiveWallet) throw new WalletNotFoundError();
    if (sendWallet.balance < amount) throw new InsufficientBalanceError();

    await prisma.$transaction(async (prisma) => {
      await prisma.wallet.update({
        where: { id: sendWallet.id },
        data: { balance: { decrement: amount } },
      });

      await prisma.wallet.update({
        where: { id: receiveWallet.id },
        data: { balance: { increment: amount } },
      });

      await prisma.transactionHistory.create({
        data: {
          amount,
          type,
          sendWalletId: sendWallet.id,
          receiveWalletId: receiveWallet.id,
        },
      });
    });

    return {
      success: true,
      message: `Successfully sent ${amount} ${formatToken(amount)} from ${
        sender.username
      } to ${receiver.username}.`,
    };
  }

  async addBalance(addBalanceData: z.infer<typeof AddBalanceSchema>) {
    const result = AddBalanceSchema.safeParse(addBalanceData);
    if (!result.success) throw new ValidationError(result.error.message);

    const { platform, platformUserId, amount, type } = result.data;
    const { walletId, username } = await this.validateWallet(
      platform,
      platformUserId
    );

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: amount } },
    });

    await prisma.transactionHistory.create({
      data: { amount, type, sendWalletId: null, receiveWalletId: walletId },
    });

    return {
      success: true,
      message: `Added ${amount} ${formatToken(amount)} to ${username}. 
New balance: ${updatedWallet.balance} ${formatToken(updatedWallet.balance)}.`,
    };
  }
}

export const buyerController = new BuyerController();
