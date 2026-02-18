import { describe, expect, it, beforeEach } from "bun:test";
import { ConversationService } from "../conversation.service";
import type { IConversationRepository } from "../../repositories/conversation.repository";
import type { IAiService } from "../ai.service";
import type { Conversation } from "../../entities/conversation";
import type { Message } from "../../entities/message";

// Mock repository
function createMockRepository(): IConversationRepository {
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
    async addMessage(conversationId: string, messages: Message[]) {
      const conv = store.get(conversationId);
      if (!conv) return null;
      conv.messages.push(...messages);
      conv.updatedAt = new Date();
      return conv;
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
  let repository: IConversationRepository;

  beforeEach(() => {
    repository = createMockRepository();
    service = new ConversationService(repository, mockAiService);
  });

  describe("create", () => {
    it("should create a new conversation", async () => {
      const conv = await service.create("Test Chat");
      expect(conv.title).toBe("Test Chat");
      expect(conv.id).toBeString();
      expect(conv.messages).toEqual([]);
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

    it("should persist both messages to the conversation", async () => {
      const conv = await service.create("Chat");
      await service.sendMessage(conv.id, "Hi");

      const updated = await service.getById(conv.id);
      expect(updated!.messages).toHaveLength(2);
      expect(updated!.messages[0]!.role).toBe("user");
      expect(updated!.messages[1]!.role).toBe("assistant");
    });

    it("should set correct conversationId on messages", async () => {
      const conv = await service.create("Chat");
      const result = await service.sendMessage(conv.id, "Test");

      expect(result.userMessage.conversationId).toBe(conv.id);
      expect(result.assistantMessage.conversationId).toBe(conv.id);
    });
  });
});
