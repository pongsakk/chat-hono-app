import type { Conversation } from "../../domain/entities/conversation";
import type { Message } from "../../domain/entities/message";

export class MongoDbRepository {
  // In-memory store (mock) - เปลี่ยนเป็น MongoDB จริงทีหลัง
  private conversations: Map<string, Conversation> = new Map();

  async saveConversation(conversation: Conversation): Promise<Conversation> {
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }

  async findConversation(id: string): Promise<Conversation | null> {
    return this.conversations.get(id) || null;
  }

  async findAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async addMessage(message: Message): Promise<void> {
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = new Date();
    }
  }
}
