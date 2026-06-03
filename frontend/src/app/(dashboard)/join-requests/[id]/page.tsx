import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { PageHeader } from "@/src/shared/components/page-header";
import { StatusBadge } from "@/src/shared/components/status-badge";

export default async function JoinRequestDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title={`Join Request ${id}`}
        description="Review a user's request to join a space and decide whether to approve or reject it."
        actions={<StatusBadge status="warning">Pending</StatusBadge>}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Who requested access.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Rohan Verma</p>
            <p>rohan.verma@freechargeims.example</p>
            <p>Requested role: Employee</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requested Space</CardTitle>
            <CardDescription>Access target and reason.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>Space: Engineering</p>
            <p>Reason: New hire onboarding and device provisioning.</p>
            <p>Current status: Pending admin review.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
