
const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is missing. Check Vercel Environment Variables."
  );
}

// Common API request handler
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.message || data.error || `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};

// Authentication APIs
export const authAPI = {
  register: async (data) => {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Save token if registration returns one
    if (response.token) {
      localStorage.setItem("token", response.token);
    }

    return response;
  },

  login: async (data) => {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });

    // Save JWT token after successful login
    if (response.token) {
      localStorage.setItem("token", response.token);
    } else {
      throw new Error("Login successful, but authentication token was not received.");
    }

    return response;
  },

  me: () => apiRequest("/auth/me"),

  getProfile: () => apiRequest("/auth/me"),

  logout: () => {
    localStorage.removeItem("token");
  },
};

// Account APIs
export const accountAPI = {
  getAll: () => apiRequest("/accounts"),

  getAccounts: () => apiRequest("/accounts"),

  getById: (id) => apiRequest(`/accounts/${id}`),

  create: (data = {}) =>
    apiRequest("/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// Transaction APIs
export const transactionAPI = {
  deposit: (data) =>
    apiRequest("/transactions/deposit", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  withdraw: (data) =>
    apiRequest("/transactions/withdraw", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  transfer: (data) =>
    apiRequest("/transactions/transfer", {
      method: "POST",
      body: JSON.stringify({
        fromAccountId: data.fromAccountId,
        receiverAccountNumber: data.receiverAccountNumber,
        amount: data.amount,
        description: data.description || "",
      }),
    }),

  getAll: () => apiRequest("/transactions"),

  getHistory: () => apiRequest("/transactions"),

  getById: (id) => apiRequest(`/transactions/${id}`),
};

// Audit APIs
export const auditAPI = {
  getAll: () => apiRequest("/audit"),

  getLogs: () => apiRequest("/audit"),

  getById: (id) => apiRequest(`/audit/${id}`),
};

// Admin APIs
export const adminAPI = {
  getStats: () => apiRequest("/admin/stats"),

  getUsers: () => apiRequest("/admin/users"),

  getAccounts: () => apiRequest("/admin/accounts"),

  getTransactions: () => apiRequest("/admin/transactions"),

  getAuditLogs: () => apiRequest("/admin/audit"),
};

// Default export for compatibility
const api = {
  request: apiRequest,
  auth: authAPI,
  accounts: accountAPI,
  transactions: transactionAPI,
  audit: auditAPI,
  admin: adminAPI,
};

export default api;
