export function ScoreRing({ score, label }: { score: number; label: string }) {
  const color =
    score >= 90 ? "#10b981" : score >= 70 ? "#f59e0b" : score >= 40 ? "#f97316" : "#ef4444";
  const r = 44;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 55 55)"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
        <text x="55" y="50" textAnchor="middle" fontSize="22" fontWeight="700" fill="#0f172a">
          {score}
        </text>
        <text x="55" y="68" textAnchor="middle" fontSize="10" fill="#64748b">
          / 100
        </text>
      </svg>
      <span className="text-sm font-semibold" style={{ color }}>
        {label}
      </span>
      <span className="text-xs text-slate-500">Configuration Readiness</span>
    </div>
  );
}
