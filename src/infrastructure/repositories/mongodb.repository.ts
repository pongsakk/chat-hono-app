import type { Collection, Db } from "mongodb";
import type { Conversation } from "../../domain/entities/conversation";
import type { Message } from "../../domain/entities/message";
import type { IConversationRepository } from "../../domain/repositories/conversation.repository";

export class MongoDbRepository implements IConversationRepository {
  private conversations: Collection<Conversation>;

  constructor(db: Db) {
    this.conversations = db.collection<Conversation>("conversations");
  }

  async save(conversation: Conversation): Promise<Conversation> {
    await this.conversations.insertOne({ ...conversation });
    return conversation;
  }

  async findById(id: string): Promise<Conversation | null> {
    return this.conversations.findOne({ id }, { projection: { _id: 0 } });
  }

  async findAll(offset: number, limit: number): Promise<Conversation[]> {
    return this.conversations
      .find({}, { projection: { _id: 0, messages: 0 } })
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async count(): Promise<number> {
    return this.conversations.countDocuments();
  }

  async updateTitle(id: string, title: string): Promise<Conversation | null> {
    const result = await this.conversations.findOneAndUpdate(
      { id },
      { $set: { title, updatedAt: new Date() } },
      { returnDocument: "after", projection: { _id: 0 } },
    );
    return result ?? null;
  }

  async addMessage(conversationId: string, messages: Message[]): Promise<Conversation | null> {
    const result = await this.conversations.findOneAndUpdate(
      { id: conversationId },
      {
        $push: { messages: { $each: messages } },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after", projection: { _id: 0 } },
    );
    return result ?? null;
  }
}
