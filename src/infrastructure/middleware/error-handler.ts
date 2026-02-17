import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(404, message);
    this.name = "NotFoundError";
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

export class InternalServerError extends AppError {
  constructor(message = "Internal server error") {
    super(500, message);
    this.name = "InternalServerError";
  }
}

export function errorHandler(err: Error, c: Context) {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    return c.json(
      { error: err.name, message: err.message },
      err.statusCode as StatusCode,
    );
  }

  return c.json(
    { error: "InternalServerError", message: "Something went wrong" },
    500,
  );
}
