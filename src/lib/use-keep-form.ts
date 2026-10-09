"use client";

import { useTransition, type FormEvent } from "react";

// React 19 resets a <form action={fn}> after every submission — including
// ones that come back with a validation error, which wipes everything the
// customer typed. Submitting through onSubmit instead keeps the fields; the
// server action and its useActionState/pending state work the same.
export function useKeepForm(dispatch: (payload: FormData) => void) {
  const [, startTransition] = useTransition();
  return (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => dispatch(data));
  };
}
