import discordBot from "@/services/bot/discord/discord-bot";
import telegramBot from "@/services/bot/telegram-bot";
import { LoaderFunctionArgs } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  if (discordBot.isReady()) return "ok";

  discordBot.login(process.env.DISCORD_TOKEN);
  // discordBot.login(process.env.DISCORD_TOKEN_TEST);

  telegramBot
    .launch(() => {
      console.log("Telegram bot is running...");
    })
    .catch((error) => {
      console.error("Failed to launch bot:", error);
    });

  return "ok";
}
