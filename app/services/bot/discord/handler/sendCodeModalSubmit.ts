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
  ModalSubmitInteraction,
} from "discord.js";
import { Markup } from "telegraf";
import telegramBot from "../../telegram-bot";

export async function SendCodeModalSubmit(interaction: ModalSubmitInteraction) {
  const verificationCode = interaction.fields.getTextInputValue("verifyCode");
  await telegramBot.telegram.sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    `Mã xác nhận ${verificationCode}`
  );
  return await interaction.reply(
    `Your verfication ${verificationCode} code has been sent!`
  );
}
