"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { createJoinRequest, createSpace, getMyJoinRequests } from "@/src/features/spaces/api";
import { getApiErrorMessage } from "@/src/services/http/client";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useSpaceSelection } from "@/src/features/spaces/hooks/use-space-selection";
import { useSpaces } from "@/src/features/spaces";
import { PageHeader } from "@/src/components/layout/page-header";
import { Badge } from "@/src/components/ui/badge";
import { Select } from "@/src/components/ui/select";

const spaceTypeOptions = [
  { label: "Employee", value: "EMPLOYEE" },
  { label: "Merchant", value: "MERCHANT" },
];

function getSpaceId(space: { id?: string; _id?: string }) {
  return space.id || space._id || "";
}

export default function SpacesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: spaces = [], isLoading, isError } = useSpaces();
  const { data: mySpaces = [], isLoading: mySpacesLoading } = useMySpaces();
  const { activeSpaceId, setActiveSpaceId } = useSpaceSelection(mySpaces);
  const [name, setName] = useState("");
  const [type, setType] = useState<"EMPLOYEE" | "MERCHANT">("EMPLOYEE");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [requestingSpaceId, setRequestingSpaceId] = useState<string | null>(null);
  const [localPendingSpaceIds, setLocalPendingSpaceIds] = useState<Set<string>>(new Set());
  const membershipKnown = !mySpacesLoading;

  const mySpaceIds = useMemo(() => new Set(mySpaces.map((space) => getSpaceId(space))), [mySpaces]);
  const discoverSpaces = useMemo(
    () => spaces.filter((space) => {
      if (!membershipKnown) {
        return false;
      }

      const spaceId = getSpaceId(space);
      return Boolean(spaceId) && !mySpaceIds.has(spaceId);
    }),
    [membershipKnown, mySpaceIds, spaces],
  );
  const discoverableSpaceIds = useMemo(
    () => discoverSpaces.map((space) => getSpaceId(space)),
    [discoverSpaces],
  );

  const pendingQueries = useQueries({
    queries: discoverableSpaceIds.map((spaceId) => ({
      queryKey: ["spaces", "my-join-requests", spaceId],
      queryFn: () => getMyJoinRequests(spaceId),
      enabled: Boolean(spaceId),
      staleTime: 30_000,
    })),
  });

  const pendingSpaceIds = useMemo(() => {
    const ids = new Set(localPendingSpaceIds);

    pendingQueries.forEach((query, index) => {
      const spaceId = discoverableSpaceIds[index];
      const items = (query.data ?? []) as Array<{ status?: string }>;
      const hasPending = items.some((item) => String(item.status || "").toUpperCase() === "PENDING");

      if (spaceId && hasPending) {
        ids.add(spaceId);
      }
    });

    return ids;
  }, [discoverableSpaceIds, localPendingSpaceIds, pendingQueries]);

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async (createdSpace: { id?: string; _id?: string }) => {
      setName("");
      setType("EMPLOYEE");
      setCode("");
      setDescription("");
      const createdSpaceId = createdSpace.id || createdSpace._id;

      if (createdSpaceId) {
        setActiveSpaceId(createdSpaceId);
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces"] }),
        queryClient.invalidateQueries({ queryKey: ["spaces", "my"] }),
      ]);
    },
  });

  const joinSpaceMutation = useMutation({
    mutationFn: async (spaceId: string) => createJoinRequest(spaceId, { message: "Requesting access from the frontend." }),
    onSuccess: async (_data, spaceId) => {
      setLocalPendingSpaceIds((prev) => new Set(prev).add(spaceId));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["spaces", "my"] }),
        queryClient.invalidateQueries({ queryKey: ["spaces", "my-join-requests", spaceId] }),
      ]);
    },
  });

  const joinedSpaces = mySpaces;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Spaces"
        title="Workspace spaces"
        description="Spaces are the top-level operational partition for inventory, requests, and members."
        actions={
          <Link href="#create-space" className={buttonVariants({ variant: "outline" })}>
            Create space
          </Link>
        }
      />

      <Card id="create-space">
        <CardHeader>
          <CardTitle>Create a new space</CardTitle>
          <CardDescription>Create the workspace partition first, then add products, warehouses, and members.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="space-name">Name</Label>
            <Input id="space-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="North Warehouse" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-type">Type</Label>
            <Select id="space-type" value={type} onChange={(event) => setType(event.target.value as "EMPLOYEE" | "MERCHANT") }>
              {spaceTypeOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-white">
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-code">Code</Label>
            <Input
              id="space-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="NORTH_WAREHOUSE"
            />
            <p className="text-xs text-slate-500">Optional internal code used for identification and routing.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-description">Description</Label>
            <Input id="space-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" />
          </div>
          <div className="md:col-span-3">
            <Button
              onClick={() => createSpaceMutation.mutate({ name, type, code: code || undefined, description: description || undefined })}
              disabled={!name.trim() || createSpaceMutation.isPending}
            >
              {createSpaceMutation.isPending ? "Creating..." : "Create space"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">My spaces</h2>
          <p className="text-sm text-slate-600">Spaces you have already joined and can use right away.</p>
        </div>

        {mySpacesLoading ? (
          <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">Loading your spaces...</div>
        ) : joinedSpaces.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {joinedSpaces.map((space) => {
              const spaceId = getSpaceId(space);
              const isCurrent = activeSpaceId === spaceId;

              return (
                <Card key={spaceId}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>{space.name}</CardTitle>
                        <CardDescription>{space.type || space.code || "Space"}</CardDescription>
                      </div>
                      <Badge variant={isCurrent ? "warning" : "secondary"}>{isCurrent ? "Current" : "Joined"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{space.description || "Joined space"}</p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setActiveSpaceId(spaceId);
                        router.push(`/spaces/${spaceId}`);
                      }}
                    >
                      Use space
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">You have not joined any spaces yet.</div>
        )}
      </section>

      {!membershipKnown && !isLoading ? (
        <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">
          Checking your space membership...
        </div>
      ) : isLoading ? (
        <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">
          Loading spaces...
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">
          Spaces could not be loaded right now.
        </div>
      ) : discoverSpaces.length ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Discover spaces</h2>
            <p className="text-sm text-slate-600">Request access for spaces you have not joined yet.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {discoverSpaces.map((space) => {
            const spaceId = getSpaceId(space);
            const joined = mySpaceIds.has(spaceId);
            const pendingJoin = pendingSpaceIds.has(spaceId);
            const showJoinAction = membershipKnown && !joined;

            return (
              <Card key={spaceId}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-brand">{space.type || space.code}</p>
                      <CardTitle className="mt-3">{space.name}</CardTitle>
                    </div>
                    <Badge variant={joined ? "success" : pendingJoin ? "warning" : "secondary"}>
                      {joined ? "Joined" : pendingJoin ? "Pending" : "Open"}
                    </Badge>
                  </div>
                  <CardDescription>{space.description || "Open a detail view for the selected operational space."}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Link href={`/spaces/${spaceId}`} className={buttonVariants({ variant: "outline" })}>
                    Open space
                  </Link>
                  {showJoinAction ? (
                    <Button
                      onClick={async () => {
                        setRequestingSpaceId(spaceId);
                        try {
                          await joinSpaceMutation.mutateAsync(spaceId);
                        } catch (error) {
                          const message = getApiErrorMessage(error);
                          if (message.toLowerCase().includes("already pending")) {
                            setLocalPendingSpaceIds((prev) => new Set(prev).add(spaceId));
                          }
                        } finally {
                          setRequestingSpaceId(null);
                        }
                      }}
                      disabled={requestingSpaceId === spaceId || pendingJoin || !membershipKnown}
                    >
                      {pendingJoin ? "Pending" : requestingSpaceId === spaceId ? "Requesting..." : "Request to join"}
                    </Button>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
          </div>
        </section>
      ) : (
        <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">
          No spaces are available yet.
        </div>
      )}
    </div>
  );
}
