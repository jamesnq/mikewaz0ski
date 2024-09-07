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
      if (
        !process.env.DISCORD_ADMIN.includes(userId) ||
        member?.roles.cache.has(requireRoleId)
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
          const telegramResponse = await telegramBot.telegram.sendMessage(
            process.env.TELEGRAM_CHAT_ID,
            `==========ĐƠN NẠP MỚI==========\n\nMã đơn: ${dbOrder.id}\nEmail: ${
              data.email
            }\nMật khẩu: ${aes256cbc.decrypt(data.password)}\nGói: ${
              data.pack
            }`,
            Markup.inlineKeyboard([
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
            ])
          );
          const messageId = telegramResponse.message_id;
          console.log("🚀 ~ ConfirmButtonHandler ~ messageId:", messageId);

          await telegramBot.telegram.editMessageReplyMarkup(
            process.env.TELEGRAM_CHAT_ID,
            messageId,
            undefined,
            {
              inline_keyboard: Markup.inlineKeyboard([
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
              ]).reply_markup.inline_keyboard, // Extract the inline_keyboard from the Markup object
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
          content: "Confirm fail order not found!",
          options: { ephemeral: true },
        });
      }
    }
  } catch (error) {}
}
