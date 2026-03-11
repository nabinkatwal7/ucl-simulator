export function MetricStrip({ items }: { items: Array<{ label: string; value: string; hint?: string }> }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="metric-card min-h-[150px]">
          <div className="panel-title">{item.label}</div>
          <div className="mt-4 text-3xl font-black tracking-tight text-ucl-heading">{item.value}</div>
          {item.hint ? <div className="mt-3 max-w-[20rem] text-sm leading-6 text-ucl-silver">{item.hint}</div> : null}
        </div>
      ))}
    </div>
  );
}
