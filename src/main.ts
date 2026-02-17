import { Hono } from "hono";
import { AiService } from "./domain/services/ai.service";
import { ConversationService } from "./domain/services/conversation.service";
import { createConversationController } from "./infrastructure/controllers/conversation.controller";
import { errorHandler } from "./infrastructure/middleware/error-handler";
import { MongoDbRepository } from "./infrastructure/repositories/mongodb.repository";

export function createApp() {
  const app = new Hono();

  // Global Error Handler
  app.onError(errorHandler);

  // Dependency Injection
  const repository = new MongoDbRepository();
  const aiService = new AiService();
  const conversationService = new ConversationService(repository, aiService);

  // Routes
  app.get("/", (c) => c.text("Chat Hono App"));
  app.route("/conversations", createConversationController(conversationService));

  return app;
}
