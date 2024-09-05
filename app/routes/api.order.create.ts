import { orderController } from "@/controller/oder-controller";
import { ActionFunctionArgs, json } from "@remix-run/node";

export async function action({ request }: ActionFunctionArgs) {
  await orderController.create(await request.json());
  return { message: "Create order success" };
}
