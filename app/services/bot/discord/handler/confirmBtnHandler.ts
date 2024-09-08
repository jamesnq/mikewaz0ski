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

const requireRoleId = process.env.REQUIRED_ROLE_ID;
export async function ConfirmButtonHandler(interaction: ButtonInteraction) {
  try {
    if (interaction.customId?.startsWith("confirm_order_id_")) {
      const userId = interaction.member?.user.id || interaction.user.id;
      const member = interaction.guild?.members.cache.get(userId);
      console.log(!process.env.DISCORD_ADMIN.includes(userId));
      console.log(!member?.roles.cache.has(requireRoleId));

      if (
        !process.env.DISCORD_ADMIN.includes(userId) ||
        !member?.roles.cache.has(requireRoleId)
      ) {
        return await interaction.reply({
          content: "Confirm fail only admin can confirm!",
          options: { ephemeral: true },
        });
      }
      // Extract the order ID from the custom ID
      const orderId = interaction.customId.split("confirm_order_id_")[1];
      try {
        const dbOrder = await prisma.order.update({
          where: { id: orderId, status: "Pending" },
          data: { status: "InProcess" },
          select: { id: true, data: true, type: true },
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
          let inlineKeyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "Yêu cầu code",
                `order_verify_code|${dbOrder.id}|MESSAGE_ID`
              ),
            ],
            [
              Markup.button.callback(
                "Thông báo đã vào được",
                `notify_in|${dbOrder.id}`
              ),
            ],
            [
              Markup.button.callback(
                "Hoàn thành đơn",
                `order_finish|${dbOrder.id}|MESSAGE_ID`
              ),
            ],
          ]);

          const telegramResponse = await telegramBot.telegram.sendMessage(
            process.env.TELEGRAM_CHAT_ID,
            messageText,
            inlineKeyboard
          );
          const messageId = telegramResponse.message_id;
          inlineKeyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "Yêu cầu code",
                `order_verify_code|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Thông báo đã vào được",
                `notify_in|${dbOrder.id}`
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

          const [] = await Promise.all([
            interaction.reply({
              content: `Confirm success order id ${dbOrder.id}`,
              ephemeral: true,
            }),
            interaction.message.edit({
              components: [row],
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
