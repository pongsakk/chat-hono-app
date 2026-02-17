import { Hono } from "hono";
import type { ConversationService } from "../../domain/services/conversation.service";
import { NotFoundError, BadRequestError } from "../middleware/error-handler";

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
      throw new NotFoundError("Conversation not found");
    }
    return c.json(conversation);
  });

  // ส่งข้อความใน conversation
  controller.post("/:id/messages", async (c) => {
    const id = c.req.param("id");
    const { content } = await c.req.json();

    if (!content) {
      throw new BadRequestError("Message content is required");
    }

    const conversation = await service.getConversation(id);
    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    const reply = await service.sendMessage(id, content);
    return c.json(reply, 201);
  });

  return controller;
}
