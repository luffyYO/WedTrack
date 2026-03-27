import apiClient from '@/api/client';

/**
 * adminApi is a wrapper around the centralized apiClient.
 * It ensures that all administrative requests target Supabase Edge Functions
 * and include the required security headers (apikey, Authorization).
 * 
 * Strict Rule: Only relative paths to Supabase Edge Functions are allowed.
 * Example: adminApi.get('admin-users') targets /functions/v1/admin-users
 */

const adminApi = {
  get: <T = any>(url: string, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return apiClient.get<T>(path, config);
  },
  post: <T = any>(url: string, data?: any, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return apiClient.post<T>(path, data, config);
  },
  put: <T = any>(url: string, data?: any, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return apiClient.put<T>(path, data, config);
  },
  delete: <T = any>(url: string, config?: any) => {
    const path = url.startsWith('/') ? url.substring(1) : url;
    return apiClient.delete<T>(path, config);
  }
};

export default adminApi;
