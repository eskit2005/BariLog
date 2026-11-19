const API_BASE = '/api';

let memoryToken = localStorage.getItem('barilog_token') || null;

let sessionVersion = 0;
let refreshPromise = null;
const persistToken = (token) => {
  memoryToken = token;
  if (token) {
    localStorage.setItem('barilog_token', token);
  } else {
    localStorage.removeItem('barilog_token');
  }
};

export const setAuthToken = (token) => {
  sessionVersion++;
  persistToken(token);
};
export const getAuthToken = () => memoryToken;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE}/auth/refresh`, {method: 'GET', credentials: 'include'})
      .then(async response => response.ok ? (await response.json()).accessToken : null)
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function apiFetch(endpoint, options = {}) {
  const requestSession = sessionVersion;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (memoryToken) {
    headers['Authorization'] = `Bearer ${memoryToken}`;
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    // Attempt refresh
    try {
      const accessToken = await refreshAccessToken();
      if (options.signal?.aborted || sessionVersion !== requestSession) throw new DOMException('Aborted', 'AbortError');
      if (accessToken) {
        persistToken(accessToken);
        headers['Authorization'] = `Bearer ${accessToken}`;
        response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers, credentials: 'include' });
      } else {
        if (sessionVersion === requestSession) setAuthToken(null);
      }
    } catch (error) {
      if (error.name === 'AbortError') throw error;
      if (sessionVersion === requestSession) setAuthToken(null);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    let defaultMsg = 'API request failed';
    if (response.status === 401) {
      defaultMsg = 'Your session has expired. Please sign in again.';
    } else if (response.status === 403) {
      defaultMsg = 'Access denied. You do not have permission for this request.';
    } else if (response.status === 404) {
      defaultMsg = 'The requested resource was not found.';
    } else if (response.status >= 500) {
      defaultMsg = 'Server encountered an error. Please try again.';
    }
    throw {
      status: response.status,
      message: errorData.message || (errorData.errors ? errorData.errors.join(', ') : defaultMsg),
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

export const getUsers = () => apiFetch('/users');

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

// ----------------- Document Repository API (Feature 03) -----------------
// Building Rules
export const getBuildingRules = () => apiFetch('/documents/rules');

export const createBuildingRule = (payload) =>
  apiFetch('/documents/rules', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Notices
export const getNotices = () => apiFetch('/documents/notices');

export const createNotice = (payload) =>
  apiFetch('/documents/notices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const deleteNotice = (id) =>
  apiFetch(`/documents/notices/${id}`, {
    method: 'DELETE',
  });

// Complaints
export const getComplaints = () => apiFetch('/documents/complaints');

export const createComplaint = (payload) =>
  apiFetch('/documents/complaints', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const resolveComplaint = (id, payload) =>
  apiFetch(`/documents/complaints/${id}/resolve`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

// Maintenance Agreements
export const getMaintenanceAgreements = () => apiFetch('/documents/maintenance');

export const createMaintenanceAgreement = (payload) =>
  apiFetch('/documents/maintenance', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const markAgreementNoted = (id) =>
  apiFetch(`/documents/maintenance/${id}/noted`, {
    method: 'PATCH',
  });

// Expiry reminders (notices + agreements expiring within N days)
export const getExpiryReminders = (days = 30) => apiFetch(`/documents/expiring?days=${days}`);

// Resident directory and building assignments
export const getDirectoryBuildings = (options = {}) => apiFetch('/directory/buildings', options);
export const getDirectoryPreferences = (options = {}) => apiFetch('/directory/me/preferences', options);
export const updateDirectoryPreferences = (payload, options = {}) => apiFetch('/directory/me/preferences', {...options, method:'PUT', body:JSON.stringify(payload)});
export const getMyEmergencyDetails = (options = {}) => apiFetch('/directory/me/emergency', options);
export const updateMyEmergencyDetails = (payload, options = {}) => apiFetch('/directory/me/emergency', {...options, method:'PUT', body:JSON.stringify(payload)});
export const updateMyPhoneNumber = (phoneNumber, options = {}) => apiFetch('/directory/me/phone', {...options, method:'PUT', body:JSON.stringify({ phoneNumber })});
const directoryPath = (buildingId) => {
  if (!Number.isInteger(Number(buildingId)) || Number(buildingId) < 1) throw new Error('A valid building is required');
  return `/buildings/${Number(buildingId)}`;
};
const accountId = (id) => {
  if (!Number.isInteger(Number(id)) || Number(id) < 1) throw new Error('A valid account ID is required');
  return Number(id);
};
export const getResidentDirectory = (id, options = {}) => apiFetch(`${directoryPath(id)}/directory`, options);
export const getResidentEmergency = (id, residentId, options = {}) => apiFetch(`${directoryPath(id)}/directory/${accountId(residentId)}/emergency`, options);
export const updateResidentEmergency = (id, residentId, payload, options = {}) => apiFetch(`${directoryPath(id)}/directory/${accountId(residentId)}/emergency`, {...options, method:'PUT', body:JSON.stringify(payload)});
export const getSecurityAssignments = (id, options = {}) => apiFetch(`${directoryPath(id)}/security-assignments`, options);
export const assignBuildingSecurity = (id, guardId, options = {}) => apiFetch(`${directoryPath(id)}/security-assignments/${accountId(guardId)}`, {...options, method:'PUT'});
export const revokeBuildingSecurity = (id, guardId, options = {}) => apiFetch(`${directoryPath(id)}/security-assignments/${accountId(guardId)}`, {...options, method:'DELETE'});
export const assignBuildingManager = (id, managerId, options = {}) => apiFetch(`${directoryPath(id)}/manager`, {...options, method:'PUT', body:JSON.stringify({managerId:accountId(managerId)})});
