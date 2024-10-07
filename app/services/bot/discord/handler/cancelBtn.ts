import discordConfig from "@/config/discord-bot-config";
import prisma from "@/services/db.server";
import { ButtonInteraction } from "discord.js";
import discordBot from "../discord-bot";
import { embedTemplate } from "../utils/embedTemplate";

export async function CancelButtonHandler(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  try {
    if (interaction.customId?.startsWith("cancel_order_id_")) {
      const userId = interaction.member?.user.id || interaction.user.id;
      const member = interaction.guild?.members.cache.get(userId);
      const requiredRoleIds = discordConfig.confirmOrder.roles;
      if (
        !discordConfig.confirmOrder.users.includes(userId) &&
        !requiredRoleIds.some((roleId) => member?.roles.cache.has(roleId))
      ) {
        return await interaction.editReply({
          content: "Cancel fail you don't have permission to confirm!",
          options: { ephemeral: true },
        });
      }

      // Extract the order ID from the custom ID
      const orderId = interaction.customId.split("cancel_order_id_")[1];
      try {
        const dbOrder = await prisma.order.update({
          where: { id: orderId, status: "Pending" },
          data: { status: "Cancelled" },
          select: { id: true, data: true, type: true, Buyer: true },
        });
        console.log("🚀 ~ CancelButtonHandler ~ dbOrder:", dbOrder);
        const relpyEmbed = embedTemplate({
          bot: discordBot.user!,
          title: "Order Cancelled",
          description: `Your order has been cancelled by an admin. We hope to serve you again in the future!`,
          color: 0xbd2d2d,
          thumbnail:
            "https://cdn.discordapp.com/attachments/1172000543019892786/1292764280420307044/9079454.png?ex=6704ec0e&is=67039a8e&hm=4af3d12f036eabdc1b5eafd5776a03329b2302a73ba74cf7ff115ad1603285ca&",
        });

        const [] = await Promise.all([
          interaction.message.edit({
            embeds: [relpyEmbed],
            components: [],
          }),
        ]);
      } catch (error) {
        return await interaction.reply({
          content: (error as Error).message,
          options: { ephemeral: true },
        });
      }
    }
  } catch (error) {}
}
