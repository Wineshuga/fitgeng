/**
 * Labelled placeholder for a section whose feature ships later. It shows no fake
 * data, only what is coming and when, so layouts, navigation and permissions can
 * be built and tested now.
 */
export function UpcomingFeature({ title, description, availability }: { title: string; description?: string; availability: string }) {
  return (
    <section>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {description && <p className="mt-1 text-fg-muted">{description}</p>}
      <div className="mt-6 rounded-3xl border border-dashed border-line-strong p-10 text-center">
        <p className="text-sm text-fg-subtle">This section is being built ({availability}).</p>
      </div>
    </section>
  );
}
