'use client';

import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

/**
 * Custom hook for API calls with loading and error states
 */
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    method = 'GET',
    immediate = false,
    onSuccess = null,
    onError = null,
  } = options;

  const execute = useCallback(
    async (params = {}, body = null) => {
      setLoading(true);
      setError(null);

      try {
        // Handle both { url: '...' } and direct endpoint calls
        let actualEndpoint = endpoint;
        let actualMethod = method;
        let actualParams = {};
        let actualBody = body;

        if (params && typeof params === 'object' && !Array.isArray(params)) {
          if (params.url) {
            actualEndpoint = params.url;
            actualMethod = params.method || method;
            actualParams = params.params || {};
            actualBody = params.body || null;
          } else {
            actualParams = params;
          }
        }

        let response;

        switch (actualMethod.toUpperCase()) {
          case 'GET':
            response = await apiClient.get(actualEndpoint, actualParams);
            break;
          case 'POST':
            response = await apiClient.post(actualEndpoint, actualBody || actualParams);
            break;
          case 'PUT':
            response = await apiClient.put(actualEndpoint, actualBody || actualParams);
            break;
          case 'PATCH':
            response = await apiClient.patch(actualEndpoint, actualBody || actualParams);
            break;
          case 'DELETE':
            response = await apiClient.delete(actualEndpoint, actualParams);
            break;
          default:
            throw new Error(`Unsupported method: ${actualMethod}`);
        }

        setData(response.data || response);
        setLoading(false);

        if (onSuccess) {
          onSuccess(response.data || response);
        }

        return response;
      } catch (err) {
        setError(err.message || 'An error occurred');
        setLoading(false);

        if (onError) {
          onError(err);
        }

        throw err;
      }
    },
    [endpoint, method, onSuccess, onError]
  );

  useEffect(() => {
    if (immediate && method.toUpperCase() === 'GET') {
      execute();
    }
  }, [immediate, method, execute]);

  return { data, loading, error, execute, refetch: execute };
}

/**
 * Custom hook for form submissions
 */
export function useFormSubmit(endpoint, options = {}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const { method = 'POST', onSuccess = null, onError = null } = options;

  const submit = async (formData) => {
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      let response;

      if (method.toUpperCase() === 'POST') {
        response = await apiClient.post(endpoint, formData);
      } else if (method.toUpperCase() === 'PUT') {
        response = await apiClient.put(endpoint, formData);
      } else if (method.toUpperCase() === 'PATCH') {
        response = await apiClient.patch(endpoint, formData);
      }

      setSuccess(true);
      setSubmitting(false);

      if (onSuccess) {
        onSuccess(response.data || response);
      }

      return response;
    } catch (err) {
      setError(err.message || 'Submission failed');
      setSubmitting(false);

      if (onError) {
        onError(err);
      }

      throw err;
    }
  };

  const reset = () => {
    setSubmitting(false);
    setError(null);
    setSuccess(false);
  };

  return { submit, submitting, error, success, reset };
}

/**
 * Custom hook for file uploads
 */
export function useFileUpload(endpoint) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const upload = async (file) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await apiClient.upload(endpoint, file, (percent) => {
        setProgress(percent);
      });

      setUploading(false);
      return response;
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  };

  const uploadMultiple = async (files) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const response = await apiClient.uploadMultiple(endpoint, files, (percent) => {
        setProgress(percent);
      });

      setUploading(false);
      return response;
    } catch (err) {
      setError(err.message || 'Upload failed');
      setUploading(false);
      throw err;
    }
  };

  return { upload, uploadMultiple, uploading, progress, error };
}

/**
 * Custom hook for pagination
 */
export function usePagination(endpoint, options = {}) {
  const { pageSize = 10, initialPage = 1 } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const fetchPage = async (pageNumber) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(endpoint, {
        page: pageNumber,
        limit: pageSize,
      });

      setData(response.data || []);
      setPage(pageNumber);
      setTotalPages(response.totalPages || 0);
      setTotalItems(response.total || 0);
      setLoading(false);

      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      setLoading(false);
      throw err;
    }
  };

  const nextPage = () => {
    if (page < totalPages) {
      fetchPage(page + 1);
    }
  };

  const prevPage = () => {
    if (page > 1) {
      fetchPage(page - 1);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      fetchPage(pageNumber);
    }
  };

  useEffect(() => {
    fetchPage(initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    data,
    loading,
    error,
    page,
    totalPages,
    totalItems,
    nextPage,
    prevPage,
    goToPage,
    refetch: () => fetchPage(page),
  };
}
