import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import axios from "axios";

export const data = new SlashCommandBuilder()
  .setName("code")
  .setDescription("Enter verification code")
  .addStringOption((option) =>
    option
      .setName("code")
      .setDescription("The verification code")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("orderid")
      .setDescription("The order ID associated with the verification code")
      .setRequired(true)
  );

export async function execute(interaction: CommandInteraction) {
  const verifyCode: string = interaction.options
    .get("code")!
    .value?.toString()!;
  console.log("🚀 ~ execute ~ code:", verifyCode);
  const orderId: string = interaction.options
    .get("orderid")!
    .value?.toString()!;
  console.log("🚀 ~ execute ~ orderId:", orderId);
}
