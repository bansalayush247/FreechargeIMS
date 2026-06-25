"use client";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { PageHeader } from "@/src/components/layout/page-header";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { useCurrentSpace } from "@/src/hooks/useCurrentSpace";
import { sendNotification } from "@/src/lib/notificationClient";
export default function SendNotificationPage() {
  const { activeSpaceId } = useCurrentSpace();
  const [recipientEmail, setRecipientEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const send = useMutation({ mutationFn: () => sendNotification({ recipientEmail, subject, body }, activeSpaceId ?? undefined) });
  return <div className="space-y-3"><PageHeader eyebrow="Notifications" title="Send notification" description="Manual notification delivery." />
    <Input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="recipient@company.com" />
    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
    <Input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" />
    <div className="flex gap-2"><Button onClick={() => send.mutate()} disabled={!activeSpaceId || send.isPending}>{send.isPending ? "Sending..." : "Send"}</Button></div>
  </div>;
}
