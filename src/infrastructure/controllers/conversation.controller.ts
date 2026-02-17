import { Hono } from "hono";
import type { ConversationService } from "../../domain/services/conversation.service";
import type {
  CreateConversationDto,
  RenameConversationDto,
  SendMessageDto,
} from "../../domain/dtos/conversation.dto";
import {
  BadRequestError,
  NotFoundError,
  UnprocessableEntityError,
} from "../middleware/error-handler";

export function createConversationController(service: ConversationService) {
  const controller = new Hono();

  // GET /v1/conversations — paginated list
  controller.get("/", async (c) => {
    const offset = Math.max(0, Number(c.req.query("offset")) || 0);
    const limit = Math.min(100, Math.max(1, Number(c.req.query("limit")) || 20));

    const result = await service.list(offset, limit);
    return c.json({ success: true, ...result });
  });

  // POST /v1/conversations — create new conversation
  controller.post("/", async (c) => {
    const body = await c.req.json<CreateConversationDto>();
    const title = body.title?.trim();

    if (title !== undefined && title.length === 0) {
      throw new BadRequestError("Title must not be empty if provided");
    }

    const conversation = await service.create(title || "New Conversation");
    return c.json({ success: true, data: conversation }, 201);
  });

  // POST /v1/conversations/:id/messages — send message
  controller.post("/:id/messages", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<SendMessageDto>();

    if (!body.content || typeof body.content !== "string" || !body.content.trim()) {
      throw new BadRequestError("Field 'content' is required and must be a non-empty string");
    }

    const conversation = await service.getById(id);
    if (!conversation) {
      throw new NotFoundError(`Conversation '${id}' not found`);
    }

    const { userMessage, assistantMessage } = await service.sendMessage(id, body.content.trim());
    return c.json({ success: true, data: { userMessage, assistantMessage } }, 201);
  });

  // PATCH /v1/conversations/:id — rename conversation
  controller.patch("/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<RenameConversationDto>();

    if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
      throw new BadRequestError("Field 'title' is required and must be a non-empty string");
    }

    const existing = await service.getById(id);
    if (!existing) {
      throw new NotFoundError(`Conversation '${id}' not found`);
    }

    if (existing.title === body.title.trim()) {
      throw new UnprocessableEntityError("New title must be different from the current title");
    }

    const updated = await service.rename(id, body.title.trim());
    return c.json({ success: true, data: updated });
  });

  return controller;
}
