import { Client, Events, GatewayIntentBits } from "discord.js";
const discordBot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

discordBot.on("ready", () => {
  console.log(`Logged in as ${discordBot?.user?.tag}!`);
});
discordBot.on(Events.MessageCreate, (message) => {
  // Đảm bảo bot không phản hồi chính nó
  if (message.author.bot) return;

  // In nội dung tin nhắn ra console
  console.log(`Tin nhắn từ ${message.author.tag}: ${message.content}`);
});

discordBot.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "ping") {
    await interaction.reply("Pong!");
  }
});
discordBot.login(process.env.DISCORD_TOKEN);
export default discordBot;
