"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/src/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { createJoinRequest, createSpace } from "@/src/features/spaces/api";
import { useMySpaces } from "@/src/features/spaces/hooks/use-my-spaces";
import { useSpaceSelection } from "@/src/features/spaces/hooks/use-space-selection";
import { useSpaces } from "@/src/features/spaces";
import { PageHeader } from "@/src/components/layout/page-header";
import { Badge } from "@/src/components/ui/badge";

function getSpaceId(space: { id?: string; _id?: string; code: string }) {
  return space.id || space._id || "";
}

export default function SpacesPage() {
  const queryClient = useQueryClient();
  const { data: spaces = [], isLoading, isError } = useSpaces();
  const { data: mySpaces = [], isLoading: mySpacesLoading } = useMySpaces();
  const { activeSpaceId, setActiveSpaceId } = useSpaceSelection(mySpaces);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");

  const mySpaceIds = useMemo(() => new Set(mySpaces.map((space) => getSpaceId(space))), [mySpaces]);

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async (createdSpace: { id?: string; _id?: string; code?: string }) => {
      setName("");
      setCode("");
      setDescription("");
      const createdSpaceId = createdSpace.id || createdSpace._id || createdSpace.code;

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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["spaces", "my"] });
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
            <Label htmlFor="space-code">Code</Label>
            <Input id="space-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="NW-01" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="space-description">Description</Label>
            <Input id="space-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Optional description" />
          </div>
          <div className="md:col-span-3">
            <Button
              onClick={() => createSpaceMutation.mutate({ name, code: code || undefined, description: description || undefined })}
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
                        <CardDescription>{space.code}</CardDescription>
                      </div>
                      <Badge variant={isCurrent ? "warning" : "secondary"}>{isCurrent ? "Current" : "Joined"}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">{space.description || "Joined space"}</p>
                    <Button variant="outline" onClick={() => setActiveSpaceId(spaceId)}>
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

      {isLoading ? (
        <div className="rounded-3xl border border-orange-100 bg-white p-6 text-sm text-slate-600 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">
          Loading spaces...
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-[0_20px_60px_rgba(255,107,53,0.08)]">
          Spaces could not be loaded right now.
        </div>
      ) : spaces.length ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Discover spaces</h2>
            <p className="text-sm text-slate-600">Request access for spaces you have not joined yet.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
          {spaces.map((space) => {
            const spaceId = getSpaceId(space);
            const joined = mySpaceIds.has(spaceId);

            return (
              <Card key={spaceId}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-brand">{space.code}</p>
                      <CardTitle className="mt-3">{space.name}</CardTitle>
                    </div>
                    <Badge variant={joined ? "success" : "secondary"}>{joined ? "Joined" : "Open"}</Badge>
                  </div>
                  <CardDescription>{space.description || "Open a detail view for the selected operational space."}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  <Link href={`/spaces/${spaceId}`} className={buttonVariants({ variant: "outline" })}>
                    Open space
                  </Link>
                  {!joined ? (
                    <Button
                      onClick={() => joinSpaceMutation.mutate(spaceId)}
                      disabled={joinSpaceMutation.isPending}
                    >
                      {joinSpaceMutation.isPending ? "Requesting..." : "Request to join"}
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
