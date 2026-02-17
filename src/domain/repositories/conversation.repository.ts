import type { Conversation } from "../entities/conversation";
import type { Message } from "../entities/message";

export interface IConversationRepository {
  save(conversation: Conversation): Promise<Conversation>;
  findById(id: string): Promise<Conversation | null>;
  findAll(offset: number, limit: number): Promise<Conversation[]>;
  count(): Promise<number>;
  updateTitle(id: string, title: string): Promise<Conversation | null>;
  addMessage(message: Message): Promise<Conversation | null>;
}
