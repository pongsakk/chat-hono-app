export interface CreateConversationDto {
  title?: string;
}

export interface RenameConversationDto {
  title: string;
}

export interface SendMessageDto {
  content: string;
}

export interface PaginationQuery {
  offset: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    offset: number;
    limit: number;
    total: number;
  };
}
