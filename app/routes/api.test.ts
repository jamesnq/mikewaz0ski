import { CreateOrderSchema } from "@/lib/zod-schema";
import prisma from "@/services/db.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import discordBot from "@/services/bot/discord/discord-bot";
import telegramBot from "@/services/bot/telegram-bot";
import { z } from "zod";
export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") return;

  console.log("🚀 ~ loader ~ discordBot.user?:", discordBot.user);
  return new Response("ok");
}
