import { BrawlCoinsData } from "@/lib/zod-schema";
import aes256cbc from "@/server/aes-265-cbc";
import prisma from "@/services/db.server";
import {
  ButtonInteraction,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  EmbedBuilder,
} from "discord.js";
import { Markup } from "telegraf";
import telegramBot from "../../telegram-bot";
import discordConfig from "@/config/discord-bot-config";
import discordBot from "../discord-bot";
import { embedTemplate } from "../utils/embedTemplate";

export async function ConfirmButtonHandler(interaction: ButtonInteraction) {
  await interaction.deferUpdate();
  try {
    if (interaction.customId?.startsWith("confirm_order_id_")) {
      const userId = interaction.member?.user.id || interaction.user.id;
      const member = interaction.guild?.members.cache.get(userId);
      const requiredRoleIds = discordConfig.confirmOrder.roles;
      if (
        !discordConfig.confirmOrder.users.includes(userId) &&
        !requiredRoleIds.some((roleId) => member?.roles.cache.has(roleId))
      ) {
        return await interaction.editReply({
          content: "Confirm fail you don't have permission to confirm!",
          options: { ephemeral: true },
        });
      }

      // Extract the order ID from the custom ID
      const orderId = interaction.customId.split("confirm_order_id_")[1];
      try {
        const dbOrder = await prisma.order.update({
          where: { id: orderId, status: "Pending" },
          data: { status: "InQueue" },
          select: { id: true, data: true, type: true, Buyer: true },
        });
        if (dbOrder.type == "BrawlCoins") {
          const data = dbOrder.data as BrawlCoinsData;

          const count = await prisma.order.count();
          const decryptedPassword = aes256cbc.decrypt(data.password);
          const messageText = `==========ĐƠN NẠP MỚI==========\n\nSTT: ${count}\nMã đơn: ${orderId}\nEmail: ${data.email}\nMật khẩu: ${decryptedPassword}\nGói: ${data.pack}\n`;

          const telegramResponse = await telegramBot.telegram.sendMessage(
            process.env.TELEGRAM_CHAT_ID,
            messageText
          );
          const messageId = telegramResponse.message_id;
          const inlineKeyboard = Markup.inlineKeyboard([
            [
              Markup.button.callback(
                "Nhận đơn",
                `take_order|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Yêu cầu code",
                `order_verify_code|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Sai mật khẩu",
                `wrong_password|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Thông báo đã vào được",
                `notify_in|${dbOrder.id}|${messageId}`
              ),
            ],
            [
              Markup.button.callback(
                "Hoàn thành đơn",
                `order_finish|${dbOrder.id}|${messageId}`
              ),
            ],
          ]);
          await telegramBot.telegram.editMessageReplyMarkup(
            process.env.TELEGRAM_CHAT_ID,
            messageId,
            undefined,
            {
              inline_keyboard: inlineKeyboard.reply_markup.inline_keyboard, // Extract the inline_keyboard from the Markup object
            }
          );

          const intrUser = interaction.user; // User who initiated the interaction
          const bot = interaction.client.user;
          const relpyEmbed = embedTemplate({
            bot: discordBot.user!,
            title: "Order Confirmed",
            description: `Your order has been confirmed by an admin. Please check your direct messages for further details`,
            color: 0x50c878,
            thumbnail:
              "https://media.discordapp.net/attachments/1172000543019892786/1283008798512123924/check.gif?ex=66e16e8e&is=66e01d0e&hm=5d90fd21d3e3c52deb71760d77980b934150cf5e6ca15c0754580f173083c07c&=&width=345&height=335",
          });

          const userEmbed = embedTemplate({
            bot: discordBot.user!,
            title: `Order ID ${orderId}`,
            description: "Information about your order",
            color: 0xffa500,
            thumbnail:
              "https://media.discordapp.net/attachments/1175068749188038707/1282913024495190057/Loading_Cute_GIF_-_Loading_Cute_Pastel_-_Discover__Share_GIFs.gif?ex=66e1155c&is=66dfc3dc&hm=bdcef88bfc900d529b68ca1fb459dae75cb7b26f127468cc3562ef162009825d&=",
            fields: [
              {
                name: "Status",
                value: "In Queue <:wait:1283067534571995176>",
              },
              {
                name: "Message",
                value:
                  "- Orders are typically processed within **15-30 minutes**.\n- However, during **our nighttime (GMT+7 timezone)**, processing may take **6-8 hours**.\n**<a:mt_yayyy:1282967627685298176> We appreciate your patience and understanding. <a:mt_yayyy:1282967627685298176>**",
              },
            ],
          });
          const user = await discordBot.users.fetch(
            dbOrder.Buyer.platformUserId
          );
          const [] = await Promise.all([
            interaction.message.edit({
              embeds: [relpyEmbed],
              components: [],
            }),
            user.send({
              embeds: [userEmbed],
            }),
          ]);
        }
      } catch (error) {
        return await interaction.reply({
          content: (error as Error).message,
          options: { ephemeral: true },
        });
      }
    }
  } catch (error) {}
}
