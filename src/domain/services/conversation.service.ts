import type { PaginatedResponse } from "../dtos/conversation.dto";
import type { Conversation } from "../entities/conversation";
import type { Message } from "../entities/message";
import type {
  IConversationRepository,
  IMessageRepository,
} from "../repositories/conversation.repository";
import type { IAiService } from "./ai.service";

export class ConversationService {
  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly messageRepo: IMessageRepository,
    private readonly aiService: IAiService,
  ) {}

  async create(title: string): Promise<Conversation> {
    const conversation: Conversation = {
      id: crypto.randomUUID(),
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return this.conversationRepo.save(conversation);
  }

  async list(offset: number, limit: number): Promise<PaginatedResponse<Conversation>> {
    const [data, total] = await Promise.all([
      this.conversationRepo.findAll(offset, limit),
      this.conversationRepo.count(),
    ]);
    return { data, pagination: { offset, limit, total } };
  }

  async getById(id: string): Promise<Conversation | null> {
    return this.conversationRepo.findById(id);
  }

  async getMessages(
    conversationId: string,
    offset: number,
    limit: number,
  ): Promise<PaginatedResponse<Message>> {
    const [data, total] = await Promise.all([
      this.messageRepo.findByConversationId(conversationId, offset, limit),
      this.messageRepo.countByConversationId(conversationId),
    ]);
    return { data, pagination: { offset, limit, total } };
  }

  async rename(id: string, title: string): Promise<Conversation | null> {
    return this.conversationRepo.updateTitle(id, title);
  }

  async sendMessage(
    conversationId: string,
    content: string,
  ): Promise<{ userMessage: Message; assistantMessage: Message }> {
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

    await this.messageRepo.addMessages([userMessage, assistantMessage]);
    await this.conversationRepo.touch(conversationId);

    return { userMessage, assistantMessage };
  }
}
