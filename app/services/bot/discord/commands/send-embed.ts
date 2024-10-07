import {
  ChannelType,
  ChatInputCommandInteraction,
  CommandInteraction,
  PermissionFlagsBits,
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
    option
      .setName("color")
      .setDescription("Embed color (hex)")
      .setRequired(true)
  )
  .addBooleanOption((option) =>
    option
      .setName("inline_fields")
      .setDescription("Should fields be inline?")
      .setRequired(true)
  )
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel to send embed")
      .addChannelTypes(ChannelType.GuildText)
  )
  .addStringOption((option) =>
    option.setName("thumbnail").setDescription("Embed thumbnail URL")
  )
  .addStringOption((option) =>
    option.setName("image").setDescription("Embed image URL")
  );

for (let i = 0; i < 5; i++) {
  data.addStringOption((option) =>
    option
      .setName(`field${i + 1}_name`)
      .setDescription(`Name of field ${i + 1}`)
  );
  data.addStringOption((option) =>
    option
      .setName(`field${i + 1}_value`)
      .setDescription(`Value of field ${i + 1}`)
  );
}

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });
  if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.editReply(
      "You don't have permission to use this command."
    );
  }
  const title: string = interaction.options.get("title")?.value?.toString()!;
  const description: string = interaction.options
    .get("description")
    ?.value?.toString()!;
  const color: string = interaction.options.get("color")?.value?.toString()!;
  // Ensure color is converted to a proper number
  const embedColor = parseInt(color.replace("#", ""), 16);
  const thumbnail = interaction.options.get("thumbnail")?.value
    ? interaction.options.get("thumbnail")?.value!.toString()
    : undefined;
  const image = interaction.options.get("image")?.value
    ? interaction.options.get("image")?.value!.toString()
    : undefined;
  const channel =
    (interaction.options.get("channel")?.channel as TextChannel) ||
    (interaction.channel as TextChannel);
  const inlineFields: boolean = interaction.options.get("inline_fields")
    ?.value as boolean;

  // Collect fields
  const fields = [];
  for (let i = 0; i < 5; i++) {
    const name: string = interaction.options
      .get(`field${i + 1}_name`)
      ?.value?.toString()!;
    const value: string = interaction.options
      .get(`field${i + 1}_value`)
      ?.value?.toString()!;
    if (name && value) {
      fields.push({ name, value, inline: inlineFields });
    } else {
      break; // Stop if we encounter an empty field
    }
  }

  const embed = embedTemplate({
    title,
    description,
    color: embedColor,
    thumbnail,
    image,
    bot: discordBot.user!,
    fields,
  });

  if (channel && channel.isTextBased()) {
    await channel.send({ embeds: [embed] });
    return interaction.editReply("Embed sent successfully!");
  } else {
    console.error("Invalid channel");
    return interaction.editReply(
      "Error: Unable to send the embed. Invalid channel."
    );
  }
}
