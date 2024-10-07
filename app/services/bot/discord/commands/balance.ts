import { buyerController } from "@/controller/buyer-controller";
import discordConfig from "@/config/discord-bot-config";
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("balance")
  .setDescription("Balance command.")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("get")
      .setDescription("Get your balance.")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to get balance for (optional)")
      )
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
      .addUserOption((option) =>
        option.setName("user").setDescription("User to add balance to")
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

  switch (subcommand) {
    case "get":
      try {
        const targetUser =
          interaction.options.getUser("user") || interaction.user;
        const balance = await buyerController.getBalance({
          platformUserId: targetUser.id,
          platform: "Discord",
        });
        return interaction.editReply({
          content: `${
            targetUser.id === interaction.user.id
              ? "You have"
              : `${targetUser.username} has`
          } ${balance.balance} ${balance.balance > 1 ? "tokens" : "token"}`,
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
        content: `add`,
      });
    case "send":
      return interaction.editReply({
        content: `Send`,
      });
  }
}
