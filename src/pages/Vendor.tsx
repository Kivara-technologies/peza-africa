import { Store } from "lucide-react";

export default function Vendor() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-3 text-primary">
            <Store className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Vendor dashboard</h1>
            <p className="text-sm text-muted-foreground">Manage your products, sales, and supplier profile.</p>
          </div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          ["Products", "Manage your catalog"],
          ["Sales", "Review recent orders"],
          ["Profile", "Keep your vendor details current"],
        ].map(([title, description]) => (
          <article key={title} className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-medium text-foreground">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
