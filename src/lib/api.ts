// API utility functions for communicating with Next.js API routes

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private getHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // For Next.js API routes, we call them directly without base URL
      const url = API_BASE_URL ? `${this.baseURL}${endpoint}` : endpoint;

      const response = await fetch(url, {
        headers: this.getHeaders(),
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Authentication endpoints
  async signUp(userData: {
    user: {
      full_name: string;
      email: string;
      password: string;
      role: string;
    };
    store: {
      store_name: string;
      address: {
        street: string;
        sub_district: string;
        district: string;
        province: string;
        postcode: string;
      };
      phone: string;
      tax_id: string;
    };
  }) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async signIn(credentials: { email: string; password: string }) {
    return this.request('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  // Store endpoints
  async getStores() {
    return this.request('/api/stores');
  }

  async getStore(storeId: string) {
    return this.request(`/api/stores/${storeId}`);
  }

  async updateStore(storeId: string, storeData: any) {
    return this.request(`/api/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(storeData),
    });
  }

  async createStore(storeData: any) {
    return this.request('/api/stores', {
      method: 'POST',
      body: JSON.stringify(storeData),
    });
  }

  async uploadFile(file: File, type: 'logo' | 'stamp' | 'signature') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const response = await fetch(`${this.baseURL}/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  // Customer endpoints
  async getCustomers(storeId: string, search?: string) {
    const params = new URLSearchParams({ storeId });
    if (search) params.append('search', search);
    return this.request(`/api/customers?${params}`);
  }

  async searchCustomer(phone?: string, name?: string, id_number?: string, store_id?: string) {
    const params = new URLSearchParams();
    if (phone) params.append('phone', phone);
    if (name) params.append('name', name);
    if (id_number) params.append('id_number', id_number);
    if (store_id) params.append('store_id', store_id);
    return this.request(`/api/customers/search?${params}`);
  }

  async createCustomer(customerData: any) {
    return this.request('/api/customers', {
      method: 'POST',
      body: JSON.stringify(customerData),
    });
  }

  async getCustomer(customerId: string) {
    return this.request(`/api/customers/${customerId}`);
  }

  async updateCustomer(customerId: string, customerData: any) {
    return this.request(`/api/customers/${customerId}`, {
      method: 'PUT',
      body: JSON.stringify(customerData),
    });
  }

  // Contract endpoints
  async getContracts(storeId: string, status?: string) {
    const params = new URLSearchParams({ storeId });
    if (status) params.append('status', status);
    return this.request(`/api/contracts?${params}`);
  }

  async getContract(contractId: string) {
    return this.request(`/api/contracts/${contractId}`);
  }

  async createContract(contractData: any) {
    return this.request('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(contractData),
    });
  }

  async updateContract(contractId: string, contractData: any) {
    return this.request(`/contracts/${contractId}`, {
      method: 'PUT',
      body: JSON.stringify(contractData),
    });
  }

  async redeemContract(contractId: string, data: {
    payment_method: string;
    note?: string;
  }) {
    return this.request(`/contracts/${contractId}/redeem`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async payInterest(contractId: string, data: {
    payment_method: string;
    note?: string;
  }) {
    return this.request(`/contracts/${contractId}/pay-interest`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async adjustLoan(contractId: string, data: {
    type: 'increase' | 'decrease';
    amount: number;
    note?: string;
  }) {
    return this.request(`/contracts/${contractId}/adjust-loan`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async suspendContract(contractId: string, data: {
    reason: string;
    note?: string;
  }) {
    return this.request(`/contracts/${contractId}/suspend`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard endpoints
  async getDashboardStats(storeId: string) {
    return this.request(`/api/dashboard?storeId=${storeId}`);
  }

  async getChartData(type: 'revenue' | 'categories' | 'contracts') {
    return this.request(`/dashboard/charts/${type}`);
  }

  // AI valuation endpoint
  async getAIValuation(itemData: {
    brand: string;
    model: string;
    type: string;
    condition_percent: number;
    accessories?: string;
    defects?: string;
  }) {
    return this.request('/ai/valuate', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  // User endpoints
  async getUser() {
    return this.request('/users/me');
  }

  async updateUser(userData: {
    full_name?: string;
    email?: string;
  }) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async changePassword(data: {
    current_password: string;
    new_password: string;
  }) {
    return this.request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export individual API functions for convenience
export const authAPI = {
  signUp: (userData: any) => apiClient.signUp(userData),
  signIn: (credentials: any) => apiClient.signIn(credentials),
  refreshToken: () => apiClient.refreshToken(),
};

export const storeAPI = {
  getAll: () => apiClient.getStores(),
  get: (storeId: string) => apiClient.getStore(storeId),
  create: (data: any) => apiClient.createStore(data),
  update: (storeId: string, data: any) => apiClient.updateStore(storeId, data),
  uploadFile: (file: File, type: 'logo' | 'stamp' | 'signature') =>
    apiClient.uploadFile(file, type),
};

export const customerAPI = {
  getAll: (storeId: string, search?: string) => apiClient.getCustomers(storeId, search),
  search: (phone?: string, name?: string, id_number?: string, store_id?: string) =>
    apiClient.searchCustomer(phone, name, id_number, store_id),
  create: (data: any) => apiClient.createCustomer(data),
  get: (id: string) => apiClient.getCustomer(id),
  update: (id: string, data: any) => apiClient.updateCustomer(id, data),
};

export const contractAPI = {
  getAll: (storeId: string, status?: string) => apiClient.getContracts(storeId, status),
  get: (id: string) => apiClient.getContract(id),
  create: (data: any) => apiClient.createContract(data),
  update: (id: string, data: any) => apiClient.updateContract(id, data),
  redeem: (id: string, data: any) => apiClient.redeemContract(id, data),
  payInterest: (id: string, data: any) => apiClient.payInterest(id, data),
  adjustLoan: (id: string, data: any) => apiClient.adjustLoan(id, data),
  suspend: (id: string, data: any) => apiClient.suspendContract(id, data),
};

export const dashboardAPI = {
  getStats: (storeId: string) => apiClient.getDashboardStats(storeId),
  getChartData: (type: 'revenue' | 'categories' | 'contracts') =>
    apiClient.getChartData(type),
};

export const aiAPI = {
  valuate: (itemData: any) => apiClient.getAIValuation(itemData),
};

export const userAPI = {
  get: () => apiClient.getUser(),
  update: (data: any) => apiClient.updateUser(data),
  changePassword: (data: any) => apiClient.changePassword(data),
};

export default apiClient;