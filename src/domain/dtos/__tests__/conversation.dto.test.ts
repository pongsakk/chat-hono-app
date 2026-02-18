import { describe, expect, it } from "bun:test";
import {
  CreateConversationSchema,
  RenameConversationSchema,
  SendMessageSchema,
  PaginationQuerySchema,
} from "../conversation.dto";

describe("CreateConversationSchema", () => {
  it("should accept empty object (title optional)", () => {
    const result = CreateConversationSchema.parse({});
    expect(result.title).toBeUndefined();
  });

  it("should accept valid title", () => {
    const result = CreateConversationSchema.parse({ title: "My Chat" });
    expect(result.title).toBe("My Chat");
  });

  it("should trim whitespace from title", () => {
    const result = CreateConversationSchema.parse({ title: "  Hello  " });
    expect(result.title).toBe("Hello");
  });

  it("should reject empty string title", () => {
    expect(() => CreateConversationSchema.parse({ title: "" })).toThrow();
  });

  it("should reject whitespace-only title", () => {
    expect(() => CreateConversationSchema.parse({ title: "   " })).toThrow();
  });
});

describe("RenameConversationSchema", () => {
  it("should accept valid title", () => {
    const result = RenameConversationSchema.parse({ title: "New Title" });
    expect(result.title).toBe("New Title");
  });

  it("should trim whitespace", () => {
    const result = RenameConversationSchema.parse({ title: "  Trimmed  " });
    expect(result.title).toBe("Trimmed");
  });

  it("should reject missing title", () => {
    expect(() => RenameConversationSchema.parse({})).toThrow();
  });

  it("should reject empty title", () => {
    expect(() => RenameConversationSchema.parse({ title: "" })).toThrow();
  });

  it("should reject non-string title", () => {
    expect(() => RenameConversationSchema.parse({ title: 123 })).toThrow();
  });
});

describe("SendMessageSchema", () => {
  it("should accept valid content", () => {
    const result = SendMessageSchema.parse({ content: "Hello" });
    expect(result.content).toBe("Hello");
  });

  it("should trim whitespace", () => {
    const result = SendMessageSchema.parse({ content: "  Hi  " });
    expect(result.content).toBe("Hi");
  });

  it("should reject missing content", () => {
    expect(() => SendMessageSchema.parse({})).toThrow();
  });

  it("should reject empty content", () => {
    expect(() => SendMessageSchema.parse({ content: "" })).toThrow();
  });

  it("should reject non-string content", () => {
    expect(() => SendMessageSchema.parse({ content: 42 })).toThrow();
  });
});

describe("PaginationQuerySchema", () => {
  it("should use defaults when empty", () => {
    const result = PaginationQuerySchema.parse({});
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(20);
  });

  it("should coerce string to number", () => {
    const result = PaginationQuerySchema.parse({ offset: "5", limit: "10" });
    expect(result.offset).toBe(5);
    expect(result.limit).toBe(10);
  });

  it("should reject negative offset", () => {
    expect(() => PaginationQuerySchema.parse({ offset: -1 })).toThrow();
  });

  it("should reject limit less than 1", () => {
    expect(() => PaginationQuerySchema.parse({ limit: 0 })).toThrow();
  });

  it("should reject limit greater than 100", () => {
    expect(() => PaginationQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("should accept boundary values", () => {
    const result = PaginationQuerySchema.parse({ offset: 0, limit: 100 });
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(100);
  });
});
