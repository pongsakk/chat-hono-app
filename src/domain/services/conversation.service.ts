import type { PaginatedResponse } from "../dtos/conversation.dto";
import type { Conversation } from "../entities/conversation";
import type { Message } from "../entities/message";
import type { IConversationRepository } from "../repositories/conversation.repository";
import type { IAiService } from "./ai.service";

export class ConversationService {
  constructor(
    private readonly repository: IConversationRepository,
    private readonly aiService: IAiService,
  ) {}

  async create(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.repository.save(conversation);
  }

  async list(offset: number, limit: number): Promise<PaginatedResponse<Conversation>> {
    const [data, total] = await Promise.all([
      this.repository.findAll(offset, limit),
      this.repository.count(),
    ]);
    return { data, pagination: { offset, limit, total } };
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.repository.findById(id);
  }

  async rename(id: string, title: string): Promise<Conversation | null> {
    return this.repository.updateTitle(id, title);
  }

  async sendMessage(conversationId: string, content: string): Promise<{ userMessage: Message; assistantMessage: Message }> {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "user",
      content,
      createdAt: new Date(),
    };

    const aiReply = await this.aiService.generateReply(content);
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      conversationId,
      role: "assistant",
      content: aiReply,
      createdAt: new Date(),
    };
    const updatedConversation = [
      userMessage,
      assistantMessage,
    ]
    await this.repository.addMessage(conversationId, updatedConversation);

    return { userMessage, assistantMessage };
  }
}
