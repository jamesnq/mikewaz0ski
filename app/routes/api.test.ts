import prisma from "@/services/db.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { ActionFunctionArgs, json } from "@remix-run/node";

export async function loader({ request }: LoaderFunctionArgs) {
  if (process.env.NODE_ENV === "production") return;
  await prisma.order.deleteMany();
  console.log("deleted");

  return "ok";
}
