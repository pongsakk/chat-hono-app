import { Hono } from "hono";
import type { ConversationService } from "../../domain/services/conversation.service";
import {
  CreateConversationSchema,
  RenameConversationSchema,
  SendMessageSchema,
  PaginationQuerySchema,
} from "../../domain/dtos/conversation.dto";
import {
  NotFoundError,
  UnprocessableEntityError,
} from "../middleware/error-handler";

export function createConversationController(service: ConversationService) {
  const controller = new Hono();

  // GET /v1/conversations — paginated list
  controller.get("/", async (c) => {
    const { offset, limit } = PaginationQuerySchema.parse({
      offset: c.req.query("offset"),
      limit: c.req.query("limit"),
    });

    const result = await service.list(offset, limit);
    return c.json({ success: true, ...result });
  });

  // POST /v1/conversations — create new conversation
  controller.post("/", async (c) => {
    const { title } = CreateConversationSchema.parse(await c.req.json());

    const conversation = await service.create(title || "New Conversation");
    return c.json({ success: true, data: conversation }, 201);
  });

  // POST /v1/conversations/:id/messages — send message
  controller.post("/:id/messages", async (c) => {
    const id = c.req.param("id");
    const { content } = SendMessageSchema.parse(await c.req.json());

    const conversation = await service.getById(id);
    if (!conversation) {
      throw new NotFoundError(`Conversation '${id}' not found`);
    }

    const { userMessage, assistantMessage } = await service.sendMessage(id, content);
    return c.json({ success: true, data: { userMessage, assistantMessage } }, 201);
  });

  // PATCH /v1/conversations/:id — rename conversation
  controller.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const { title } = RenameConversationSchema.parse(await c.req.json());

    const existing = await service.getById(id);
    if (!existing) {
      throw new NotFoundError(`Conversation '${id}' not found`);
    }

    if (existing.title === title) {
      throw new UnprocessableEntityError("New title must be different from the current title");
    }

    const updated = await service.rename(id, title);
    return c.json({ success: true, data: updated });
  });

  return controller;
}
