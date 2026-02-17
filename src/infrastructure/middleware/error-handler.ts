import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, message);
    this.name = "BadRequestError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable entity") {
    super(422, message);
    this.name = "UnprocessableEntityError";
  }
}

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(500, message);
    this.name = "InternalServerError";
  }
}

export function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.map(String).join("."),
      message: issue.message,
    }));
    return c.json(
      {
        success: false,
        error: { code: 400, name: "ValidationError", message: "Validation failed", details },
      },
      400,
    );
  }

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: { code: err.statusCode, name: err.name, message: err.message },
      },
      err.statusCode as StatusCode,
    );
  }

  return c.json(
    {
      success: false,
      error: { code: 500, name: "InternalServerError", message: "Something went wrong" },
    },
    500,
  );
}
