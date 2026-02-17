import type { Conversation } from "../entities/conversation";
import type { Message } from "../entities/message";
import type { MongoDbRepository } from "../../infrastructure/repositories/mongodb.repository";
import { AiService } from "./ai.service";

export class ConversationService {
  private repository: MongoDbRepository;
  private aiService: AiService;

  constructor(repository: MongoDbRepository, aiService: AiService) {
    this.repository = repository;
    this.aiService = aiService;
  }

  async createConversation(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.repository.saveConversation(conversation);
  }

  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "user",
      content,
      createdAt: new Date(),
    };

    await this.repository.addMessage(userMessage);

    const aiReply = await this.aiService.generateReply(content);
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "assistant",
      content: aiReply,
      createdAt: new Date(),
    };

    await this.repository.addMessage(assistantMessage);
    return assistantMessage;
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.repository.findConversation(id);
  }

  async listConversations(): Promise<Conversation[]> {
    return this.repository.findAllConversations();
  }
}
