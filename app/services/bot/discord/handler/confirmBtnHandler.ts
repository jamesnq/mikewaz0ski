import { BrawlCoinsData } from "@/lib/zod-schema";
import aes256cbc from "@/server/aes-265-cbc";
import prisma from "@/services/db.server";
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import { Markup } from "telegraf";
import telegramBot from "../../telegram-bot";
import discordConfig from "@/config/discord-bot-config";
import discordBot from "../discord-bot";
import { embedTemplate } from "../utils/embedTemplate";

export async function ConfirmButtonHandler(interaction: ButtonInteraction) {
  await interaction.deferUpdate(); // Prevent blocking the UI

  try {
    const { customId, member, user, guild } = interaction;

    if (!customId?.startsWith("confirm_order_id_")) return;

    const userId = member?.user.id || user.id;
    const memberObj = guild?.members.cache.get(userId);
    const requiredRoleIds = discordConfig.confirmOrder.roles;

    const hasPermission =
      discordConfig.confirmOrder.users.includes(userId) ||
      requiredRoleIds.some((roleId) => memberObj?.roles.cache.has(roleId));

    if (!hasPermission) {
      return interaction.editReply({
        content: "You don't have permission to confirm this order!",
      });
    }

    const orderId = customId.split("confirm_order_id_")[1];

    const dbOrder = await prisma.order.update({
      where: { id: orderId, status: "Pending" },
      data: { status: "InQueue" },
      select: { id: true, data: true, type: true, Buyer: true },
    });

    if (dbOrder.type === "BrawlCoins") {
      const data = dbOrder.data as BrawlCoinsData;
      const decryptedPassword = aes256cbc.decrypt(data.password);

      const messageText = `==========ĐƠN NẠP MỚI==========\n\nSTT: ${await prisma.order.count()}\nMã đơn: ${orderId}\nEmail: ${
        data.email
      }\nMật khẩu: ${decryptedPassword}\nGói: ${data.pack}\n`;

      const telegramResponse = await telegramBot.telegram.sendMessage(
        process.env.TELEGRAM_CHAT_ID!,
        messageText
      );

      const messageId = telegramResponse.message_id;
      const inlineKeyboard = buildTelegramButtons(dbOrder.id, messageId);

      await telegramBot.telegram.editMessageReplyMarkup(
        process.env.TELEGRAM_CHAT_ID!,
        messageId,
        undefined,
        { inline_keyboard: inlineKeyboard.reply_markup.inline_keyboard }
      );

      const replyEmbed = embedTemplate({
        bot: discordBot.user!,
        title: "Order Confirmed",
        description:
          "Your order has been confirmed by an admin. Please check your direct messages for further details",
        color: 0x50c878,
        thumbnail: "https://media.discordapp.net/attachments/.../check.gif",
      });

      const userEmbed = embedTemplate({
        bot: discordBot.user!,
        title: `Order ID ${orderId}`,
        description: "Order information and status.",
        color: 0xffa500,
        fields: [
          { name: "Status", value: "In Queue <:wait:1283067534571995176>" },
          {
            name: "Message",
            value: "- Orders are processed within **15-30 minutes**.",
          },
        ],
      });

      const userDiscord = await discordBot.users.fetch(
        dbOrder.Buyer.platformUserId
      );

      await Promise.all([
        interaction.message.edit({
          content: "",
          embeds: [replyEmbed],
          components: [],
        }),
        userDiscord.send({ embeds: [userEmbed] }),
      ]);
    }
  } catch (error) {
    console.error("Order confirmation error:", error);
    await interaction.followUp({
      content: `Failed to confirm the order: ${(error as Error).message}`,
      ephemeral: true,
    });
  }
}

function buildTelegramButtons(orderId: string, messageId: number) {
  return Markup.inlineKeyboard([
    [Markup.button.callback("Nhận đơn", `take_order|${orderId}|${messageId}`)],
    [
      Markup.button.callback(
        "Yêu cầu code",
        `order_verify_code|${orderId}|${messageId}`
      ),
    ],
    [
      Markup.button.callback(
        "Sai mật khẩu",
        `wrong_password|${orderId}|${messageId}`
      ),
    ],
    [
      Markup.button.callback(
        "Thông báo đã vào được",
        `notify_in|${orderId}|${messageId}`
      ),
    ],
    [
      Markup.button.callback(
        "Hoàn thành đơn",
        `order_finish|${orderId}|${messageId}`
      ),
    ],
  ]);
}
