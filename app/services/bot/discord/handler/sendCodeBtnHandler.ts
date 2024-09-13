import {
  ButtonInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export async function SendCodeButtonHandler(interaction: ButtonInteraction) {
  const btnId = interaction.customId;
  const messageId = btnId.split("|")[2];
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
