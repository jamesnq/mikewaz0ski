import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  CommandInteraction,
  ComponentType,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import axios from "axios";
import { z } from "zod";
import { orderController } from "@/controller/oder-controller";
import prisma from "@/services/db.server";
import telegramBot from "../../telegram-bot";
import aes256cbc from "@/server/aes-265-cbc";
import { BrawlCoinsData } from "@/lib/zod-schema";
import { Markup } from "telegraf";

export const data = new SlashCommandBuilder()
  .setName("order")
  .setDescription("Create a new order")
  .addStringOption((option) =>
    option
      .setName("package")
      .setDescription("Choose a package you want to buy")
      .setRequired(true)
      .addChoices(
        { name: "140 MMC", value: "140" },
        { name: "340 MMC", value: "340" },
        { name: "540 MMC", value: "540" },
        { name: "1600 MMC", value: "1600" },
        { name: "3200 MMC", value: "3200" },
        { name: "4800 MMC", value: "4800" },
        { name: "BP Gold Edition", value: "gold" },
        {
          name: "BP Gold Edition + 3200 coins (85 levels)",
          value: "gold_full",
        },
        { name: "BP Deluxe Edition", value: "deluxe" },
        {
          name: "BP Deluxe Edition + 3200 coins (85 levels)",
          value: "deluxe_full",
        }
      )
  )
  .addStringOption((option) =>
    option
      .setName("email")
      .setDescription("Enter Apple ID email")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("password")
      .setDescription("Enter Apple ID password")
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const selectedPackage: string = interaction.options
    .get("package")!
    .value?.toString()!;
  const email: string = interaction.options.get("email")?.value?.toString()!;
  const password: string = interaction.options
    .get("password")
    ?.value?.toString()!;

  const userId: string = interaction.member?.user?.id || interaction.user.id;
  const username =
    interaction.member?.user.username || interaction.user.username;
  if (!z.string().email().safeParse(email).success) {
    return interaction.reply(`Your email is not valid, please re-enter it`);
  }

  const order = await orderController.create({
    type: "BrawlCoins",
    buyer: { platform: "Discord", platformUserId: userId, username },
    data: { email, password, pack: selectedPackage },
  });
  if (!order) throw new Error("Create order fail something wrong!");

  // Create a button to copy the order ID
  const button = new ButtonBuilder()
    .setCustomId(`confirm_order_id_${order.id}`) // Custom ID to handle the button interaction

    .setLabel("Confirm")
    .setStyle(ButtonStyle.Primary);

  // Create an action row to hold the button
  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

  // Send the reply message with the button
  await interaction.reply({
    content: "Order created successfully! waiting for admin confirm order",
    components: [row],
  });
}

export async function handleButtonInteraction(interaction: ButtonInteraction) {
  console.log("🚀 ~ handleButtonInteraction ~ interaction:", interaction.id);
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
          const [] = await Promise.all([
            interaction.reply({
              content: `Confirm success order id ${dbOrder.id}`,
              ephemeral: true,
            }),
            interaction.message.edit({
              components: [row],
            }),
            telegramBot.telegram.sendMessage(
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
                [
                  Markup.button.callback(
                    "Finish",
                    `order_finish|${dbOrder.id}`
                  ),
                ],
              ])
            ),
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
