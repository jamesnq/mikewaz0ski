import { buyerController } from "@/controller/buyer-controller";
import {
  ChatInputCommandInteraction,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("Balance command.")
  .addSubcommand((subcommand) =>
    subcommand.setName("get").setDescription("Get your balance.")
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("add")
      .setDescription("Add balance.")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount to add")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("send")
      .setDescription("Send balance to someone.")
      .addStringOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount to send")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("user")
          .setDescription("User to send balance to")
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  const subcommand = interaction.options.getSubcommand();
  console.log("🚀 ~ execute ~ subcommand:", subcommand);
  switch (subcommand) {
    case "get":
      try {
        const balance = await buyerController.getBalance({
          platformUserId: interaction.user.id,
          platform: "Discord",
        });
        return interaction.editReply({
          content: `You have ${balance.balance} ${
            balance.balance > 1 ? "tokens" : "token"
          }`,
        });
      } catch (err) {
        console.error(
          `Error getting balance of user: ${(err as Error).message}`
        );
        return interaction.editReply({
          content: "Error getting balance",
        });
      }
    case "add":
      return interaction.editReply({
        content: `Add command`,
      });
    case "send":
      return interaction.editReply({
        content: `send command`,
      });
  }
}
