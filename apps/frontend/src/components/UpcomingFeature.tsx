/**
 * Labelled placeholder for routes whose feature belongs to a later phase. It
 * shows no fake data; it states what is coming so the layout shell can be tested.
 */
export function UpcomingFeaturePage({ title, phase }: { title: string; phase: number }) {
  return (
    <section>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <div className="mt-6 rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
        <p className="text-sm text-slate-500">This section is being built (phase {phase}).</p>
      </div>
    </section>
  );
}
