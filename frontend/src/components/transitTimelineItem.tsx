"use client";

import React from "react";

type Props = {
  t: any;
  isForward: boolean;
  formatUserLabel: (u: any) => string;
  formatEntityLabel: (e: any) => string;
  formatDate: (d?: any) => string;
};

export default function TransitTimelineItem({ t, isForward, formatUserLabel, formatEntityLabel, formatDate }: Props) {
  return (
    <div className="relative">
      <div className={`absolute left-0 w-4 h-4 rounded-full ${isForward ? 'bg-purple-500' : 'bg-orange-500'} translate-x-1/2`} />
      <div className={`rounded-md p-3 ${isForward ? 'bg-white/5 border border-dashed border-purple-600' : 'bg-white/3 border border-white/8'}`}>
        {isForward ? (
          <>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                <path d="M3 12h14M13 5l7 7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-white font-medium">Forwarded</div>
            </div>
            <div className="text-xs text-orange-50/80">From: {t.previousStatus ?? formatEntityLabel(t.fromSpaceId ?? t.fromWarehouseId)}</div>
            <div className="text-xs text-orange-50/80">To: {t.newStatus ?? formatEntityLabel(t.toSpaceId ?? t.toWarehouseId)}</div>
            <div className="text-xs text-orange-50/80">By: {formatUserLabel(t.performedBy ?? t.forwardedBy)}</div>
            <div className="text-xs text-orange-50/80">At: {formatDate(t.transactionDate)}</div>
            {t.remarks && <div className="text-xs text-orange-50/80">Notes: {t.remarks}</div>}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-400">
                <path d="M20 12H4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 6l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-white font-medium">{t.transactionType ?? 'Transaction'}</div>
            </div>
            <div className="text-xs text-orange-50/80">Performed by: {formatUserLabel(t.performedBy)}</div>
            <div className="text-xs text-orange-50/80">Date: {formatDate(t.transactionDate)}</div>
            <div className="text-xs text-orange-50/80">Status: {t.previousStatus} → {t.newStatus}</div>
            {t.remarks && <div className="text-xs text-orange-50/80">Remarks: {t.remarks}</div>}
            {t.fromWarehouseId && <div className="text-xs text-orange-50/80">From: {formatEntityLabel(t.fromWarehouseId)}</div>}
            {t.toWarehouseId && <div className="text-xs text-orange-50/80">To: {formatEntityLabel(t.toWarehouseId)}</div>}
            {t.fromUserId && <div className="text-xs text-orange-50/80">From user: {formatUserLabel(t.fromUserId)}</div>}
            {t.toUserId && <div className="text-xs text-orange-50/80">To user: {formatUserLabel(t.toUserId)}</div>}
          </>
        )}
      </div>
    </div>
  );
}
