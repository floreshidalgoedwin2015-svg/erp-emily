"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="space-y-5">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-400 mb-1.5"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 text-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-zinc-600"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-400 mb-1.5"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 text-white px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition placeholder:text-zinc-600"
        />
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-400">
          ⚠️ {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Entrando..." : "Entrar no sistema"}
      </button>
    </form>
  );
}
