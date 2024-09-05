import { Context, Telegraf } from "telegraf";
import prisma from "../db.server";
import discordBot from "./discord/discord-bot";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
const telegramBot = new Telegraf(process.env.TELEGRAM_TOKEN);
telegramBot.on("callback_query", async (ctx: Context) => {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
  const data = ctx.callbackQuery.data;
  if (data.startsWith("order_verify_code")) {
    const orderId = data.split("|")[1];
    if (!orderId) return await ctx.answerCbQuery("orderId undefined");
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { Buyer: true },
    });

    if (!dbOrder) return await ctx.answerCbQuery("Order not found!");

    const user = await discordBot.users.fetch(dbOrder.Buyer.platformUserId);

    const button = new ButtonBuilder()
      .setCustomId(`open_order_verify_code|${dbOrder.id}`)
      .setLabel("Enter Verification Code")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    const message = await user.send({
      content: `Please enter the verification code for your order (Order ID: ${orderId}).`,
      components: [row],
    });

    if (message) {
      await ctx.answerCbQuery(`Verification request sent to Discord bot.`);
    } else {
      await ctx.answerCbQuery("Send verification fail!");
    }
  }
});

export default telegramBot;
