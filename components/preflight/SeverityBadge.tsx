export function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: "bg-red-100 text-red-700 border border-red-200",
    warning: "bg-amber-100 text-amber-700 border border-amber-200",
    passed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  };
  const labels: Record<string, string> = {
    critical: "Critical",
    warning: "Warning",
    passed: "Passed",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[severity] ?? ""}`}>
      {labels[severity] ?? severity}
    </span>
  );
}
