import { Context, Telegraf } from "telegraf";
import prisma from "../db.server";
import discordBot from "./discord/discord-bot";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import { join } from "path";
import { unlink } from "fs/promises";
import { createWriteStream } from "fs";
import axios from "axios";
import { fileURLToPath } from "url";
import { dirname } from "path";
const telegramBot = new Telegraf(process.env.TELEGRAM_TOKEN);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pendingPhotos = new Map<string, { orderId: string; messageId: string }>();

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

    // Store orderId and messageId for the current user to await their photo upload
    pendingPhotos.set(ctx.from!.id.toString(), { orderId, messageId });

    await ctx.reply(`Gửi ảnh hoàn thành đơn (Mã đơn: ${orderId})`);
  }
});

telegramBot.on("photo", async (ctx) => {
  const userId = ctx.from.id.toString();

  if (pendingPhotos.has(userId)) {
    const { orderId, messageId } = pendingPhotos.get(userId)!;
    const photo = ctx.message.photo;
    const highestResPhoto = photo[photo.length - 1];
    const fileId = highestResPhoto.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const fileName = `order_${orderId}_${messageId}.jpg`;
    const filePath = join(__dirname, fileName);

    const fileStream = createWriteStream(filePath);
    const response = await axios({
      method: "get",
      url: fileLink.href, // Axios expects a URL string, not a URL object, hence use `fileLink.href`
      responseType: "stream", // Stream the response directly
    });
    response.data.pipe(fileStream);

    fileStream.on("finish", async () => {
      const dbOrder = await prisma.order.update({
        where: { id: orderId, status: "InProcess" },
        data: { status: "Completed" },
        include: { Buyer: true },
      });
      const user = await discordBot.users.fetch(dbOrder.Buyer.platformUserId);

      // Send the file to the Discord user
      const message = await user.send({
        content: `Your order with order ID: ${orderId} has finished. Thanks for your purchase! Please vouch for us!`,
        files: [
          {
            attachment: filePath,
            name: fileName, // You can name it whatever you want or derive it from the original file name
          },
        ],
      });

      if (message) {
        await ctx.reply("Ảnh đã được gửi cho khách.");
      } else {
        await ctx.reply("Failed to send the notification.");
      }

      pendingPhotos.delete(userId);
      await unlink(filePath);
      console.log("Deleted");
    });
    fileStream.on("error", (error) => {
      console.error("Error writing the file:", error);
    });
  }
});

export default telegramBot;
