type Props = {
  label: string;
  value: number;
  status: string;
  interpretation?: string;
  action?: string;
  trend?: {
  status: string;
  message: string;
};
  benchmarks?: {
    healthy: number;
    warning: number;
    danger: number;
  };
};

export default function MetricHealthCard({
  label,
  value,
  status,
  interpretation,
  action,
  trend,
  benchmarks,
}: Props) {
  const statusColor =
    status === "healthy"
      ? "border-green-500"
      : status === "warning"
      ? "border-yellow-500"
      : status === "danger"
      ? "border-red-500"
      : "border-blue-500";

  const variance =
    benchmarks?.healthy
      ? ((value - benchmarks.healthy) / benchmarks.healthy) * 100
      : null;

  return (
    <div className={`rounded-2xl border ${statusColor} bg-[#071226] p-5`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{label}</h3>

        <span className="text-sm uppercase text-slate-400">{status}</span>
      </div>

      <div className="mt-4 text-4xl font-black text-white">{value}</div>

      {benchmarks && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg bg-slate-900 p-2">
            <p className="text-slate-500">Healthy</p>
            <p className="font-bold text-green-400">{benchmarks.healthy.toFixed(2)}</p>
          </div>

          <div className="rounded-lg bg-slate-900 p-2">
            <p className="text-slate-500">Warning</p>
            <p className="font-bold text-yellow-400">{benchmarks.warning.toFixed(2)}</p>
          </div>

          <div className="rounded-lg bg-slate-900 p-2">
            <p className="text-slate-500">Danger</p>
            <p className="font-bold text-red-400">{benchmarks.danger.toFixed(2)}</p>
          </div>
        </div>
      )}

      {variance !== null && (
        <div className="mt-3 text-xs text-slate-400">
          {variance >= 0 ? "+" : ""}
          {variance.toFixed(1)}% vs account benchmark
        </div>
      )}

      <div className="mt-4 text-sm text-slate-300">{interpretation}</div>
{trend && (
  <div className="mt-3 rounded-xl bg-slate-950/60 p-3">
    <div className="text-xs uppercase text-slate-400">
      Trend
    </div>

    <div className="mt-1 text-sm font-bold text-white">
      {trend.status}
    </div>

    <div className="mt-1 text-xs text-slate-300">
      {trend.message}
    </div>
  </div>
)}
      <div className="mt-3 text-xs text-cyan-400">{action}</div>
    </div>
  );
}