import { buyerController } from "@/controller/buyer-controller";
import discordBot from "@/services/bot/discord/discord-bot";
import prisma from "@/services/db.server";
import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Collection, Guild, GuildMember } from "discord.js";
import { setTimeout } from "timers/promises";

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") {
    return json(
      { error: "This route is not available in production" },
      { status: 403 }
    );
  }
  // const buyer = await buyerController.updateAllWallet();
  // const buyer = await prisma.buyer.updateMany({
  //   where: {
  //     walletId: {
  //       equals: undefined
  //     }
  //   },
  //   data: {

  //   },
  // });

  // return json({ success: true, buyer });
}
