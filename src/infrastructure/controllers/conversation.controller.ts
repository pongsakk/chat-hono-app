import { Hono } from "hono";
import type { ConversationService } from "../../domain/services/conversation.service";

export function createConversationController(service: ConversationService) {
  const controller = new Hono();

  // สร้าง conversation ใหม่
  controller.post("/", async (c) => {
    const { title } = await c.req.json();
    const conversation = await service.createConversation(title || "New Chat");
    return c.json(conversation, 201);
  });

  // ดึง conversation ทั้งหมด
  controller.get("/", async (c) => {
    const conversations = await service.listConversations();
    return c.json(conversations);
  });

  // ดึง conversation ตาม id
  controller.get("/:id", async (c) => {
    const id = c.req.param("id");
    const conversation = await service.getConversation(id);
    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }
    return c.json(conversation);
  });

  // ส่งข้อความใน conversation
  controller.post("/:id/messages", async (c) => {
    const id = c.req.param("id");
    const { content } = await c.req.json();
    const conversation = await service.getConversation(id);
    if (!conversation) {
      return c.json({ error: "Conversation not found" }, 404);
    }
    const reply = await service.sendMessage(id, content);
    return c.json(reply, 201);
  });

  return controller;
}
