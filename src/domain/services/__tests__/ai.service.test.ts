import { describe, expect, it } from "bun:test";
import { MockAiService } from "../ai.service";

describe("MockAiService", () => {
  const service = new MockAiService();

  it("should return a reply containing the original message", async () => {
    const reply = await service.generateReply("Hello");
    expect(reply).toContain("Hello");
  });

  it("should return a reply containing the reversed message", async () => {
    const reply = await service.generateReply("Hello");
    expect(reply).toContain("olleH");
  });

  it("should handle empty string", async () => {
    const reply = await service.generateReply("");
    expect(reply).toBeString();
  });

  it("should handle special characters", async () => {
    const reply = await service.generateReply("สวัสดี!");
    expect(reply).toContain("สวัสดี!");
  });
});
