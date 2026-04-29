import { baseService } from "./baseservice";

interface LoginPayload {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    role: string;
    mobile: string;
  };
}

export const authService = {
  login: async (data: LoginPayload): Promise<LoginResponse> => {
    const res = await baseService.post<LoginResponse>("/Auth/login", data);

    // ✅ store token + user (IMPORTANT)
    if (res.success && res.token) {
      localStorage.setItem("token", res.token);
      localStorage.setItem("user", JSON.stringify(res.user));
    }

    return res;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};