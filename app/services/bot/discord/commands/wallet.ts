import { buyerController } from "@/controller/buyer-controller";
import discordConfig from "@/config/discord-bot-config";
import {
  ChatInputCommandInteraction,
  Client,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { formatToken } from "../utils/formatToken";

// Custom error classes to handle specific cases.
class WalletError extends Error {}
class NonExistentWalletError extends WalletError {}
class DuplicateWalletError extends WalletError {}
class InsufficientBalanceError extends WalletError {}
class InvalidAmountError extends WalletError {}
class SelfTransferError extends WalletError {}
class UnauthorizedError extends WalletError {}
// Function to notify the transaction channel if it exists.
async function notifyTransaction(
  client: Client,
  guildId: string,
  channelId: string,
  message: string
) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channel = guild.channels.cache.get(channelId) as TextChannel;
    if (channel) await channel.send(message);
  } catch (err) {
    console.error(`Error sending message to channel ${channelId}:`, err);
  }
}

// Exported command logic
export const data = new SlashCommandBuilder()
  .setName("wallet")
  .setDescription("Manage your wallet.")
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
      .setDescription("Add balance to a wallet (Admin only).")
      .addNumberOption((option) =>
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
      .setDescription("Send balance to another user.")
      .addNumberOption((option) =>
        option
          .setName("amount")
          .setDescription("Amount to send")
          .setRequired(true)
      )
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("User to send balance to")
          .setRequired(true)
      )
  )
  .addSubcommand((subcommand) =>
    subcommand.setName("create").setDescription("Create your wallet.")
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: Client
) {
  await interaction.deferReply();
  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guildId!;

  try {
    switch (subcommand) {
      case "create":
        const createResult = await buyerController.createWallet({
          platform: "Discord",
          platformUserId: interaction.user.id,
        });

        if (!createResult.success) {
          throw new DuplicateWalletError(createResult.message);
        }

        return interaction.editReply({
          content: createResult.message,
        });

      case "get":
        const targetUser =
          interaction.options.getUser("user") || interaction.user;
        // Check if the user is trying to get someone else's balance.
        const isCheckingOtherUser = targetUser.id !== interaction.user.id;

        // If it's another user's balance, ensure the requester has permission.
        if (
          isCheckingOtherUser &&
          !discordConfig.confirmOrder.users.includes(interaction.user.id)
        ) {
          throw new UnauthorizedError();
        }
        try {
          const balance = await buyerController.getBalance({
            platform: "Discord",
            platformUserId: targetUser.id,
          });

          return interaction.editReply({
            content: `${
              targetUser.id === interaction.user.id
                ? "You have"
                : `${targetUser.username} has`
            } ${balance.balance} ${formatToken(balance.balance)}.`,
          });
        } catch (error) {
          if (error instanceof NonExistentWalletError) {
            return interaction.editReply({
              content: `⚠️ ${targetUser.username} does not have a wallet. Ask them to create one using the \`/wallet create\` command.`,
            });
          }
          throw error; // Rethrow to be caught by the outer catch block.
        }

      case "send":
        const recipient = interaction.options.getUser("user")!;
        const sendAmount = interaction.options.getNumber("amount")!;

        if (recipient.id === interaction.user.id) {
          throw new SelfTransferError("You cannot send tokens to yourself.");
        }

        if (sendAmount <= 0) {
          throw new InvalidAmountError("Amount must be greater than zero.");
        }

        try {
          const sendResult = await buyerController.sendBalance({
            sendWalletId: interaction.user.id,
            receiveWalletId: recipient.id,
            amount: sendAmount,
            type: "W2W",
          });

          const sendMessage = `${
            interaction.user.username
          } sent ${sendAmount} ${formatToken(sendAmount)} to ${
            recipient.username
          }.`;

          for (const channelId of discordConfig.confirmOrder
            .transactionChannel) {
            await notifyTransaction(client, guildId, channelId, sendMessage);
          }

          return interaction.editReply({
            content: sendResult.message,
          });
        } catch (error) {
          if (error instanceof NonExistentWalletError) {
            return interaction.editReply({
              content: `⚠️ ${recipient.username} does not have a wallet. Ask them to create one using the \`/wallet create\` command.`,
            });
          }
          throw error;
        }

      case "add":
        const adminTargetUser =
          interaction.options.getUser("user") || interaction.user;
        const addAmount = interaction.options.getNumber("amount")!;

        if (!discordConfig.confirmOrder.users.includes(interaction.user.id)) {
          throw new UnauthorizedError();
        }

        try {
          const addResult = await buyerController.addBalance({
            platform: "Discord",
            platformUserId: adminTargetUser.id,
            amount: addAmount,
            type: "Deposit",
          });

          const addMessage = `${addAmount} ${formatToken(
            addAmount
          )} was added to ${adminTargetUser.username} by ${
            interaction.user.username
          }.`;

          for (const channelId of discordConfig.confirmOrder
            .transactionChannel) {
            await notifyTransaction(client, guildId, channelId, addMessage);
          }

          return interaction.editReply({
            content: addResult.message,
          });
        } catch (error) {
          if (error instanceof NonExistentWalletError) {
            return interaction.editReply({
              content: `⚠️ ${adminTargetUser.username} does not have a wallet. Ask them to create one using the \`/wallet create\` command.`,
            });
          }
          throw error;
        }

      default:
        return interaction.editReply({ content: "Unknown subcommand." });
    }
  } catch (error) {
    console.error("Error occurred:", error);

    const errorMessage = (error as Error).message;

    return interaction.editReply({
      content: `⚠️ ${errorMessage}`,
    });
  }
}
