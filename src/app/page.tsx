export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center gap-4 p-8">
      <h1 className="text-3xl font-semibold tracking-tight">Proquiymsa — ODT</h1>
      <p className="text-slate-600">
        Socle technique initialisé. Authentification, rôles, audit et
        références externes prêts à être étendus.
      </p>
      <ul className="list-disc pl-6 text-sm text-slate-600">
        <li>Next 15 + TypeScript strict</li>
        <li>Prisma 6 + PostgreSQL 16</li>
        <li>Auth.js v5 (NextAuth)</li>
        <li>Tailwind CSS</li>
      </ul>
    </main>
  );
}
