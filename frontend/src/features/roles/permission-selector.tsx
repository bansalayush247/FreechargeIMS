"use client";

import { ROLE_PERMISSION_GROUPS } from "@/src/features/roles/permissions";

export function PermissionSelector({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (permissions: string[]) => void;
  disabled?: boolean;
}) {
  const selected = new Set(value);

  const toggle = (permission: string) => {
    onChange(selected.has(permission) ? value.filter((item) => item !== permission) : [...value, permission]);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {ROLE_PERMISSION_GROUPS.map((group) => (
        <fieldset key={group.label} className="rounded-2xl border border-orange-100 bg-white p-4" disabled={disabled}>
          <legend className="px-1 text-sm font-semibold text-slate-900">{group.label}</legend>
          <div className="mt-2 space-y-2">
            {group.permissions.map((permission) => (
              <label key={permission} className="flex cursor-pointer items-center gap-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={selected.has(permission)}
                  onChange={() => toggle(permission)}
                  className="h-4 w-4 accent-orange-500"
                />
                <span>{permission}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
