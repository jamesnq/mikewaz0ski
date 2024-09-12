import {
  ChannelType,
  CommandInteraction,
  SlashCommandBuilder,
  TextChannel,
} from "discord.js";
import { embedTemplate } from "../utils/embedTemplate";
import discordBot from "../discord-bot";

export const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Send embed to a channel")
  .addStringOption((option) =>
    option.setName("title").setDescription("Embed title").setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("Embed description")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("color").setDescription("Embed color").setRequired(true)
  )
  .addStringOption((option) =>
    option.setName("thumbnail").setDescription("Embed thumbnail url")
  )
  .addStringOption((option) =>
    option.setName("image").setDescription("Embed image url")
  )
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel to send embed")
      .addChannelTypes(ChannelType.GuildText)
  );

export async function execute(interaction: CommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  const title: string = interaction.options.get("title")?.value?.toString()!;
  const description: string = interaction.options
    .get("description")
    ?.value?.toString()!;
  const color: string = interaction.options.get("color")?.value?.toString()!;
  const thumbnail = interaction.options.get("thumbnail")?.value
    ? interaction.options.get("thumbnail")?.value!.toString()
    : undefined;
  const image = interaction.options.get("image")?.value
    ? interaction.options.get("image")?.value!.toString()
    : undefined;
  const channel = interaction.options.get("channel")?.channel as TextChannel;

  // Ensure color is converted to a proper number
  const embedColor = parseInt(color.replace("#", ""), 16);

  const embed = embedTemplate({
    title,
    description,
    color: embedColor,
    thumbnail,
    image,
    bot: discordBot.user!,
  });

  await channel.send({ embeds: [embed] });

  return interaction.editReply("Embed sent successfully!");
}
