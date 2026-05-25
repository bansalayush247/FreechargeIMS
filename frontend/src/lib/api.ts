import axios from "axios";
import { apiBaseUrl } from "./env";

export const apiClient = axios.create({
  baseURL: `${apiBaseUrl.replace(/\/$/, "")}/api/v1`,
});

export function setApiToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
}
