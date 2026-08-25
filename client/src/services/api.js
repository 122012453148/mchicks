import axios from 'axios';
import { getCache, setCache, addToSyncQueue } from '../utils/db';

const generateClientRecordId = () => {
  return 'offline-' + Date.now() + '-' + Math.round(Math.random() * 1E9);
};

const offlineGet = async (url, cacheKey) => {
  try {
    const response = await API.get(url);
    await setCache(cacheKey, response.data).catch(() => null);
    return response.data;
  } catch (err) {
    if (!navigator.onLine || err.message === 'Network Error') {
      try {
        const cached = await getCache(cacheKey);
        if (cached) return cached;
      } catch (e) {
        console.warn('Cache error:', e);
      }
    }
    throw err;
  }
};

const offlinePost = async (url, data, recordType, batchId) => {
  if (navigator.onLine) {
    try {
      const response = await API.post(url, data);
      return response.data;
    } catch (err) {
      if (err.message !== 'Network Error') throw err;
    }
  }
  
  const clientRecordId = generateClientRecordId();
  data.clientRecordId = clientRecordId;
  
  await addToSyncQueue({
    localId: clientRecordId,
    type: recordType,
    batchId,
    payload: data,
  });
  
  window.dispatchEvent(new Event('mchicks-queue-updated'));
  return data;
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Add JWT auth token to all requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mchicks_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to login
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mchicks_token');
      localStorage.removeItem('mchicks_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (username, password) => {
    const response = await API.post('/auth/login', { username, password });
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('mchicks_token');
    localStorage.removeItem('mchicks_user');
  },
  isAuthenticated: () => {
    return !!localStorage.getItem('mchicks_token');
  },
  getUser: () => {
    return localStorage.getItem('mchicks_user') || 'Owner';
  }
};

export const batchService = {
  getBatches: async () => {
    return offlineGet('/batches', 'batches');
  },
  getBatch: async (id) => {
    return offlineGet(`/batches/${id}`, `batch-${id}`);
  },
  createBatch: async (data) => {
    const response = await API.post('/batches', data);
    return response.data;
  },
  completeBatch: async (id, data) => {
    const response = await API.post(`/batches/${id}/complete`, data);
    return response.data;
  },
  updateLocation: async (id, data) => {
    const response = await API.post(`/batches/${id}/location`, data);
    return response.data;
  }
};

export const logService = {
  getLogs: async (batchId) => {
    return offlineGet(`/batches/${batchId}/logs`, `logs-${batchId}`);
  },
  createLog: async (batchId, data) => {
    return offlinePost(`/batches/${batchId}/logs`, data, 'DailyLog', batchId);
  },
  createLogWithImage: async (batchId, formData) => {
    if (navigator.onLine) {
      try {
        const response = await API.post(`/batches/${batchId}/logs-with-image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      } catch (err) {
        if (err.message !== 'Network Error') throw err;
      }
    }
    
    const payloadObj = {};
    let imageBlob = null;
    for (let [key, value] of formData.entries()) {
      if (key === 'image') imageBlob = value;
      else payloadObj[key] = value;
    }
    
    const clientRecordId = generateClientRecordId();
    payloadObj.clientRecordId = clientRecordId;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          await addToSyncQueue({
            localId: clientRecordId,
            type: 'DailyLog',
            batchId,
            payload: payloadObj,
            imageBlob: reader.result
          });
          window.dispatchEvent(new Event('mchicks-queue-updated'));
          resolve(payloadObj);
        } catch (e) { reject(e); }
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageBlob);
    });
  }
};

export const weightService = {
  getWeights: async (batchId) => {
    return offlineGet(`/batches/${batchId}/weights`, `weights-${batchId}`);
  },
  createWeight: async (batchId, data) => {
    return offlinePost(`/batches/${batchId}/weights`, data, 'WeightRecord', batchId);
  }
};

export const supplementService = {
  getSupplements: async (batchId) => {
    return offlineGet(`/batches/${batchId}/supplements`, `supplements-${batchId}`);
  },
  createSupplement: async (batchId, data) => {
    return offlinePost(`/batches/${batchId}/supplements`, data, 'Supplement', batchId);
  },
  deleteSupplement: async (batchId, itemId) => {
    const response = await API.delete(`/batches/${batchId}/supplements/${itemId}`);
    return response.data;
  }
};

export const expenseService = {
  getExpenses: async (batchId) => {
    return offlineGet(`/batches/${batchId}/expenses`, `expenses-${batchId}`);
  },
  createExpense: async (batchId, data) => {
    return offlinePost(`/batches/${batchId}/expenses`, data, 'Expense', batchId);
  },
  deleteExpense: async (batchId, itemId) => {
    const response = await API.delete(`/batches/${batchId}/expenses/${itemId}`);
    return response.data;
  }
};

export const supervisorService = {
  getVisits: async (batchId) => {
    return offlineGet(`/batches/${batchId}/supervisor`, `supervisor-${batchId}`);
  },
  createVisit: async (batchId, data) => {
    return offlinePost(`/batches/${batchId}/supervisor`, data, 'SupervisorVisit', batchId);
  }
};

export const settingsService = {
  getSettings: async () => {
    return offlineGet('/settings', 'settings');
  },
  updateSettings: async (data) => {
    const response = await API.post('/settings', data);
    return response.data;
  }
};

export const weatherService = {
  getWeather: async (lat, lng, address) => {
    let url = '/weather';
    const params = new URLSearchParams();
    if (lat && lng) {
      params.append('lat', lat);
      params.append('lng', lng);
      if (address) params.append('address', address);
      url += `?${params.toString()}`;
    }
    try {
      const response = await API.get(url);
      await setCache('weather', response.data).catch(() => null);
      return response.data;
    } catch (err) {
      if (!navigator.onLine || err.message === 'Network Error') {
        try {
          const cached = await getCache('weather');
          if (cached) {
            cached.isCached = true;
            return cached;
          }
        } catch (e) {
          console.warn('Weather cache error:', e);
        }
      }
      throw err;
    }
  }
};
