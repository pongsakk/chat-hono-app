import { describe, expect, it, beforeEach } from "bun:test";
import { ConversationService } from "../conversation.service";
import type { IConversationRepository, IMessageRepository } from "../../repositories/conversation.repository";
import type { IAiService } from "../ai.service";
import type { Conversation } from "../../entities/conversation";
import type { Message } from "../../entities/message";

// Mock conversation repository
function createMockConversationRepo(): IConversationRepository {
  const store = new Map<string, Conversation>();

  return {
    async save(conversation: Conversation) {
      store.set(conversation.id, conversation);
      return conversation;
    },
    async findById(id: string) {
      return store.get(id) || null;
    },
    async findAll(offset: number, limit: number) {
      return Array.from(store.values()).slice(offset, offset + limit);
    },
    async count() {
      return store.size;
    },
    async updateTitle(id: string, title: string) {
      const conv = store.get(id);
      if (!conv) return null;
      conv.title = title;
      conv.updatedAt = new Date();
      return conv;
    },
    async touch() {},
  };
}

// Mock message repository
function createMockMessageRepo(): IMessageRepository {
  const messages: Message[] = [];

  return {
    async addMessages(msgs: Message[]) {
      messages.push(...msgs);
    },
    async findByConversationId(conversationId: string, offset: number, limit: number) {
      const filtered = messages.filter((m) => m.conversationId === conversationId);
      return filtered.slice(offset, offset + limit);
    },
    async countByConversationId(conversationId: string) {
      return messages.filter((m) => m.conversationId === conversationId).length;
    },
  };
}

// Mock AI service
const mockAiService: IAiService = {
  async generateReply(msg: string) {
    return `Mock reply to: ${msg}`;
  },
};

describe("ConversationService", () => {
  let service: ConversationService;
  let conversationRepo: IConversationRepository;
  let messageRepo: IMessageRepository;

  beforeEach(() => {
    conversationRepo = createMockConversationRepo();
    messageRepo = createMockMessageRepo();
    service = new ConversationService(conversationRepo, messageRepo, mockAiService);
  });

  describe("create", () => {
    it("should create a new conversation", async () => {
      const conv = await service.create("Test Chat");
      expect(conv.title).toBe("Test Chat");
      expect(conv.id).toBeString();
    });

    it("should persist the conversation", async () => {
      const conv = await service.create("Persisted");
      const found = await service.getById(conv.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe("Persisted");
    });
  });

  describe("list", () => {
    it("should return paginated results", async () => {
      await service.create("Chat 1");
      await service.create("Chat 2");
      await service.create("Chat 3");

      const result = await service.list(0, 2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(2);
    });

    it("should return empty when no conversations", async () => {
      const result = await service.list(0, 20);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe("getById", () => {
    it("should return conversation by id", async () => {
      const conv = await service.create("Find Me");
      const found = await service.getById(conv.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe("Find Me");
    });

    it("should return null for non-existent id", async () => {
      const found = await service.getById("non-existent");
      expect(found).toBeNull();
    });
  });

  describe("getMessages", () => {
    it("should return paginated messages for a conversation", async () => {
      const conv = await service.create("Chat");
      await service.sendMessage(conv.id, "Hello");
      await service.sendMessage(conv.id, "World");

      const result = await service.getMessages(conv.id, 0, 20);
      expect(result.data).toHaveLength(4); // 2 user + 2 assistant
      expect(result.pagination.total).toBe(4);
    });

    it("should respect pagination offset and limit", async () => {
      const conv = await service.create("Chat");
      await service.sendMessage(conv.id, "Msg1");
      await service.sendMessage(conv.id, "Msg2");

      const result = await service.getMessages(conv.id, 0, 2);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(4);
    });

    it("should return empty for conversation with no messages", async () => {
      const conv = await service.create("Empty");
      const result = await service.getMessages(conv.id, 0, 20);
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe("rename", () => {
    it("should rename a conversation", async () => {
      const conv = await service.create("Old Title");
      const renamed = await service.rename(conv.id, "New Title");
      expect(renamed).not.toBeNull();
      expect(renamed!.title).toBe("New Title");
    });

    it("should return null for non-existent id", async () => {
      const result = await service.rename("fake-id", "Title");
      expect(result).toBeNull();
    });
  });

  describe("sendMessage", () => {
    it("should return user and assistant messages", async () => {
      const conv = await service.create("Chat");
      const result = await service.sendMessage(conv.id, "Hello");

      expect(result.userMessage.role).toBe("user");
      expect(result.userMessage.content).toBe("Hello");
      expect(result.assistantMessage.role).toBe("assistant");
      expect(result.assistantMessage.content).toContain("Mock reply to: Hello");
    });

    it("should persist both messages", async () => {
      const conv = await service.create("Chat");
      await service.sendMessage(conv.id, "Hi");

      const messages = await service.getMessages(conv.id, 0, 20);
      expect(messages.data).toHaveLength(2);
      expect(messages.data[0]!.role).toBe("user");
      expect(messages.data[1]!.role).toBe("assistant");
    });

    it("should set correct conversationId on messages", async () => {
      const conv = await service.create("Chat");
      const result = await service.sendMessage(conv.id, "Test");

      expect(result.userMessage.conversationId).toBe(conv.id);
      expect(result.assistantMessage.conversationId).toBe(conv.id);
    });
  });
});
