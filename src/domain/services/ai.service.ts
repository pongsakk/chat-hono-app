export interface IAiService {
  generateReply(userMessage: string): Promise<string>;
}

export class MockAiService implements IAiService {
  async generateReply(userMessage: string): Promise<string> {
    const reversed = userMessage.split("").reverse().join("");
    return `[AI Echo] You said: "${userMessage}" | Reversed: "${reversed}"`;
  }
}
