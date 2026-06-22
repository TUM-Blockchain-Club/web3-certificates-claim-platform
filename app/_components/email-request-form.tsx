"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";
import { requestClaimLink, type EmailRequestState } from "@/app/actions";

const initialState: EmailRequestState = {
  status: "idle",
  message: "",
};

export function EmailRequestForm() {
  const [state, formAction, isPending] = useActionState(
    requestClaimLink,
    initialState,
  );

  return (
    <form action={formAction} className="stack">
      <div className="field">
        <label htmlFor="email">Email</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
      </div>
      <button className="button" disabled={isPending} type="submit">
        <Send aria-hidden="true" size={18} />
        {isPending ? "Sending" : "Send Link"}
      </button>
      {state.message ? (
        <p
          className={`notice ${state.status === "error" ? "error" : "success"}`}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

