import axios, { AxiosError } from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config: any) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    // Handle different error status codes
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('Resource not found.');
          break;
        case 422:
          toast.error(data?.message || 'Validation error. Please check your input.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(data?.message || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  logout: () =>
    api.post('/auth/logout'),
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Content APIs
export const newsAPI = {
  getAll: (params?: any) => api.get('/news', { params }),
  getOne: (id: string) => api.get(`/news/${id}`),
  create: (data: any) => api.post('/news', data),
  update: (id: string, data: any) => api.put(`/news/${id}`, data),
  delete: (id: string) => api.delete(`/news/${id}`),
};

export const heroBannersAPI = {
  getAll: (params?: any) => api.get('/hero-banners', { params }),
  getOne: (id: string) => api.get(`/hero-banners/${id}`),
  create: (data: any) => api.post('/hero-banners', data),
  update: (id: string, data: any) => api.put(`/hero-banners/${id}`, data),
  delete: (id: string) => api.delete(`/hero-banners/${id}`),
};

export const announcementsAPI = {
  getAll: (params?: any) => api.get('/announcements', { params }),
  getOne: (id: string) => api.get(`/announcements/${id}`),
  create: (data: any) => api.post('/announcements', data),
  update: (id: string, data: any) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
};

export const pressReleasesAPI = {
  getAll: (params?: any) => api.get('/press-releases', { params }),
  getOne: (id: string) => api.get(`/press-releases/${id}`),
  create: (data: any) => api.post('/press-releases', data),
  update: (id: string, data: any) => api.put(`/press-releases/${id}`, data),
  delete: (id: string) => api.delete(`/press-releases/${id}`),
};

export const eventsAPI = {
  getAll: (params?: any) => api.get('/events', { params }),
  getOne: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.put(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
};

export const leadersAPI = {
  getAll: (params?: any) => api.get('/leaders', { params }),
  getOne: (id: string) => api.get(`/leaders/${id}`),
  create: (data: any) => api.post('/leaders', data),
  update: (id: string, data: any) => api.put(`/leaders/${id}`, data),
  delete: (id: string) => api.delete(`/leaders/${id}`),
};

export const servicesAPI = {
  getAll: (params?: any) => api.get('/services', { params }),
  getOne: (id: string) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

export const projectsAPI = {
  getAll: (params?: any) => api.get('/projects', { params }),
  getOne: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

export const mdasAPI = {
  getAll: (params?: any) => api.get('/mdas', { params }),
  getOne: (id: string) => api.get(`/mdas/${id}`),
  create: (data: any) => api.post('/mdas', data),
  update: (id: string, data: any) => api.put(`/mdas/${id}`, data),
  delete: (id: string) => api.delete(`/mdas/${id}`),
};

export const lgasAPI = {
  getAll: (params?: any) => api.get('/lgas', { params }),
  getOne: (id: string) => api.get(`/lgas/${id}`),
  create: (data: any) => api.post('/lgas', data),
  update: (id: string, data: any) => api.put(`/lgas/${id}`, data),
  delete: (id: string) => api.delete(`/lgas/${id}`),
};

export const mediaAPI = {
  getAll: (params?: any) => api.get('/media', { params }),
  getOne: (id: string) => api.get(`/media/${id}`),
  create: (data: FormData) => api.post('/media', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id: string, data: any) => api.put(`/media/${id}`, data),
  delete: (id: string) => api.delete(`/media/${id}`),
};

export const quickLinksAPI = {
  getAll: (params?: any) => api.get('/quick-links', { params }),
  getOne: (id: string) => api.get(`/quick-links/${id}`),
  create: (data: any) => api.post('/quick-links', data),
  update: (id: string, data: any) => api.put(`/quick-links/${id}`, data),
  delete: (id: string) => api.delete(`/quick-links/${id}`),
};

export const pagesAPI = {
  getAll: (params?: any) => api.get('/pages', { params }),
  getOne: (id: string) => api.get(`/pages/${id}`),
  create: (data: any) => api.post('/pages', data),
  update: (id: string, data: any) => api.put(`/pages/${id}`, data),
  delete: (id: string) => api.delete(`/pages/${id}`),
};

export const faqsAPI = {
  getAll: (params?: any) => api.get('/faqs', { params }),
  getOne: (id: string) => api.get(`/faqs/${id}`),
  create: (data: any) => api.post('/faqs', data),
  update: (id: string, data: any) => api.put(`/faqs/${id}`, data),
  delete: (id: string) => api.delete(`/faqs/${id}`),
};

export const contactsAPI = {
  getAll: (params?: any) => api.get('/contacts', { params }),
  getOne: (id: string) => api.get(`/contacts/${id}`),
  updateStatus: (id: string, status: string) =>
    api.patch(`/contacts/${id}/status`, { status }),
  respond: (id: string, response: string) =>
    api.patch(`/contacts/${id}/respond`, { response }),
  delete: (id: string) => api.delete(`/contacts/${id}`),
};

export const subscribersAPI = {
  getAll: (params?: any) => api.get('/subscribers', { params }),
  getOne: (id: string) => api.get(`/subscribers/${id}`),
  delete: (id: string) => api.delete(`/subscribers/${id}`),
  toggleStatus: (id: string) => api.patch(`/subscribers/${id}/toggle-status`),
};

export const usersAPI = {
  getAll: (params?: any) => api.get('/users', { params }),
  getOne: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  toggleStatus: (id: string) => api.patch(`/users/${id}/toggle-status`),
};

// Dashboard API
export const budgetDocumentsAPI = {
  getAll: (params?: any) => api.get('/budget-documents', { params }),
  getOne: (id: string) => api.get(`/budget-documents/${id}`),
  create: (data: any) => api.post('/budget-documents', data),
  update: (id: string, data: any) => api.put(`/budget-documents/${id}`, data),
  delete: (id: string) => api.delete(`/budget-documents/${id}`),
};

export const tendersAPI = {
  getAll: (params?: any) => api.get('/tenders', { params }),
  getOne: (id: string) => api.get(`/tenders/${id}`),
  create: (data: any) => api.post('/tenders', data),
  update: (id: string, data: any) => api.put(`/tenders/${id}`, data),
  delete: (id: string) => api.delete(`/tenders/${id}`),
};

export const jobsAPI = {
  getAll: (params?: any) => api.get('/jobs', { params }),
  getOne: (id: string) => api.get(`/jobs/${id}`),
  create: (data: any) => api.post('/jobs', data),
  update: (id: string, data: any) => api.put(`/jobs/${id}`, data),
  delete: (id: string) => api.delete(`/jobs/${id}`),
};

export const foiRequestsAPI = {
  getAll: (params?: any) => api.get('/foi-requests', { params }),
  getOne: (id: string) => api.get(`/foi-requests/${id}`),
  update: (id: string, data: any) => api.put(`/foi-requests/${id}`, data),
  delete: (id: string) => api.delete(`/foi-requests/${id}`),
};

export const datasetsAPI = {
  getAll: (params?: any) => api.get('/datasets', { params }),
  getOne: (id: string) => api.get(`/datasets/${id}`),
  create: (data: any) => api.post('/datasets', data),
  update: (id: string, data: any) => api.put(`/datasets/${id}`, data),
  delete: (id: string) => api.delete(`/datasets/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};