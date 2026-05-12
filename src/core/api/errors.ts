import type { ProblemDetails } from "@/core/api/types";

export class ApiError extends Error {
  readonly status: number;
  readonly problem?: ProblemDetails;

  constructor(message: string, status: number, problem?: ProblemDetails) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }
}

export function getProblemMessage(problem?: ProblemDetails) {
  if (!problem) {
    return "La richiesta non e stata completata.";
  }

  const validationErrors = problem.errors ?? problem.extensions?.errors;
  const firstValidationMessage = validationErrors
    ? Object.values(validationErrors).flat()[0]
    : undefined;
  return (
    problem.additionalInfo ??
    problem.extensions?.additionalInfo ??
    problem.detail ??
    firstValidationMessage ??
    problem.title ??
    "La richiesta non e stata completata."
  );
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    if (error.problem) {
      return getProblemMessage(error.problem) || fallbackMessage;
    }

    return error.message || fallbackMessage;
  }

  if (error instanceof Error) {
    const errorWithProblem = error as Error & { problem?: ProblemDetails };
    if (errorWithProblem.problem) {
      return getProblemMessage(errorWithProblem.problem) || fallbackMessage;
    }

    return error.message || fallbackMessage;
  }

  return fallbackMessage;
}

export type ApiUiError = {
  status?: number;
  userMessage: string;
  fieldErrors: Record<string, string[]>;
  isBadRequest: boolean;
  isConflict: boolean;
  isServerError: boolean;
};

export function toApiUiError(
  error: unknown,
  fallbackMessage: string,
): ApiUiError {
  const fieldErrors =
    error instanceof ApiError
      ? ((error.problem?.errors ??
          error.problem?.extensions?.errors ??
          {}) as Record<string, string[]>)
      : error instanceof Error
        ? (((error as Error & { problem?: ProblemDetails }).problem?.errors ??
            (error as Error & { problem?: ProblemDetails }).problem?.extensions
              ?.errors ??
            {}) as Record<string, string[]>)
        : {};
  const status =
    error instanceof ApiError
      ? error.status
      : error instanceof Error
        ? (error as Error & { status?: number }).status
        : undefined;
  const userMessage = getErrorMessage(error, fallbackMessage);

  return {
    status,
    userMessage,
    fieldErrors,
    isBadRequest: status === 400,
    isConflict: status === 409,
    isServerError: typeof status === "number" ? status >= 500 : false,
  };
}
