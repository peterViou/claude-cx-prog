'use client';

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-3 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Une erreur est survenue</h1>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
      >
        Réessayer
      </button>
    </main>
  );
}
