import { BrawlCoinsData } from "@/lib/zod-schema";
import aes256cbc from "@/server/aes-265-cbc";
import prisma from "@/services/db.server";
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} from "discord.js";
import { Markup } from "telegraf";
import telegramBot from "../../telegram-bot";
import discordConfig from "@/config/discord-bot-config";
import discordBot from "../discord-bot";

export async function ConfirmButtonHandler(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  try {
    if (interaction.customId?.startsWith("confirm_order_id_")) {
      const userId = interaction.member?.user.id || interaction.user.id;
      const member = interaction.guild?.members.cache.get(userId);
      const requiredRoleIds = discordConfig.confirmOrder.roles;
      if (
        !discordConfig.confirmOrder.users.includes(userId) &&
        !requiredRoleIds.some((roleId) => member?.roles.cache.has(roleId))
      ) {
        return await interaction.editReply({
          content: "Confirm fail you don't have permission to confirm!",
          options: { ephemeral: true },
        });
      }

      // Extract the order ID from the custom ID
      const orderId = interaction.customId.split("confirm_order_id_")[1];
      try {
        const dbOrder = await prisma.order.update({
          where: { id: orderId, status: "Pending" },
          data: { status: "InQueue" },
          select: { id: true, data: true, type: true, Buyer: true },
        });
        if (dbOrder.type == "BrawlCoins") {
          const data = dbOrder.data as BrawlCoinsData;
          const button = new ButtonBuilder()
            .setCustomId(`confirm_order_id_${orderId}`)
            .setDisabled(true)
            .setLabel("Confirm")
            .setStyle(ButtonStyle.Primary);
          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            button
          );

          const count = await prisma.order.count();
          const decryptedPassword = aes256cbc.decrypt(data.password);
          const messageText = `==========ĐƠN NẠP MỚI==========\n\nSTT: ${count}\nMã đơn: ${orderId}\nEmail: ${data.email}\nMật khẩu: ${decryptedPassword}\nGói: ${data.pack}\n`;

          const telegramResponse = await telegramBot.telegram.sendMessage(
            process.env.TELEGRAM_CHAT_ID,
            messageText
          );
          const messageId = telegramResponse.message_id;
          const inlineKeyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "Nhận đơn",
                `take_order|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Yêu cầu code",
                `order_verify_code|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Thông báo đã vào được",
                `notify_in|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Hoàn thành đơn",
                `order_finish|${dbOrder.id}|${messageId}`
              ),
            ],
          ]);
          await telegramBot.telegram.editMessageReplyMarkup(
            process.env.TELEGRAM_CHAT_ID,
            messageId,
            undefined,
            {
              inline_keyboard: inlineKeyboard.reply_markup.inline_keyboard, // Extract the inline_keyboard from the Markup object
            }
          );
          const user = await discordBot.users.fetch(
            dbOrder.Buyer.platformUserId
          );
          const [] = await Promise.all([
            interaction.message.edit({
              components: [row],
            }),
            interaction.editReply({
              content: `Your order has been confirmed by an admin. Please check your direct messages for further details.`,
            }),
            user.send({
              content: `**Order ID ${orderId}**\n**Status:** In Process\n**Message:**\n- Orders are typically processed within **15-30 minutes**.\n- However, during **our nighttime (GMT+7 timezone)**, processing may take **6-8 hours**.\nWe appreciate your patience and understanding.`,
            }),
          ]);
        }
      } catch (error) {
        return await interaction.reply({
          content: (error as Error).message,
          options: { ephemeral: true },
        });
      }
    }
  } catch (error) {}
}
