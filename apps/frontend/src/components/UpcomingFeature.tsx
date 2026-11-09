/**
 * Labelled placeholder for routes whose feature belongs to a later phase. It
 * shows no fake data; it states what is coming so the layout shell can be tested.
 */
export function UpcomingFeature({ title, phase }: { title: string; phase: number }) {
  return (
    <section>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      <div className="mt-6 rounded-3xl border border-dashed border-line-strong p-10 text-center">
        <p className="text-sm text-fg-subtle">This section is being built (phase {phase}).</p>
      </div>
    </section>
  );
}
