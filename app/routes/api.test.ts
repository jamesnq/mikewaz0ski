import prisma from "@/services/db.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { ActionFunctionArgs, json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") return;
  const data = await prisma.buyer.findUnique({
    where: { id: "66d85f91fac7bb7ba326ba9a" },
    include: { Orders: { where: { type: "BrawlCoins" } } },
  });

  console.log("🚀 ~ loader ~ discordBot.user?:", data);
  return "ok";
}
