import { ModalSubmitInteraction } from "discord.js";
import telegramBot from "../../telegram-bot";
import prisma from "@/services/db.server";

export async function SendAppleIDModalSubmit(
  interaction: ModalSubmitInteraction
) {
  const email = interaction.fields.getTextInputValue("email");
  const password = interaction.fields.getTextInputValue("password");
  const modalId = interaction.customId;
  const messageId = modalId.split("|")[1];
  const orderId = modalId.split("|")[2];

  const dbOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      data: {
        email: email,
        password: password,
      },
    },
    select: { data: true },
  });
  console.log("🚀 ~ dbOrder:", dbOrder);
  // await telegramBot.telegram.editMessageText(
  //     process.env.TELEGRAM_CHAT_ID, email,

  // )
  await telegramBot.telegram.sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    `Đã chỉnh sửa tin nhắn`,
    {
      reply_parameters: {
        message_id: Number(messageId),
      },
    }
  );
  return await interaction.reply(`Your verfication code has been sent!`);
}
