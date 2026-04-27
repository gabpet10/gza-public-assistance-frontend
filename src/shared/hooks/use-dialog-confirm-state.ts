"use client";

import { useCallback, useState } from "react";
import { getErrorMessage } from "@/core/api/errors";

export function useDialogState(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return { isOpen, setIsOpen, open, close };
}

export function useConfirmActionState() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const open = useCallback(() => {
    setErrorMessage(null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setErrorMessage(null);
  }, []);

  const run = useCallback(
    async (action: () => Promise<void>, fallbackMessage: string) => {
      setErrorMessage(null);
      setIsSubmitting(true);

      try {
        await action();
        setIsOpen(false);
      } catch (error) {
        setErrorMessage(getErrorMessage(error, fallbackMessage));
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  return {
    isOpen,
    isSubmitting,
    errorMessage,
    setErrorMessage,
    open,
    close,
    run,
  };
}
