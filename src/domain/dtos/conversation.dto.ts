import { z } from "zod";

export const CreateConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title must not be empty")
    .optional(),
});

export const RenameConversationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required and must be a non-empty string"),
});

export const SendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Content is required and must be a non-empty string"),
});

export const PaginationQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateConversationDto = z.infer<typeof CreateConversationSchema>;
export type RenameConversationDto = z.infer<typeof RenameConversationSchema>;
export type SendMessageDto = z.infer<typeof SendMessageSchema>;
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}
