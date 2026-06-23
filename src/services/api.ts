import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('fintrack-auth');
  if (stored) {
    try {
      const { state } = JSON.parse(stored);
      if (state?.token) config.headers.Authorization = `Bearer ${state.token}`;
    } catch { /* ignore */ }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || 'Something went wrong';
    if (err.response?.status === 401) {
      localStorage.removeItem('fintrack-auth');
      window.location.href = '/login';
    } else {
      toast.error(msg);
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (d: object) => api.post('/api/auth/register', d),
login: (d: object) => api.post('/api/auth/login', d),
getMe: () => api.get('/api/auth/me'),
updateProfile: (d: object) => api.put('/api/auth/profile', d),
changePassword: (d: object) => api.put('/api/auth/password', d),
forgotPassword: (d: object) => api.post('/api/auth/forgot-password', d),
resetPassword: (d: object) => api.post('/api/auth/reset-password', d),
};

export const transactionAPI = {
  getAll: (params?: object) => api.get('/transactions', { params }),
  create: (d: object) => api.post('/transactions', d),
  update: (id: string, d: object) => api.put(`/transactions/${id}`, d),
  delete: (id: string) => api.delete(`/transactions/${id}`),
  getSummary: (params?: object) => api.get('/transactions/summary', { params }),
  getMonthly: (params?: object) => api.get('/transactions/monthly', { params }),
  getByCategory: (params?: object) => api.get('/transactions/by-category', { params }),
  getCategories: () => api.get('/transactions/categories'),
};

export const companyAPI = {
  getMine: () => api.get('/company/me'),
};

export const budgetAPI = {
  getAll: (params?: object) => api.get('/budgets', { params }),
  create: (d: object) => api.post('/budgets', d),
  update: (id: string, d: object) => api.put(`/budgets/${id}`, d),
  delete: (id: string) => api.delete(`/budgets/${id}`),
  sync: (d: object) => api.post('/budgets/sync', d),
};

export const aiAPI = {
  getInsights: (params?: object) => api.get('/ai/insights', { params }),
};

export default api;
