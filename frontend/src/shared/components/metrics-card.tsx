import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function MetricsCard({
  label,
  value,
  description,
  tone = "default",
}: {
  label: string;
  value: string;
  description?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneStyles = {
    default: "text-slate-900",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-rose-600",
  };

  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={`text-3xl ${toneStyles[tone]}`}>{value}</CardTitle>
      </CardHeader>
      {description ? <CardContent className="pt-0 text-sm text-slate-600">{description}</CardContent> : null}
    </Card>
  );
}
