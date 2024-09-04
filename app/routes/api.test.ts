import prisma from "@/services/db.server";
import { LoaderFunctionArgs } from "@remix-run/node";
export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") return;

  const data = await prisma.order.deleteMany({});
  console.log("🚀 ~ loader ~ discordBot.user?:", data);
  return new Response("ok");
}
