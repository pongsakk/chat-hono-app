export class AiService {
  async generateReply(userMessage: string): Promise<string> {
    // Mock AI Logic
    return `[Mock AI] คุณพูดว่า: "${userMessage}"`;
  }
}
