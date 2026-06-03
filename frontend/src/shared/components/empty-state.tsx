import Link from "next/link";
import { buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6 text-center">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {actionLabel && actionHref ? (
          <div>
            <Link href={actionHref} className={buttonVariants({ size: "lg" })}>
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
