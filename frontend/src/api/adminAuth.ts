import { adminClient } from "./adminClient";
import type { AuthResponse } from "../types";

export const adminAuthApi = {
  login: (username: string, password: string) =>
    adminClient.post<AuthResponse>("/auth/login", { username, password }, ""),
  me: (token: string) => adminClient.get<{id:string;username:string;role:string;recoveryEmail:string|null}>("/auth/me", token),
  requestPasswordReset: (email: string) => adminClient.post<{message:string}>("/auth/forgot-password", { email }, ""),
  resetPassword: (token: string, password: string) => adminClient.post<{message:string}>("/auth/reset-password", { token, password }, ""),
  updateRecoveryEmail: (token: string, email: string) => adminClient.patch<{id:string;username:string;role:string;recoveryEmail:string}>("/auth/recovery-email", { email }, token),
  changePassword: (token: string, data: { currentPassword: string; newPassword: string }) =>
    adminClient.patch<{ message: string }>("/auth/password", data, token),
};
