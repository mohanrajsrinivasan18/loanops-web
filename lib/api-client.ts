/**
 * API Client utility for making authenticated requests
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  [key: string]: any;
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Merge headers
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Request failed with status ${response.status}`,
        ...data,
      };
    }

    return {
      success: true,
      ...data,
    };
  } catch (error: any) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error.message || 'Request failed',
    };
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  url: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  url: string,
  body?: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'DELETE' });
}
