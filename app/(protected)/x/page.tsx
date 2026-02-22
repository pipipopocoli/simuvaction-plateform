export default function XTrackerPage() {
  return (
    <div className="space-y-6">
      <section className="card-panel rounded-lg p-6">
        <h1 className="text-2xl font-semibold">X Tracker</h1>
        <p className="mt-1 text-sm text-zinc-600">Coming soon. This section is reserved for X posting operations.</p>
      </section>

      <section className="card-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold">Implementation Checklist</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-700">
          <li>Capture official account handle and profile metadata.</li>
          <li>Store and validate post links for traceability.</li>
          <li>Track minimum cadence target: 2 posts per week.</li>
        </ul>
      </section>
    </div>
  );
}
