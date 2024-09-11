import OpenAI from "openai";

type MessageRole = "system" | "user" | "assistant";

interface ChatMessage {
  role: MessageRole;
  content: string;
}

export class ChatGPTService {
  private openai: OpenAI;
  private conversationHistory: ChatMessage[] = [];

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.CHATGPT_TOKEN,
    });

    // Initialize with a system message to set the context
    this.conversationHistory.push({
      role: "system",
      content: `When a customer opens a ticket to buy Mammoth Coin (MMC), ask for the necessary information and guide them as follows:

If the customer has an iOS device, they only need to pay for the MMC.
If they don't have an iOS device, charge an additional $1.
Customers can use Paypal (dodaihoc318@gmail.com) with the Friend and Family option or Binance (ID: 402459357). If there are any issues, they can ping Mike (ID: 852584177382981643).
After the customer says they’ve paid, mention <@852584177382981643>. Once Mike confirms, guide them to use the Order Bot (ID: 1271459835803730016).
Bot command: /order package: MMC package, email: customer’s Apple email, password: Apple ID.
For customers without iOS, there’s no need to guide them, as Mike will handle it.
Once the bot processes the order and the customer confirms the purchase, remind them to vouch for Mike in the vouch channel.

Helpful links: These links contain information and should only be sent if necessary:

Link your main account with Ubisoft: https://discord.com/channels/1254755550709809243/1283343991835856919
Claim skin after purchasing on Apple ID: https://discord.com/channels/1254755550709809243/1283344250569752616
Change platform and cross-progression: https://discord.com/channels/1254755550709809243/1280904477833957467
Security and regulations: https://discord.com/channels/1254755550709809243/1280904812593942601
Prices: https://discord.com/channels/1254755550709809243/1254755606812688516
Purchase procedure: https://discord.com/channels/1254755550709809243/1280904612240556094
For non-iOS devices: https://discord.com/channels/1254755550709809243/1280903953114202193
For iOS devices: https://discord.com/channels/1254755550709809243/1280903801389449351
Account information required: https://discord.com/channels/1254755550709809243/1280903600712712256
Note: Only assist with Mammoth Coin purchases. If the question is not related, respond with "IRRELEVANT" only!.`,
    });
  }

  async processMessage(content: string): Promise<string> {
    try {
      // First, check if the message is relevant
      if (content === "IRRELEVANT") {
        return content;
      }

      // If relevant, proceed with the full conversation
      this.conversationHistory.push({ role: "user", content });

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: this.conversationHistory,
        max_tokens: 2048,
        temperature: 1,
      });

      const assistantReply =
        response.choices[0]?.message?.content ||
        "Sorry, I couldn't generate a response.";

      return assistantReply;
    } catch (error) {
      console.error("Error calling ChatGPT API:", error);
      throw new Error("Failed to process message with ChatGPT");
    }
  }
}
