import { Context, Telegraf } from "telegraf";
import prisma from "../db.server";
import discordBot from "./discord/discord-bot";
import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import {
  ParseMode,
  ReplyParameters,
} from "node_modules/telegraf/typings/core/types/typegram";
import { OrderStatus } from "@prisma/client";
const telegramBot = new Telegraf(process.env.TELEGRAM_TOKEN);

telegramBot.on("callback_query", async (ctx: Context) => {
  try {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;
    const data = ctx.callbackQuery.data;

    if (data.startsWith("take_order")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      const telegramUserId = ctx.from!.id;
      const telegramUsername = ctx.from!.username
        ? `@${ctx.from!.username}`
        : `tg://user?id=${telegramUserId}`;

      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        dcMsg: `**Order ID:** ${orderId}\n**Status:** In Process\n**Message:** You will be prompted for a verification code to log in. Please provide the code once you receive it.`,
        replyMsg: `Đơn ${orderId}\n${telegramUsername} đã nhận đơn.`,
        messageId: messageId,
        statusBefore: "InQueue",
        statusAfter: "InProcess",
        press: true,
      });
    }

    if (data.startsWith("order_verify_code")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        dcMsg: `Please enter the verification code for your order (Order ID: ${orderId}).`,
        btnCustomId: `open_order_verify_code`,
        btnLabel: "Enter Verification Code",
        messageId,
        replyMsg: `Đơn ${orderId}:\nYêu cầu lấy code đã được gửi.`,
      });
    }

    if (data.startsWith("notify_in")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        dcMsg: `We logged in, please be patient order is processing.`,
        replyMsg: `Đơn ${orderId}:\nThông báo đã được gửi`,
        messageId: messageId,
      });
    }

    if (data.startsWith("order_finish")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        dcMsg: `Your order with order ID: ${orderId} has finished. Thanks for your purchase!`,
        replyMsg: `Đơn ${orderId}:\nTrạng thái: Đã hoàn thành`,
        messageId: messageId,
        statusBefore: "InProcess",
        statusAfter: "Completed",
      });
    }
  } catch (err) {
    ctx.reply("Lỗi khi ấn nút");
    console.error(err);
  }
});

async function ButtonHandle({
  ctx,
  orderId,
  dcMsg,
  btnCustomId,
  btnLabel,
  messageId,
  replyMsg,
  telegramUserName,
  statusBefore,
  statusAfter,
  press,
}: {
  ctx: Context;
  orderId: string;
  dcMsg: string;
  btnCustomId?: string;
  btnLabel?: string;
  messageId?: string;
  replyMsg: string;
  telegramUserName?: string;
  statusBefore?: OrderStatus;
  statusAfter?: OrderStatus;
  press?: boolean;
}) {
  // Check orderId, messageId
  if (!orderId || !messageId)
    return await ctx.answerCbQuery("Mã đơn hoặc mã tin nhắn không xác định");
  // Find order
  const dbOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: { Buyer: true },
  });

  if (!dbOrder) return await ctx.answerCbQuery("Không tìm thấy đơn!");

  console.log("🚀 ~ press:", press);
  console.log("🚀 ~ dbOrder.status:", dbOrder.status);
  console.log("🚀 ~ telegramUserName:", telegramUserName);
  // Button Logic
  // Permit the "Take Order" button to be pressed when the order status is "InQueue"
  // Restrict all other buttons from being pressed when the order status is "InQueue" or "Completed"
  if (dbOrder.status === "Completed") {
    return await ctx.answerCbQuery("Đơn đã được hoàn thành");
  } else if (dbOrder.status === "InQueue" && press == undefined) {
    return await ctx.answerCbQuery("Ấn nút nhận đơn trước");
  }
  // Update order status when finished
  const dbOrderUpdate =
    statusBefore && statusAfter
      ? await prisma.order.update({
          where: { id: orderId, status: statusBefore },
          data: { status: statusAfter },
          include: { Buyer: true },
        })
      : undefined;

  // Discord Message
  const user = await discordBot.users.fetch(
    (dbOrderUpdate ? dbOrderUpdate : dbOrder).Buyer.platformUserId
  );
  const row =
    btnCustomId && btnLabel
      ? new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(`${btnCustomId}|${dbOrder.id}|${messageId}`)
            .setLabel(btnLabel!)
            .setStyle(ButtonStyle.Primary)
        )
      : undefined;

  const dcMessageOption: {
    content: string;
    components?: ActionRowBuilder<ButtonBuilder>[];
  } = {
    content: dcMsg,
  };

  if (row) {
    dcMessageOption.components = [row];
  }
  const message = await user.send(dcMessageOption);

  const teleMessageOption: {
    reply_parameters: ReplyParameters;
    parse_mode?: ParseMode;
  } = {
    reply_parameters: {
      message_id: Number(messageId),
    },
  };

  if (telegramUserName) {
    teleMessageOption.parse_mode = "MarkdownV2";
  }

  if (message) {
    await ctx.sendMessage(replyMsg, teleMessageOption);
  } else {
    await ctx.answerCbQuery("Gửi thông báo không thành công!");
  }
}

export default telegramBot;
