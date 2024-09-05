import { BrawlCoinsData } from "@/lib/zod-schema";
import aes256cbc from "@/server/aes-265-cbc";
import prisma from "@/services/db.server";
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  AnyComponentBuilder,
} from "discord.js";
import { Markup } from "telegraf";
import telegramBot from "../../telegram-bot";

export async function SendCodeButtonHandler(interaction: ButtonInteraction) {
  const btnId = interaction.customId;
  const messageId = btnId.split("|")[2];
  console.log("🚀 ~ SendCodeButtonHandler ~ messageId:", messageId);
  const modal = new ModalBuilder()
    .setCustomId(`verification-code-modal|${messageId}`)
    .setTitle("Enter Verification Code");

  const verificationCode = new TextInputBuilder()
    .setCustomId(`verifyCode`)
    // The label is the prompt the user sees for this input
    .setLabel("Enter code received from phone/phone number")
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);

  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    verificationCode
  );

  modal.addComponents(firstActionRow);

  return await interaction.showModal(modal);
}
