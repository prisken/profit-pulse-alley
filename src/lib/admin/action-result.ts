export type AdminActionSuccess<TData = undefined> = {
  ok: true;
  message: string;
  warning?: string;
  data?: TData;
  /** CSV export payload (Market Pulse leaderboard). */
  csv?: string;
  filename?: string;
  /** Market Pulse cycle reveal summary (admin dashboard). */
  revealSummary?: {
    cycleId: string;
    decisionsScored: number;
    usersScored: number;
    eventsCreated: number;
    topScore: number | null;
  };
};

export type AdminActionFailure = {
  ok: false;
  error: string;
  fieldErrors?: Record<string, string[]>;
  data?: unknown;
};

export type AdminActionResult<TData = undefined> =
  | AdminActionSuccess<TData>
  | AdminActionFailure;

export function adminOk<TData = undefined>(
  message: string,
  options?: {
    warning?: string;
    data?: TData;
    csv?: string;
    filename?: string;
  },
): AdminActionResult<TData> {
  return {
    ok: true,
    message,
    ...(options?.warning ? { warning: options.warning } : {}),
    ...(options?.data !== undefined ? { data: options.data } : {}),
    ...(options?.csv ? { csv: options.csv } : {}),
    ...(options?.filename ? { filename: options.filename } : {}),
  };
}

export function adminFail(
  error: string,
  fieldErrors?: Record<string, string[]>,
  data?: unknown,
): AdminActionFailure {
  return {
    ok: false,
    error,
    ...(fieldErrors ? { fieldErrors } : {}),
    ...(data !== undefined ? { data } : {}),
  };
}

export type AdminSideEffect = {
  label: string;
  run: () => void | Promise<void>;
};

/** Runs post-commit side effects; returns a user-facing warning if any fail. */
export async function runAdminSideEffects(
  tasks: AdminSideEffect[],
): Promise<string | undefined> {
  const failed: string[] = [];

  for (const task of tasks) {
    try {
      await task.run();
    } catch (error) {
      console.error(`[admin] side effect failed (${task.label}):`, error);
      failed.push(task.label);
    }
  }

  if (failed.length === 0) {
    return undefined;
  }

  return `Saved, but ${failed.join(" and ")} could not complete. Refresh the page to see the latest data.`;
}

export async function finishAdminMutation<TData = undefined>(
  message: string,
  sideEffects: AdminSideEffect[],
  options?: {
    data?: TData;
    csv?: string;
    filename?: string;
    extraWarning?: string;
    revealSummary?: AdminActionSuccess["revealSummary"];
  },
): Promise<AdminActionResult<TData>> {
  const sideEffectWarning = await runAdminSideEffects(sideEffects);
  const warning = [options?.extraWarning, sideEffectWarning]
    .filter(Boolean)
    .join(" ");

  return {
    ok: true,
    message,
    ...(warning ? { warning } : {}),
    ...(options?.data !== undefined ? { data: options.data } : {}),
    ...(options?.csv ? { csv: options.csv } : {}),
    ...(options?.filename ? { filename: options.filename } : {}),
    ...(options?.revealSummary ? { revealSummary: options.revealSummary } : {}),
  };
}

export function fieldErrorsFromRecord(
  errors: Record<string, string>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [key, [value]]),
  );
}

export function applyAdminActionResult(
  result: AdminActionResult,
  handlers: {
    onSuccess: (message: string, warning?: string) => void;
    onError: (error: string, fieldErrors?: Record<string, string[]>) => void;
  },
): boolean {
  if (!result.ok) {
    handlers.onError(result.error, result.fieldErrors);
    return false;
  }

  handlers.onSuccess(result.message, result.warning);
  return true;
}

export async function invokeAdminAction(
  action: () => Promise<AdminActionResult>,
  handlers: {
    onSuccess: (
      message: string,
      warning?: string,
      success?: AdminActionSuccess,
    ) => void;
    onError: (
      error: string,
      fieldErrors?: Record<string, string[]>,
      data?: unknown,
    ) => void;
    onThrow?: () => void;
  },
): Promise<boolean> {
  try {
    const result = await action();
    if (!result.ok) {
      handlers.onError(result.error, result.fieldErrors, result.data);
      return false;
    }

    handlers.onSuccess(result.message, result.warning, result);
    return true;
  } catch (error) {
    console.error("[admin] client action threw:", error);
    handlers.onThrow?.();
    handlers.onError(
      "Something went wrong. Refresh the page to see if your change was saved.",
    );
    return false;
  }
}

/** @deprecated Use AdminActionResult from this module. */
export type AdminUserActionResult = AdminActionResult;
