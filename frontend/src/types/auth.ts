import type { Permission } from "@/src/constants/permissions";

export type AuthRole = "ADMIN" | "MANAGER" | "WAREHOUSE" | "USER" | string;

export type AuthUser = {
  id?: string;
  _id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: AuthRole;
  permissions?: Permission[];
  permissionsBySpace?: Record<string, Permission[]>;
  rolesBySpace?: Record<string, unknown[]>;
  memberships?: unknown[];
  isGlobalSuperAdmin?: boolean;
  userType?: string;
  employeeId?: string;
  [key: string]: unknown;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string | null;
  user: AuthUser | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  employeeId: string;
  userType: string;
};
