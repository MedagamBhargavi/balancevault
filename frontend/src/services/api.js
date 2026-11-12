
const API_BASE_URL = "http://localhost:5000/api";

// Common API request function
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("balancevault_token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong.");
  }

  return data;
}

// Authentication APIs
export const authAPI = {
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    }),

  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),

  getProfile: () => apiRequest("/auth/me")
};

// Account APIs
export const accountAPI = {
  getAccounts: () => apiRequest("/accounts"),

  getAccount: (id) => apiRequest(`/accounts/${id}`),

  createAccount: () =>
    apiRequest("/accounts", {
      method: "POST",
      body: JSON.stringify({})
    })
};

// Transaction APIs
export const transactionAPI = {
  deposit: (data) =>
    apiRequest("/transactions/deposit", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  withdraw: (data) =>
    apiRequest("/transactions/withdraw", {
      method: "POST",
      body: JSON.stringify(data)
    }),

  // Transfer using receiver account number
  transfer: (data) =>
    apiRequest("/transactions/transfer", {
      method: "POST",
      body: JSON.stringify({
        fromAccountId: data.fromAccountId,
        receiverAccountNumber: data.receiverAccountNumber,
        amount: data.amount,
        description: data.description || ""
      })
    }),

  getHistory: (page = 1, limit = 10) =>
    apiRequest(`/transactions?page=${page}&limit=${limit}`)
};

// Audit APIs
export const auditAPI = {
  getLogs: (page = 1, limit = 10) =>
    apiRequest(`/audit?page=${page}&limit=${limit}`)
};

// Admin APIs
export const adminAPI = {
  getStats: () => apiRequest("/admin/stats"),

  getUsers: (page = 1, limit = 10) =>
    apiRequest(`/admin/users?page=${page}&limit=${limit}`),

  getAccounts: (page = 1, limit = 10) =>
    apiRequest(`/admin/accounts?page=${page}&limit=${limit}`),

  getTransactions: (page = 1, limit = 10) =>
    apiRequest(`/admin/transactions?page=${page}&limit=${limit}`),

  getAuditLogs: (page = 1, limit = 10) =>
    apiRequest(`/admin/audit?page=${page}&limit=${limit}`)
};
