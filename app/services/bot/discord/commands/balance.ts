import { buyerController } from "@/controller/buyer-controller";
import discordConfig from "@/config/discord-bot-config";
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

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
      try {
        const isAdmin = discordConfig.confirmOrder.users.includes(
          interaction.user.id
        );

        if (!isAdmin) {
          return interaction.editReply({
            content: "You don't have permission to use this command.",
          });
        }

        const amount = parseInt(interaction.options.getString("amount", true));
        const targetUser =
          interaction.options.getUser("user") || interaction.user;

        await buyerController.addBalance({
          platformUserId: targetUser.id,
          platform: "Discord",
          amount,
        });

        return interaction.editReply({
          content: `Successfully added ${amount} ${
            amount > 1 ? "tokens" : "token"
          } to ${
            targetUser.id === interaction.user.id
              ? "your"
              : targetUser.username + "'s"
          } balance.`,
        });
      } catch (err) {
        console.error(`Error adding balance: ${(err as Error).message}`);
        return interaction.editReply({
          content: "Error adding balance",
        });
      }
    case "send":
      try {
        const amount = parseInt(interaction.options.getString("amount", true));
        const recipientId = interaction.options.getString("user", true);

        // Deduct from sender
        await buyerController.addBalance({
          platformUserId: interaction.user.id,
          platform: "Discord",
          amount: -amount,
        });

        // Add to recipient
        await buyerController.addBalance({
          platformUserId: recipientId,
          platform: "Discord",
          amount,
        });

        return interaction.editReply({
          content: `<@${interaction.user.id}> successfully sent ${amount} ${
            amount > 1 ? "tokens" : "token"
          } to <@${recipientId}>.`,
        });
      } catch (err) {
        console.error(`Error sending balance: ${(err as Error).message}`);
        return interaction.editReply({
          content: "Error sending balance",
        });
      }
  }
}
