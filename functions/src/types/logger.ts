export type LoggerPayload = {
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
};