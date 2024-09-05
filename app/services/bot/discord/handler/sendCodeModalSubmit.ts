import { ModalSubmitInteraction } from "discord.js";
import telegramBot from "../../telegram-bot";

export async function SendCodeModalSubmit(interaction: ModalSubmitInteraction) {
  const verificationCode = interaction.fields.getTextInputValue("verifyCode");
  const modalId = interaction.customId;
  console.log("🚀 ~ SendCodeModalSubmit ~ modalId:", modalId);
  const messageId = modalId.split("|")[1];
  console.log("🚀 ~ SendCodeModalSubmit ~ messageId:", messageId);
  await telegramBot.telegram.sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    `${verificationCode}`,
    {
      reply_parameters: {
        message_id: Number(messageId),
      },
    }
  );
  return await interaction.reply(`Your verfication code has been sent!`);
}
