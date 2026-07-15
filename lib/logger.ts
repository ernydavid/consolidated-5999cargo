export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    console.info(message, metadata ?? {});
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    console.warn(message, metadata ?? {});
  },
  error(message: string, metadata?: Record<string, unknown>) {
    console.error(message, metadata ?? {});
  },
};
