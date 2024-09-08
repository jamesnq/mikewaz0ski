import { BrawlCoinsData } from "@/lib/zod-schema";
import aes256cbc from "@/server/aes-265-cbc";
import prisma from "@/services/db.server";
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  StringSelectMenuInteraction,
} from "discord.js";
import { Markup } from "telegraf";
import telegramBot from "../../telegram-bot";
import { Location } from "@prisma/client";

const requireRoleId = process.env.REQUIRED_ROLE_ID;
export async function LocationSelectMenu(
  interaction: StringSelectMenuInteraction
) {
  try {
    if (interaction.customId?.startsWith("select_location")) {
      const userId = interaction.member?.user.id || interaction.user.id;
      const member = interaction.guild?.members.cache.get(userId);
      // Only admin or person with permission
      if (
        !process.env.DISCORD_ADMIN.includes(userId) ||
        member?.roles.cache.has(requireRoleId)
      ) {
        return await interaction.reply({
          content: "Confirm fail only admin can choose!",
          options: { ephemeral: true },
        });
      }

      const selectedLocation = interaction.values[0] as keyof typeof Location;
      // Extract the order ID from the custom ID
      const orderId = interaction.customId.split("select_location_")[1];
      try {
        const dbOrder = await prisma.order.update({
          where: { id: orderId, location: Location.US },
          data: { location: selectedLocation },
          select: { id: true, location: true, type: true },
        });

        await interaction.reply({
          content: `Location updated to ${selectedLocation}.`,
          ephemeral: true,
        });
      } catch (err) {
        console.error("Error updating order:", err);
        return await interaction.reply({
          content: "Failed to update the location. Order not found.",
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error("Error in LocationSelectMenu:", error);
    // Safeguard fallback response in case of an unhandled error
    if (!interaction.replied) {
      await interaction.reply({
        content: "An error occurred while processing the interaction.",
        ephemeral: true,
      });
    }
  }
}
