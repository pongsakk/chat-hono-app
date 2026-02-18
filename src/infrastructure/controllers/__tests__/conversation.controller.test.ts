import { describe, expect, it, beforeEach } from "bun:test";
import { Hono } from "hono";
import { createConversationController } from "../conversation.controller";
import { ConversationService } from "../../../domain/services/conversation.service";
import { errorHandler } from "../../middleware/error-handler";
import type { IConversationRepository } from "../../../domain/repositories/conversation.repository";
import type { IAiService } from "../../../domain/services/ai.service";
import type { Conversation } from "../../../domain/entities/conversation";
import type { Message } from "../../../domain/entities/message";

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

const mockAi: IAiService = {
  async generateReply(msg: string) {
    return `Reply: ${msg}`;
  },
};

function createTestApp() {
  const repo = createMockRepository();
  const service = new ConversationService(repo, mockAi);
  const app = new Hono();
  app.onError(errorHandler);
  app.route("/v1/conversations", createConversationController(service));
  return app;
}

describe("Conversation Controller", () => {
  let app: Hono;

  beforeEach(() => {
    app = createTestApp();
  });

  describe("POST /v1/conversations", () => {
    it("should create a conversation and return 201", async () => {
      const res = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Test Chat" }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("Test Chat");
      expect(body.data.id).toBeString();
    });

    it("should use default title when not provided", async () => {
      const res = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.data.title).toBe("New Conversation");
    });

    it("should return 400 for empty title string", async () => {
      const res = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "" }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /v1/conversations", () => {
    it("should return paginated list", async () => {
      // Create some conversations
      await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat 1" }),
      });
      await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat 2" }),
      });

      const res = await app.request("/v1/conversations?offset=0&limit=10");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data).toBeArray();
      expect(body.pagination.total).toBe(2);
    });

    it("should use default pagination", async () => {
      const res = await app.request("/v1/conversations");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.pagination.offset).toBe(0);
      expect(body.pagination.limit).toBe(20);
    });
  });

  describe("GET /v1/conversations/:id", () => {
    it("should return conversation with messages", async () => {
      const createRes = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My Chat" }),
      });
      const { data: conv } = await createRes.json();

      const res = await app.request(`/v1/conversations/${conv.id}`);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("My Chat");
      expect(body.data.messages).toBeArray();
    });

    it("should return 404 for non-existent id", async () => {
      const res = await app.request("/v1/conversations/fake-id");
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe(404);
    });
  });

  describe("POST /v1/conversations/:id/messages", () => {
    it("should send message and return 201 with user + assistant messages", async () => {
      const createRes = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat" }),
      });
      const { data: conv } = await createRes.json();

      const res = await app.request(`/v1/conversations/${conv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      });

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.userMessage.role).toBe("user");
      expect(body.data.userMessage.content).toBe("Hello");
      expect(body.data.assistantMessage.role).toBe("assistant");
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/v1/conversations/fake-id/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      });

      expect(res.status).toBe(404);
    });

    it("should return 400 for missing content", async () => {
      const createRes = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat" }),
      });
      const { data: conv } = await createRes.json();

      const res = await app.request(`/v1/conversations/${conv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /v1/conversations/:id", () => {
    it("should rename conversation", async () => {
      const createRes = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Old" }),
      });
      const { data: conv } = await createRes.json();

      const res = await app.request(`/v1/conversations/${conv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New" }),
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.title).toBe("New");
    });

    it("should return 404 for non-existent conversation", async () => {
      const res = await app.request("/v1/conversations/fake-id", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New" }),
      });

      expect(res.status).toBe(404);
    });

    it("should return 422 when title is same as current", async () => {
      const createRes = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Same" }),
      });
      const { data: conv } = await createRes.json();

      const res = await app.request(`/v1/conversations/${conv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Same" }),
      });

      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error.code).toBe(422);
    });

    it("should return 400 for missing title", async () => {
      const createRes = await app.request("/v1/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Chat" }),
      });
      const { data: conv } = await createRes.json();

      const res = await app.request(`/v1/conversations/${conv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      expect(res.status).toBe(400);
    });
  });
});
