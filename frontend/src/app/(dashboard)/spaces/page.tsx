"use client";

import Link from "next/link";
import { useMemo, useState, type ReactElement } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Select } from "@/src/components/ui/select";
import { Skeleton } from "@/src/components/ui/skeleton";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { createJoinRequest, createSpace } from "@/src/features/spaces/api";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useSpaceMembership } from "@/src/features/spaces/hooks/use-space-membership";
import { useSpaces } from "@/src/features/spaces/hooks/use-spaces";
import { getApiErrorMessage } from "@/src/services/http/client";
import { useAuthorization } from "@/src/hooks/useAuthorization";
import { BACKEND_PERMISSIONS } from "@/src/lib/authorization";
import { useAuth } from "@/src/features/auth/auth-provider";

function getSpaceId(space: { _id?: string; id?: string }) {
  return space._id || space.id || "";
}

function DiscoverSpaceCard({
  space,
  isPending,
  onRequestJoin,
}: {
  space: { _id?: string; id?: string; name?: string; type?: string; description?: string };
  isPending: boolean;
  onRequestJoin: (spaceId: string) => void;
}) {
  const spaceId = getSpaceId(space);
  const { isJoined, pendingJoin } = useSpaceMembership(spaceId);

  if (isJoined) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">{space.name}</p>
          <p className="text-sm text-slate-600">{space.type || "Space"}</p>
        </div>
        <Button onClick={() => onRequestJoin(spaceId)} disabled={isPending || !spaceId || pendingJoin}>
          {pendingJoin ? "Requested" : isPending ? "Requesting..." : "Request join"}
        </Button>
      </div>
      <p className="mt-3 text-sm text-slate-600">{space.description || "Open a space request flow to request access."}</p>
    </div>
  );
}

export default function SpacesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { activeSpaceId, setActiveSpaceId } = useCurrentSpace();
  const { data: spaces = [], isLoading, isError } = useSpaces();
  const { data: mySpaces = [] } = useMySpaces();
  const [pendingSpaceId, setPendingSpaceId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<"EMPLOYEE" | "MERCHANT">("EMPLOYEE");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const authz = useAuthorization();
  const canCreateSpace = authz.can(BACKEND_PERMISSIONS.CREATE_SPACE);
  const isGlobalSuperAdmin = Boolean(user?.isGlobalSuperAdmin);

  const mySpaceIds = useMemo(() => new Set(mySpaces.map((space: { _id?: string; id?: string }) => getSpaceId(space))), [mySpaces]);
  const discoverSpaces = useMemo(() => spaces.filter((space: { _id?: string; id?: string }) => !mySpaceIds.has(getSpaceId(space))), [spaces, mySpaceIds]);

  const createMutation = useMutation({
    mutationFn: () => createSpace({ name, type, code: code || undefined, description: description || undefined }),
    onSuccess: async (createdSpace: { _id?: string; id?: string }) => {
      const nextSpaceId = getSpaceId(createdSpace);
      setName("");
      setType("EMPLOYEE");
      setCode("");
      setDescription("");
      if (nextSpaceId) setActiveSpaceId(nextSpaceId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces"] }),
        queryClient.invalidateQueries({ queryKey: ["spaces", "my"] }),
      ]);
      setActionMessage("Space created.");
    },
    onError: (error) => setActionMessage(getApiErrorMessage(error)),
  });

  const joinMutation = useMutation({
    mutationFn: (spaceId: string) => createJoinRequest(spaceId, { message: "Requesting access from the frontend." }),
    onMutate: (spaceId) => {
      setPendingSpaceId(spaceId);
    },
    onSuccess: async (_data, spaceId) => {
      setActionMessage("Join request submitted.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces", "my"] }),
        queryClient.invalidateQueries({ queryKey: ["spaces", spaceId] }),
      ]);
    },
    onError: (error) => setActionMessage(getApiErrorMessage(error)),
    onSettled: () => {
      setPendingSpaceId(null);
    },
  });

  const discoverSpaceCards = useMemo(
    () =>
      discoverSpaces
        .map((space: { _id?: string; id?: string; name?: string; type?: string; description?: string }) => (
          <DiscoverSpaceCard
            key={getSpaceId(space)}
            space={space}
            isPending={pendingSpaceId === getSpaceId(space)}
            onRequestJoin={(spaceId) => joinMutation.mutate(spaceId)}
          />
        ))
        .filter((card): card is ReactElement => Boolean(card)),
    [discoverSpaces, pendingSpaceId, joinMutation],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Workspace"
        title="Spaces"
        description={isGlobalSuperAdmin ? "Select and administer any operational space without joining it." : "Browse available spaces, request access to ones you have not joined, or create a new space."}
        actions={actionMessage ? <span className="text-sm text-slate-600">{actionMessage}</span> : undefined}
      />

      {canCreateSpace ? (
      <Card>
        <CardHeader>
          <CardTitle>Create a space</CardTitle>
          <CardDescription>Live backend create action, not a placeholder.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="space-name">Name</Label>
            <Input id="space-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Engineering" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-type">Type</Label>
            <Select id="space-type" value={type} onChange={(event) => setType(event.target.value as "EMPLOYEE" | "MERCHANT") }>
              <option value="EMPLOYEE">Employee</option>
              <option value="MERCHANT">Merchant</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-code">Code</Label>
            <Input id="space-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="ENGINEERING" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-description">Description</Label>
            <Input id="space-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" />
          </div>
          <div className="md:col-span-2">
            <Button onClick={() => createMutation.mutate()} disabled={!name.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create space"}
            </Button>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{isGlobalSuperAdmin ? "All spaces" : "My spaces"}</CardTitle>
            <CardDescription>{isGlobalSuperAdmin ? "Global Super Admin access across employee and merchant spaces." : "Spaces you already belong to."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mySpaces.length ? mySpaces.map((space: { _id?: string; id?: string; name?: string; type?: string; code?: string; description?: string }) => {
              const spaceId = getSpaceId(space);
              const isCurrent = activeSpaceId === spaceId;
              return (
                <div key={spaceId} className="rounded-2xl border border-orange-100 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{space.name}</p>
                      <p className="text-sm text-slate-600">{space.type || space.code || "Space"}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-600">
                      {isCurrent ? "Current" : isGlobalSuperAdmin ? "Available" : "Joined"}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => setActiveSpaceId(spaceId)}>Use space</Button>
                    <Link href={`/spaces/${spaceId}`} className="inline-flex items-center justify-center rounded-2xl border border-orange-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-orange-50">
                      Open details
                    </Link>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No joined spaces yet.</div>
            )}
          </CardContent>
        </Card>

        {!isGlobalSuperAdmin ? <Card>
          <CardHeader>
            <CardTitle>Discover spaces</CardTitle>
            <CardDescription>Request access to spaces you have not joined yet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="grid gap-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
            ) : isError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Spaces could not be loaded right now.</div>
            ) : discoverSpaceCards.length ? discoverSpaceCards : (
              <div className="rounded-2xl border border-orange-100 bg-orange-50/40 p-4 text-sm text-slate-600">No discoverable spaces available.</div>
            )}
          </CardContent>
        </Card> : null}
      </div>
    </div>
  );
}
