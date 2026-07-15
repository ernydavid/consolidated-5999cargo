export class AppError extends Error {
  constructor(
    message: string,
    readonly options: {
      code: string;
      status?: number;
      cause?: unknown;
    },
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
  }
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}
