import {
  ButtonInteraction,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

export async function SendAppleIDButtonHandler(interaction: ButtonInteraction) {
  const btnId = interaction.customId;
  const orderId = btnId.split("|")[1];
  const messageId = btnId.split("|")[2];
  const modal = new ModalBuilder()
    .setCustomId(`send-appleid-modal|${messageId}|${orderId}`)
    .setTitle("Send Again Apple ID");

  const email = new TextInputBuilder()
    .setCustomId(`email`)
    // The label is the prompt the user sees for this input
    .setLabel("Enter Apple ID email")
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);

  const password = new TextInputBuilder()
    .setCustomId(`password`)
    // The label is the prompt the user sees for this input
    .setLabel("Enter Apple ID password")
    // Short means only a single line of text
    .setStyle(TextInputStyle.Short);
  const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(
    email,
    password
  );

  modal.addComponents(firstActionRow);

  return await interaction.showModal(modal);
}
