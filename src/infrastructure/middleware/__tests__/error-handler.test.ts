import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import {
  AppError,
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
  UnprocessableEntityError,
  InternalServerError,
  errorHandler,
} from "../error-handler";

describe("Error Classes", () => {
  it("BadRequestError should have status 400", () => {
    const err = new BadRequestError("bad input");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("BadRequestError");
    expect(err.message).toBe("bad input");
    expect(err).toBeInstanceOf(AppError);
  });

  it("UnauthorizedError should have status 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe("UnauthorizedError");
  });

  it("NotFoundError should have status 404", () => {
    const err = new NotFoundError("not here");
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("not here");
  });

  it("UnprocessableEntityError should have status 422", () => {
    const err = new UnprocessableEntityError("invalid");
    expect(err.statusCode).toBe(422);
    expect(err.name).toBe("UnprocessableEntityError");
  });

  it("InternalServerError should have status 500", () => {
    const err = new InternalServerError();
    expect(err.statusCode).toBe(500);
  });

  it("should use default messages", () => {
    expect(new BadRequestError().message).toBe("Bad request");
    expect(new NotFoundError().message).toBe("Resource not found");
    expect(new UnauthorizedError().message).toBe("Unauthorized");
    expect(new UnprocessableEntityError().message).toBe("Unprocessable entity");
    expect(new InternalServerError().message).toBe("Internal server error");
  });
});

describe("errorHandler", () => {
  function createApp(error: Error) {
    const app = new Hono();
    app.onError(errorHandler);
    app.get("/test", () => {
      throw error;
    });
    return app;
  }

  it("should handle AppError with correct status and JSON", async () => {
    const app = createApp(new NotFoundError("Item not found"));
    const res = await app.request("/test");

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(404);
    expect(body.error.name).toBe("NotFoundError");
    expect(body.error.message).toBe("Item not found");
  });

  it("should handle BadRequestError", async () => {
    const app = createApp(new BadRequestError("Missing field"));
    const res = await app.request("/test");

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.code).toBe(400);
  });

  it("should handle unknown errors as 500", async () => {
    const app = createApp(new Error("Something broke"));
    const res = await app.request("/test");

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe(500);
    expect(body.error.name).toBe("InternalServerError");
    expect(body.error.message).toBe("Something went wrong");
  });

  it("should handle ZodError as 400 with validation details", async () => {
    const { z } = await import("zod");
    const schema = z.object({ name: z.string() });

    const app = new Hono();
    app.onError(errorHandler);
    app.get("/test", () => {
      schema.parse({ name: 123 });
    });

    const res = await app.request("/test");
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.name).toBe("ValidationError");
    expect(body.error.details).toBeArray();
    expect(body.error.details.length).toBeGreaterThan(0);
    expect(body.error.details[0].field).toBe("name");
  });
});
