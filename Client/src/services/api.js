const API_BASE = '/api';

let memoryToken = localStorage.getItem('barilog_token') || null;

export const setAuthToken = (token) => {
  memoryToken = token;
  if (token) {
    localStorage.setItem('barilog_token', token);
  } else {
    localStorage.removeItem('barilog_token');
  }
};

export const getAuthToken = () => memoryToken;

export async function apiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (memoryToken) {
    headers['Authorization'] = `Bearer ${memoryToken}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    // Attempt refresh
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'GET',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        const { accessToken } = await refreshRes.json();
        setAuthToken(accessToken);
        headers['Authorization'] = `Bearer ${accessToken}`;
        return fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' });
      }
    } catch {
      setAuthToken(null);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw {
      status: response.status,
      message: errorData.message || (errorData.errors ? errorData.errors.join(', ') : 'API request failed'),
      errors: errorData.errors || [],
    };
  }

  if (response.status === 204) return null;
  return response.json();
}

// ----------------- Auth API -----------------
export const login = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.accessToken);
  return data;
};

export const register = (payload) =>
  apiFetch('/users/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const fetchMe = () => apiFetch('/auth/me');

export const logout = async () => {
  try {
    await apiFetch('/auth/logout', { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend logout failed or was unreachable', err);
  } finally {
    setAuthToken(null);
  }
};

// ----------------- Building API -----------------
export const getBuildings = () => apiFetch('/buildings');

export const getBuilding = (id) => {
  if (!id || id === 'null') throw new Error('Building ID is required');
  return apiFetch(`/buildings/${id}`);
};

export const createBuilding = (payload) =>
  apiFetch('/buildings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getFloors = (buildingId) => {
  if (!buildingId || buildingId === 'null') return Promise.resolve([]);
  return apiFetch(`/buildings/${buildingId}/floors`);
};

export const addFloor = (buildingId, payload) => {
  if (!buildingId || buildingId === 'null') throw new Error('Building ID is required');
  return apiFetch(`/buildings/${buildingId}/floors`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getOccupancyStats = (buildingId) => {
  if (!buildingId || buildingId === 'null') return Promise.resolve(null);
  return apiFetch(`/buildings/${buildingId}/occupancy-stats`);
};

// ----------------- Apartment API (Feature 01) -----------------
export const getApartments = (params = {}) => {
  const query = new URLSearchParams();
  if (params.buildingId && params.buildingId !== 'null') query.append('buildingId', params.buildingId);
  if (params.floorId && params.floorId !== 'null') query.append('floorId', params.floorId);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.residentId && params.residentId !== 'null') query.append('residentId', params.residentId);
  if (params.ownerId && params.ownerId !== 'null') query.append('ownerId', params.ownerId);

  const qs = query.toString();
  return apiFetch(`/apartments${qs ? `?${qs}` : ''}`);
};

export const getApartment = (id) => {
  if (!id || id === 'null') throw new Error('Apartment ID is required');
  return apiFetch(`/apartments/${id}`);
};

export const createApartment = (payload) =>
  apiFetch('/apartments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateApartment = (id, payload) => {
  if (!id || id === 'null') throw new Error('Apartment ID is required');
  return apiFetch(`/apartments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const updateOccupancy = (id, payload) => {
  if (!id || id === 'null') throw new Error('Apartment ID is required');
  return apiFetch(`/apartments/${id}/occupancy`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const getOccupancyHistory = (id) => {
  if (!id || id === 'null') return Promise.resolve([]);
  return apiFetch(`/apartments/${id}/history`);
};

export const deleteApartment = (id) => {
  if (!id || id === 'null') throw new Error('Apartment ID is required');
  return apiFetch(`/apartments/${id}`, {
    method: 'DELETE',
  });
};
