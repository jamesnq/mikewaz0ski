import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

import { z } from "zod";
import { orderController } from "@/controller/oder-controller";
import discordConfig from "@/config/discord-bot-config";
import { embedTemplate } from "../utils/embedTemplate";
import discordBot from "../discord-bot";

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

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply();
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
    return interaction.editReply({
      content: `Your email is not valid, please re-enter it`,
    });
  }
  try {
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

    const cancel = new ButtonBuilder()
      .setCustomId(`cancel_order_id_${order.id}`) // Custom ID to handle the button interaction
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    // Create an action row to hold the button
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      button,
      cancel
    );
    const requiredRoleIds = discordConfig.confirmOrder.roles;
    const existingRoleMentions = requiredRoleIds
      .filter((roleId) => interaction.guild?.roles.cache.has(roleId)) // Check if the guild has each role
      .map((roleId) => `<@&${roleId}>`) // Convert role IDs to mention format
      .join(" ");

    const embed = embedTemplate({
      bot: discordBot.user!,
      title: "Order Created",
      description: `Order created successfully! Waiting for admin to confirm order ${
        existingRoleMentions || ""
      }`,
      color: 0x4169e1,
      thumbnail:
        "https://i.pinimg.com/originals/da/fc/67/dafc6797cb0b603debbba9bfa26abfc1.gif",
    });

    await interaction.editReply({
      content: existingRoleMentions || "",
      embeds: [embed],
      components: [row],
    });
  } catch (err) {
    console.error("Error creating order:", err as Error);

    if (!interaction.replied) {
      await interaction.editReply({
        content: "An error occurred while creating the order.",
      });
    }
  }
}
