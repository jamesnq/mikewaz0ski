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

export async function ConfirmButtonHandler(interaction: ButtonInteraction) {
  console.log("🚀 ~ ConfirmButtonHandler ~ interaction:", interaction);
  try {
    if (interaction.customId?.startsWith("confirm_order_id_")) {
      const userId = interaction.member?.user.id || interaction.user.id;
      if (!process.env.DISCORD_ADMIN.includes(userId)) {
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
          const telegramResponse = telegramBot.telegram.sendMessage(
            process.env.TELEGRAM_CHAT_ID,
            JSON.stringify(
              {
                orderId: dbOrder.id,
                ...data,
                password: aes256cbc.decrypt(data.password),
              },
              null,
              2
            ),
            Markup.inlineKeyboard([
              [
                Markup.button.callback(
                  "Verify code",
                  `order_verify_code|${dbOrder.id}`
                ),
              ],
              [Markup.button.callback("Finish", `order_finish|${dbOrder.id}`)],
            ])
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
