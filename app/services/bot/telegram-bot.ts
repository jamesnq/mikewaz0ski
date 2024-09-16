import { Context, Telegraf } from "telegraf";
import prisma from "../db.server";
import discordBot from "./discord/discord-bot";
import {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import {
  ParseMode,
  ReplyParameters,
} from "node_modules/telegraf/typings/core/types/typegram";
import { OrderStatus } from "@prisma/client";
import { embedTemplate } from "./discord/utils/embedTemplate";
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
        embedTitle: `Order ID ${orderId}`,
        embedDescription: `Information about your order`,
        embedFields: [
          {
            name: "Status",
            value: "Processing <a:loading:1283057731321991299>",
          },
          {
            name: "Message",
            value:
              "- You will be prompted for a verification code to log in. Please provide the code by once you receive it.",
          },
        ],
        embedThumbnails:
          "https://cdn.discordapp.com/attachments/1176504635217936425/1283056364469489715/Loading_cat.gif?ex=66e19adb&is=66e0495b&hm=a39c751779340ee91c1abd3d73ab604989e0cd4d262da54e9496ebe989bf4120&",
        embedColor: 0xffff00,
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
        embedTitle: `Order ID ${orderId}`,
        embedDescription: `Information about your order`,
        embedFields: [
          {
            name: "Status",
            value: "Processing <a:loading:1283057731321991299>",
          },
          {
            name: "Message",
            value:
              "- Please enter the verification code by **<a:down:1283065340141764710> pressing the button below <a:down:1283065340141764710>**",
          },
        ],
        embedColor: 0xffff00,
        embedThumbnails:
          "https://cdn.discordapp.com/attachments/1176504635217936425/1283056364469489715/Loading_cat.gif?ex=66e19adb&is=66e0495b&hm=a39c751779340ee91c1abd3d73ab604989e0cd4d262da54e9496ebe989bf4120&",
        btnCustomId: `open_order_verify_code`,
        btnLabel: "Enter Verification Code",
        messageId,
        replyMsg: `Đơn ${orderId}:\nYêu cầu lấy code đã được gửi.`,
      });
    }

    if (data.startsWith("wrong_password")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        embedTitle: `Order ID ${orderId}`,
        embedDescription: `Information about your order`,
        embedFields: [
          {
            name: "Status",
            value: "Processing <a:loading:1283057731321991299>",
          },
          {
            name: "Message",
            value:
              "- Your email or password is wrong, please send again by **<a:down:1283065340141764710> pressing the button below <a:down:1283065340141764710>**",
          },
        ],
        embedColor: 0xff0000,
        embedThumbnails:
          "https://cdn.discordapp.com/attachments/1176504635217936425/1283056364469489715/Loading_cat.gif?ex=66e19adb&is=66e0495b&hm=a39c751779340ee91c1abd3d73ab604989e0cd4d262da54e9496ebe989bf4120&",
        btnCustomId: `open_resend_appleid`,
        btnLabel: "Send Again Apple ID",
        messageId,
        replyMsg: `Đơn ${orderId}:\nĐã yêu cầu gửi lại nick.`,
      });
    }

    if (data.startsWith("notify_in")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        embedTitle: `Order ID ${orderId}`,
        embedDescription: `Information about your order`,
        embedFields: [
          {
            name: "Status",
            value: "Processing <a:loading:1283057731321991299>",
          },
          {
            name: "Message",
            value: "- We logged in, please be patient order is processing.",
          },
        ],
        embedColor: 0x1e90ff,
        embedThumbnails:
          "https://cdn.discordapp.com/attachments/1176504635217936425/1283056364469489715/Loading_cat.gif?ex=66e19adb&is=66e0495b&hm=a39c751779340ee91c1abd3d73ab604989e0cd4d262da54e9496ebe989bf4120&",
        replyMsg: `Đơn ${orderId}:\nThông báo đăng nhập đã được gửi`,
        messageId: messageId,
      });
    }

    if (data.startsWith("order_finish")) {
      const orderId = data.split("|")[1];
      const messageId = data.split("|")[2];
      ButtonHandle({
        ctx: ctx,
        orderId: orderId,
        embedTitle: `Order ID ${orderId}`,
        embedDescription: `Information about your order`,
        embedFields: [
          {
            name: "Status",
            value: "Completed <a:check_gif:1175065179864698930>",
          },
          {
            name: "Message",
            value:
              "- Your order has completed. Thanks for your purchase, please vouch for us! <a:mt_yayyy:1282967627685298176>",
          },
        ],
        embedThumbnails:
          "https://cdn.discordapp.com/attachments/1178944867536216124/1283075750702092443/mission-complete-spongebob.gif?ex=66e1ace9&is=66e05b69&hm=3a4e3f8360ddfe8a73105182fabfa884abd988e6332b02bacaa580c95bf69567&",
        embedColor: 0x32cd32,
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
  btnCustomId,
  btnLabel,
  messageId,
  replyMsg,
  telegramUserName,
  statusBefore,
  statusAfter,
  press,
  embedColor,
  embedTitle,
  embedDescription,
  embedFields = [],
  embedThumbnails,
  embedImage,
  embedUrl,
}: {
  ctx: Context;
  orderId: string;
  btnCustomId?: string;
  btnLabel?: string;
  messageId?: string;
  replyMsg: string;
  telegramUserName?: string;
  statusBefore?: OrderStatus;
  statusAfter?: OrderStatus;
  press?: boolean;
  embedColor?: number;
  embedTitle?: string;
  embedDescription?: string;
  embedFields?: { name: string; value: string; inline?: boolean }[];
  embedThumbnails?: string;
  embedImage?: string;
  embedUrl?: string;
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

  const embed = embedTemplate({
    bot: discordBot.user!,
    color: embedColor!,
    title: embedTitle!,
    description: embedDescription!,
  });
  if (embedThumbnails) embed.setThumbnail(embedThumbnails);
  if (embedImage) embed.setImage(embedImage);
  if (embedFields) embed.setFields(embedFields);
  if (embedThumbnails) embed.setThumbnail(embedThumbnails);
  if (embedUrl) embed.setURL(embedUrl);

  const dcMessageOption: {
    embeds: EmbedBuilder[];
    components?: ActionRowBuilder<ButtonBuilder>[];
  } = {
    embeds: [embed],
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
    await ctx.answerCbQuery("Thao tác thành công!");
  } else {
    await ctx.answerCbQuery("Gửi thông báo không thành công!");
  }
}

export default telegramBot;
