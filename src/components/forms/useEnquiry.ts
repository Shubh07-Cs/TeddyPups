"use client";

import { useActionState, useEffect, useRef, useTransition, type FormEvent } from "react";
import { sendEnquiry, type EnquiryState } from "@/app/actions";

/** Wires a form to the sendEnquiry server action (with a pending flag, optional reset on success). */
export function useEnquiry(resetOnSuccess = false) {
  const [state, dispatch, actionPending] = useActionState<EnquiryState, FormData>(sendEnquiry, { ok: false });
  const [transitionPending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state.ok) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return {
    state,
    pending: actionPending || transitionPending,
    ref,
    onSubmit: (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data = new FormData(e.currentTarget);
      start(() => dispatch(data));
    },
  };
}
