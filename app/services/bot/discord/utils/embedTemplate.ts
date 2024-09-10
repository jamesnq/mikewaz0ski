import {
  ButtonInteraction,
  ClientUser,
  EmbedBuilder,
  TextChannel,
} from "discord.js";

/**
 * Embed template function that returns a reusable embed object.
 * @param title - Title of the embed
 * @param description - Description of the embed
 * @param color - Color of the embed (in hexadecimal)
 * @param fields - Optional fields array for additional embed fields (name and value pairs)
 * @param footer - Optional footer text
 * @param thumbnail - Optional URL for the embed thumbnail
 * @param image - Optional URL for the embed image
 * @param url - Optional URL that the embed title will link to
 * @returns {EmbedBuilder} - The customized embed
 */
export const embedTemplate = ({
  bot,
  title,
  description,
  color,
  fields = [],
  thumbnail,
  image,
  url,
}: {
  bot: ClientUser;
  title: string;
  description: string;
  color: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  thumbnail?: string;
  image?: string;
  url?: string;
}): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setFooter({
      text: bot.username, // Footer text as bot's name
      iconURL: bot.displayAvatarURL(), // Footer icon as bot's avatar
    })
    .setTimestamp();

  if (fields) embed.setFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (url) embed.setURL(url);

  return embed;
};
