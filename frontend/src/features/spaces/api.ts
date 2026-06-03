import { apiClient } from "@/src/services/http/client";

export type SpaceListItem = {
  _id?: string;
  id?: string;
  name: string;
  type?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
};

export type JoinRequestInput = {
  message?: string;
};

export type SpaceCreateInput = {
  name: string;
  type: "EMPLOYEE" | "MERCHANT";
  code?: string;
  description?: string;
  isActive?: boolean;
};

function unwrapItems(payload: unknown) {
  const root = payload && typeof payload === "object" && "data" in payload ? (payload as { data?: unknown }).data : payload;
  const items = root && typeof root === "object" && "items" in root ? (root as { items?: unknown }).items : root;

  return Array.isArray(items) ? (items as SpaceListItem[]) : [];
}

export async function getSpaces() {
  const response = await apiClient.get("/spaces");
  return unwrapItems(response.data);
}

export async function getMySpaces() {
  const response = await apiClient.get("/spaces/mine");
  return unwrapItems(response.data);
}

export async function getSpaceById(spaceId: string) {
  const response = await apiClient.get(`/spaces/${spaceId}`);
  return response.data?.data ?? response.data;
}

export async function createSpace(payload: SpaceCreateInput) {
  const response = await apiClient.post("/spaces", payload);
  return response.data?.data ?? response.data;
}

export async function createJoinRequest(spaceId: string, payload: JoinRequestInput = {}) {
  const response = await apiClient.post(`/spaces/${spaceId}/join-requests`, payload);
  return response.data?.data ?? response.data;
}

export async function updateSpace(spaceId: string, payload: Partial<SpaceCreateInput>) {
  const response = await apiClient.patch(`/spaces/${spaceId}`, payload);
  return response.data?.data ?? response.data;
}

export async function deleteSpace(spaceId: string) {
  const response = await apiClient.delete(`/spaces/${spaceId}`);
  return response.data?.data ?? response.data;
}

export async function listJoinRequests(spaceId: string) {
  const response = await apiClient.get(`/spaces/${spaceId}/join-requests`);
  return response.data?.data?.items ?? response.data?.data ?? [];
}

export async function reviewJoinRequest(spaceId: string, requestId: string, action: "approve" | "reject") {
  // backend expects uppercase action values like "APPROVE" / "REJECT"
  const response = await apiClient.patch(
    `/spaces/${spaceId}/join-requests/${requestId}/review`,
    { action: String(action).toUpperCase() },
  );
  return response.data?.data ?? response.data;
}

export async function getMyJoinRequests(spaceId: string) {
  const response = await apiClient.get(`/spaces/${spaceId}/join-requests/my`);
  return response.data?.data?.items ?? response.data?.data ?? [];
}
