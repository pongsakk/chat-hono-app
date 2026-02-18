import { Hono } from "hono";
import { connectToDatabase } from "./infrastructure/database/mongo-client";
import { MongoConversationRepository, MongoMessageRepository } from "./infrastructure/repositories/mongodb.repository";
import { MockAiService } from "./domain/services/ai.service";
import { ConversationService } from "./domain/services/conversation.service";
import { createConversationController } from "./infrastructure/controllers/conversation.controller";
import { errorHandler } from "./infrastructure/middleware/error-handler";

export async function createApp() {
  const app = new Hono();

  // Global Error Handler
  app.onError(errorHandler);

  // Database
  const db = await connectToDatabase();

  // Dependency Injection
  const conversationRepo = new MongoConversationRepository(db);
  const messageRepo = new MongoMessageRepository(db);
  const aiService = new MockAiService();
  const conversationService = new ConversationService(conversationRepo, messageRepo, aiService);

  // Routes
  app.get("/", (c) =>
    c.json({ success: true, data: { name: "A.E.G.I.S.", version: "1.0.0" } }),
  );
  app.route("/v1/conversations", createConversationController(conversationService));

  return app;
}
