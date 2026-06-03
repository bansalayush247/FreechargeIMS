import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { PageHeader } from "@/src/components/layout/page-header";

type FeaturePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights?: Array<{ title: string; description: string }>;
};

export function FeaturePage({ eyebrow, title, description, highlights = [] }: FeaturePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-slate-600">
              This section is wired for the new business-first frontend architecture.
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
