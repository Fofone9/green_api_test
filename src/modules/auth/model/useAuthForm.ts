import { useState } from "react";
import type { FormEvent } from "react";
import type { GreenApiCredentials } from "../../../shared/api/green-api/types";
import {
  emptyCredentialErrors,
  normalizeCredentials,
  validateCredentials,
} from "./validateCredentials";

interface AuthFormOptions {
  isLoading: boolean;
  onConnect: (credentials: GreenApiCredentials) => Promise<void>;
  onEdit: () => void;
}

export function useAuthForm({ isLoading, onConnect, onEdit }: AuthFormOptions) {
  const [values, setValues] = useState<GreenApiCredentials>({
    idInstance: "",
    apiTokenInstance: "",
  });
  const [errors, setErrors] = useState(emptyCredentialErrors);

  function updateField(field: keyof GreenApiCredentials, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    onEdit();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading) return;
    const credentials = normalizeCredentials(values);
    const fieldErrors = validateCredentials(credentials);
    setErrors(fieldErrors);
    if (Object.values(fieldErrors).some(Boolean)) {
      const invalidField = fieldErrors.idInstance
        ? "idInstance"
        : "apiTokenInstance";
      const input = event.currentTarget.elements.namedItem(invalidField);
      if (input instanceof HTMLInputElement) input.focus();
      return;
    }
    void onConnect(credentials);
  }

  return { values, errors, updateField, handleSubmit };
}
