import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";

export function FeaturePlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-slate-600">This module is scaffolded for future product work and permissions-aware expansion.</CardContent>
    </Card>
  );
}