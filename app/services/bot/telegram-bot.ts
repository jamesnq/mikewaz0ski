import { Context, Telegraf } from "telegraf";
import prisma from "../db.server";
import discordBot from "./discord/discord-bot";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { fileURLToPath } from "url";
const telegramBot = new Telegraf(process.env.TELEGRAM_TOKEN);

telegramBot.on("callback_query", async (ctx: Context) => {
  if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
  const data = ctx.callbackQuery.data;
  if (data.startsWith("order_verify_code")) {
    const orderId = data.split("|")[1];
    const messageId = data.split("|")[2];
    if (!orderId || !messageId)
      return await ctx.answerCbQuery("Mã đơn hoặc mã tin nhắn không xác định");
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { Buyer: true },
    });

    if (!dbOrder) return await ctx.answerCbQuery("Không tìm thấy đơn!");

    const user = await discordBot.users.fetch(dbOrder.Buyer.platformUserId);

    const button = new ButtonBuilder()
      .setCustomId(`open_order_verify_code|${dbOrder.id}|${messageId}`)
      .setLabel("Enter Verification Code")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
    const message = await user.send({
      content: `Please enter the verification code for your order (Order ID: ${orderId}).`,
      components: [row],
    });

    if (message) {
      await ctx.answerCbQuery(`Thông báo đã được gửi.`);
    } else {
      await ctx.answerCbQuery("Gửi thông báo không thành công!");
    }
  }

  if (data.startsWith("notify_in")) {
    const orderId = data.split("|")[1];
    if (!orderId) return await ctx.answerCbQuery("Mã đơn không  xác định");
    const dbOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { Buyer: true },
    });

    if (!dbOrder) return await ctx.answerCbQuery("Không tìm thấy đơn");

    const user = await discordBot.users.fetch(dbOrder.Buyer.platformUserId);

    const message = await user.send({
      content: `We has logged in, please be patient order is processing.`,
    });

    if (message) {
      await ctx.answerCbQuery(`Thông báo đã được gửi.`);
    } else {
      await ctx.answerCbQuery("Gửi thông báo không thành công!");
    }
  }

  if (data.startsWith("order_finish")) {
    const orderId = data.split("|")[1];
    const messageId = data.split("|")[2];
    if (!orderId || !messageId)
      return await ctx.answerCbQuery("Mã đơn hoặc mã tin nhắn không xác định");

    await ctx.reply(`Gửi ảnh hoàn thành đơn (Mã đơn: ${orderId})`);
  }
});

telegramBot.on("photo", async (ctx) => {
  const repliedMessage = ctx.message.reply_to_message;
  if (repliedMessage) {
    // Skip the error message
    const message = repliedMessage.text;
    const match = message.match(/\(Mã đơn: (\w+)\)$/);
    const orderId = match[1];
    const photo = ctx.message.photo;
    const highestResPhoto = photo[photo.length - 1];
    const fileId = highestResPhoto.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);
    const dbOrder = await prisma.order.update({
      where: { id: orderId, status: "InProcess" },
      data: { status: "Completed" },
      include: { Buyer: true },
    });

    const user = await discordBot.users.fetch(dbOrder.Buyer.platformUserId);
    // Send the file to the Discord user
    const dcMessage = await user.send({
      content: `Your order with order ID: ${orderId} has finished. Thanks for your purchase! Please vouch for us!\n${fileLink}`,
    });

    if (dcMessage) {
      await ctx.reply(`Ảnh đã được gửi cho khách (Mã đơn: ${orderId}).`);
    } else {
      await ctx.reply("Gửi không thành công.");
    }
  }
});

export default telegramBot;
