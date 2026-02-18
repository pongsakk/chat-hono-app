import type { Collection, Db } from "mongodb";
import type { Conversation } from "../../domain/entities/conversation";
import type { Message } from "../../domain/entities/message";
import type {
  IConversationRepository,
  IMessageRepository,
} from "../../domain/repositories/conversation.repository";

export class MongoConversationRepository implements IConversationRepository {
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
      .find({}, { projection: { _id: 0 } })
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

  async touch(id: string): Promise<void> {
    await this.conversations.updateOne(
      { id },
      { $set: { updatedAt: new Date() } },
    );
  }
}

export class MongoMessageRepository implements IMessageRepository {
  private messages: Collection<Message>;

  constructor(db: Db) {
    this.messages = db.collection<Message>("messages");
  }

  async addMessages(messages: Message[]): Promise<void> {
    if (messages.length > 0) {
      await this.messages.insertMany(messages.map((m) => ({ ...m })));
    }
  }

  async findByConversationId(conversationId: string, offset: number, limit: number): Promise<Message[]> {
    return this.messages
      .find({ conversationId }, { projection: { _id: 0 } })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  }

  async countByConversationId(conversationId: string): Promise<number> {
    return this.messages.countDocuments({ conversationId });
  }
}
