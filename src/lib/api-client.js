import axios from 'axios';
import { API_CONFIG, buildUrl, getFullUrl } from '@/constants/api-endpoints';

/**
 * Enhanced API Client with Axios
 * Features:
 * - Automatic token management
 * - Request/response interceptors
 * - Error handling
 * - Loading states
 * - Retry logic
 */

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem('accessToken', token);
  }
};

export const getAccessToken = () => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem('accessToken');
  }
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
  }
};

// Request Interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remove Content-Type header for FormData to let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    // Add timestamp to prevent caching
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // In the new system, refreshToken is in a cookie, so we just call the refresh endpoint
        const response = await axios.post('/api/auth/refresh', {}, { withCredentials: true });

        const { accessToken: newToken } = response.data;
        if (newToken) {
          setAccessToken(newToken);
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        clearAccessToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        status: 0,
      });
    }

    // Handle HTML responses (when API returns error pages)
    const contentType = error.response.headers['content-type'];
    if (contentType && contentType.includes('text/html')) {
      // Return JSON error for HTML responses
      const errorStatus = error.response?.status || 500;
      let errorMessage = 'An error occurred';

      if (errorStatus === 401) {
        errorMessage = 'Authentication required. Please login again.';
      } else if (errorStatus === 403) {
        errorMessage = 'Access denied. Insufficient permissions.';
      } else if (errorStatus === 404) {
        errorMessage = 'API endpoint not found.';
      } else if (errorStatus === 500) {
        errorMessage = 'Internal server error.';
      }

      return Promise.reject({
        message: errorMessage,
        status: errorStatus,
        htmlResponse: true, // Flag to indicate this was originally HTML
      });
    }

    // Handle JSON error responses
    const errorMessage = error.response?.data?.message || 'An error occurred';
    const errorStatus = error.response?.status || 500;

    return Promise.reject({
      message: errorMessage,
      status: errorStatus,
      errors: error.response?.data?.errors,
    });
  }
);

/**
 * API Client Class
 */
class ApiClient {
  constructor() {
    this.loading = false;
  }

  /**
   * Generic request method
   */
  async request(method, endpoint, data = null, config = {}) {
    this.loading = true;

    try {
      const response = await apiClient({
        method,
        url: endpoint,
        data,
        ...config,
      });

      this.loading = false;
      return response;
    } catch (error) {
      this.loading = false;
      console.error('API Client Error:', {
        method,
        endpoint,
        message: error?.message || (typeof error === 'string' ? error : 'Unknown Error'),
        status: error?.status,
        response: error?.response?.data,
        stack: error?.stack
      });
      
      // Additional log for easier debugging in some environments
      console.error(`[API Error] ${method} ${endpoint}: ${error?.message || 'Unknown Error'}`);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, params = {}, config = {}) {
    return this.request('GET', endpoint, null, { params, ...config });
  }

  /**
   * POST request
   */
  post(endpoint, data, config = {}) {
    return this.request('POST', endpoint, data, config);
  }

  /**
   * PUT request
   */
  put(endpoint, data, config = {}) {
    return this.request('PUT', endpoint, data, config);
  }

  /**
   * PATCH request
   */
  patch(endpoint, data, config = {}) {
    return this.request('PATCH', endpoint, data, config);
  }

  /**
   * DELETE request
   */
  delete(endpoint, config = {}) {
    return this.request('DELETE', endpoint, null, config);
  }

  /**
   * POST FormData request
   */
  postFormData(endpoint, formData, config = {}) {
    return this.request('POST', endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  }

  /**
   * PUT FormData request
   */
  putFormData(endpoint, formData, config = {}) {
    return this.request('PUT', endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
  }

  /**
   * Upload file with progress tracking
   */
  async upload(endpoint, file, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }
    
    return this.post(endpoint, formData, config);
  }

  /**
   * Bulk upload files
   */
  async uploadMultiple(endpoint, files, onProgress = null) {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    
    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onProgress(percentCompleted);
      };
    }
    
    return this.post(endpoint, formData, config);
  }

  /**
   * Download file
   */
  async download(endpoint, filename = 'download') {
    try {
      const response = await apiClient({
        method: 'GET',
        url: endpoint,
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!getAccessToken();
  }

  /**
   * Get loading state
   */
  isLoading() {
    return this.loading;
  }
}

// Export singleton instance
const client = new ApiClient();

export { apiClient as axiosInstance };
export { setAccessToken, getAccessToken, clearAccessToken };
export default client;
