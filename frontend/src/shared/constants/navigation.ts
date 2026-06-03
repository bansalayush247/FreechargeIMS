import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  Bell,
  Boxes,
  ClipboardList,
  History,
  LayoutDashboard,
  Package,
  PackageOpen,
  RotateCcw,
  Settings,
  Shield,
  Store,
  UserCheck,
  UserRoundSearch,
  Warehouse,
  Workflow,
  Layers3,
  FileClock,
} from "lucide-react";
import { routePaths } from "@/src/constants/routes";
import { BACKEND_PERMISSIONS, hasAnyPermission } from "@/src/lib/authorization";
import type { AuthUser } from "@/src/types/auth";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  permissions?: string[];
};

export type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

function canSeeItem(user: AuthUser | null | undefined, item: NavigationItem, activeSpaceId?: string | null) {
  if (item.permissions?.length) {
    return hasAnyPermission(user, item.permissions, activeSpaceId);
  }

  return true;
}

const sections: NavigationSection[] = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: routePaths.dashboard.home, icon: LayoutDashboard }],
  },
  {
    label: "Requests",
    items: [
      { label: "Create Request", href: routePaths.dashboard.createRequest, icon: ClipboardList, permissions: [BACKEND_PERMISSIONS.CREATE_ASSET_REQUEST] },
      { label: "My Requests", href: routePaths.dashboard.myRequests, icon: ClipboardList, permissions: [BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST] },
      { label: "Employee Requests", href: routePaths.dashboard.employeeRequests, icon: UserCheck, permissions: [BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST] },
      { label: "Merchant Requests", href: routePaths.dashboard.merchantRequests, icon: Store, permissions: [BACKEND_PERMISSIONS.VIEW_ASSET_REQUEST] },
      { label: "Pending Approvals", href: routePaths.dashboard.pendingApprovals, icon: UserRoundSearch, permissions: [BACKEND_PERMISSIONS.APPROVE_ASSET_REQUEST] },
      { label: "Fulfillment Queue", href: routePaths.dashboard.fulfillmentQueue, icon: PackageOpen, permissions: [BACKEND_PERMISSIONS.FULFILL_ASSET_REQUEST] },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Assets", href: routePaths.dashboard.assets, icon: Boxes, permissions: [BACKEND_PERMISSIONS.VIEW_INVENTORY] },
      { label: "Transfers", href: routePaths.dashboard.transfers, icon: ArrowRightLeft, permissions: [BACKEND_PERMISSIONS.VIEW_INVENTORY_TRANSACTION] },
      { label: "Returns", href: routePaths.dashboard.returns, icon: RotateCcw, permissions: [BACKEND_PERMISSIONS.VIEW_INVENTORY_TRANSACTION] },
      { label: "History", href: routePaths.dashboard.history, icon: History, permissions: [BACKEND_PERMISSIONS.VIEW_INVENTORY_TRANSACTION] },
    ],
  },
  {
    label: "Catalog",
    items: [
      { label: "Products", href: routePaths.dashboard.products, icon: Package, permissions: [BACKEND_PERMISSIONS.VIEW_PRODUCT] },
      { label: "Merchants", href: routePaths.dashboard.merchants, icon: Store, permissions: [BACKEND_PERMISSIONS.VIEW_MERCHANT] },
      { label: "Warehouses", href: routePaths.dashboard.warehouses, icon: Warehouse, permissions: [BACKEND_PERMISSIONS.VIEW_INVENTORY] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Roles", href: routePaths.dashboard.roles, icon: Shield, permissions: [BACKEND_PERMISSIONS.VIEW_ROLE] },
      { label: "Members", href: routePaths.dashboard.members, icon: UserCheck, permissions: [BACKEND_PERMISSIONS.MEMBER_VIEW, BACKEND_PERMISSIONS.VIEW_SPACE] },
      { label: "Join Requests", href: routePaths.dashboard.joinRequests, icon: UserRoundSearch, permissions: [BACKEND_PERMISSIONS.MEMBER_UPDATE, BACKEND_PERMISSIONS.UPDATE_SPACE] },
      { label: "Workflows", href: routePaths.dashboard.workflows, icon: Workflow, permissions: [BACKEND_PERMISSIONS.VIEW_WORKFLOW] },
      { label: "Settings", href: routePaths.dashboard.settings, icon: Settings, permissions: [BACKEND_PERMISSIONS.UPDATE_SPACE] },
      { label: "Audit Logs", href: routePaths.dashboard.auditLogs, icon: FileClock, permissions: [BACKEND_PERMISSIONS.VIEW_AUDIT_LOGS] },
    ],
  },
  {
    label: "Workspace",
    items: [
      { label: "Spaces", href: routePaths.dashboard.spaces, icon: Layers3 },
      { label: "Notifications", href: routePaths.dashboard.notifications, icon: Bell, permissions: [BACKEND_PERMISSIONS.VIEW_NOTIFICATION] },
      { label: "My Assets", href: routePaths.dashboard.myAssets, icon: Boxes, permissions: [BACKEND_PERMISSIONS.VIEW_ASSET_REGISTRY] },
    ],
  },
];

export function getVisibleNavigationSections(user: AuthUser | null | undefined, activeSpaceId?: string | null) {
  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canSeeItem(user, item, activeSpaceId)),
    }))
    .filter((section) => section.items.length > 0);
}
