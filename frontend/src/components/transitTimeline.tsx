"use client";

import React from "react";
import TransitTimelineItem from "./transitTimelineItem";

type Props = {
  transactions: any[];
  formatUserLabel: (u: any) => string;
  formatEntityLabel: (e: any) => string;
  formatDate: (d?: any) => string;
};

export default function TransitTimeline({ transactions, formatUserLabel, formatEntityLabel, formatDate }: Props) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return <div className="text-sm text-orange-100">No transit activity found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative pl-6">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
        {transactions.map((t, idx) => (
          <TransitTimelineItem
            key={t._id ?? t.id ?? `txn-${idx}`}
            t={t}
            isForward={t.transactionType === "FORWARDED"}
            formatUserLabel={formatUserLabel}
            formatEntityLabel={formatEntityLabel}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  );
}
