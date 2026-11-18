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


// ----------------- User Management (Directory / Selection) -----------------
export const getAllUsers = () => apiFetch('/users');

// ----------------- Resident & Tenancy Management API (Feature 02) -----------------

// Resident Profiles & Onboarding
export const getResidents = (params = {}) => {
  const query = new URLSearchParams();
  if (params.query) query.append('query', params.query);
  if (params.classification && params.classification !== 'ALL') query.append('classification', params.classification);
  if (params.allocationStatus && params.allocationStatus !== 'ALL') query.append('allocationStatus', params.allocationStatus);

  const qs = query.toString();
  return apiFetch(`/residents${qs ? `?${qs}` : ''}`);
};

export const getResident = (id) => {
  if (!id || id === 'null') throw new Error('Resident ID is required');
  return apiFetch(`/residents/${id}`);
};

export const registerResident = (payload) =>
  apiFetch('/residents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const createResident = (payload) => registerResident(payload);

export const updateResident = (id, payload) => {
  if (!id || id === 'null') throw new Error('Resident ID is required');
  return apiFetch(`/residents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// Apartment Allocation & Move-Out Lifecycle
export const allocateApartment = (residentId, payload) => {
  if (!residentId || residentId === 'null') throw new Error('Resident ID is required');
  return apiFetch(`/residents/${residentId}/allocate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const processMoveOut = (residentId, payload = {}) => {
  if (!residentId || residentId === 'null') throw new Error('Resident ID is required');
  return apiFetch(`/residents/${residentId}/move-out`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// Tenancy Agreements
export const getTenancyAgreements = (params = {}) => {
  const query = new URLSearchParams();
  if (params.apartmentId && params.apartmentId !== 'null') query.append('apartmentId', params.apartmentId);
  if (params.residentId && params.residentId !== 'null') query.append('residentId', params.residentId);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);
  if (params.archived !== undefined && params.archived !== null && params.archived !== 'ALL') query.append('archived', params.archived);

  const qs = query.toString();
  return apiFetch(`/residents/agreements${qs ? `?${qs}` : ''}`);
};

export const getTenancyAgreement = (id) => {
  if (!id || id === 'null') throw new Error('Agreement ID is required');
  return apiFetch(`/residents/agreements/${id}`);
};

export const createTenancyAgreement = (payload) =>
  apiFetch('/residents/agreements', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateTenancyAgreement = (id, payload) => {
  if (!id || id === 'null') throw new Error('Agreement ID is required');
  return apiFetch(`/residents/agreements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

export const terminateTenancyAgreement = (id, reason) => {
  if (!id || id === 'null') throw new Error('Agreement ID is required');
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiFetch(`/residents/agreements/${id}/terminate${qs}`, {
    method: 'PATCH',
  });
};

export const getApartmentTenancyHistory = (apartmentId) => {
  if (!apartmentId || apartmentId === 'null') throw new Error('Apartment ID is required');
  return apiFetch(`/residents/apartments/${apartmentId}/agreements`);
};

export const getResidentTenancyHistory = (residentId) => {
  if (!residentId || residentId === 'null') throw new Error('Resident ID is required');
  return apiFetch(`/residents/${residentId}/history`);
};

export const getResidentHistory = (residentId) => getResidentTenancyHistory(residentId);

// Move-In & Move-Out Inspections
export const getInspections = (params = {}) => {
  const query = new URLSearchParams();
  if (params.apartmentId && params.apartmentId !== 'null') query.append('apartmentId', params.apartmentId);
  if (params.residentId && params.residentId !== 'null') query.append('residentId', params.residentId);
  if (params.type && params.type !== 'ALL') query.append('type', params.type);
  if (params.status && params.status !== 'ALL') query.append('status', params.status);

  const qs = query.toString();
  return apiFetch(`/residents/inspections${qs ? `?${qs}` : ''}`);
};

export const getInspection = (id) => {
  if (!id || id === 'null') throw new Error('Inspection ID is required');
  return apiFetch(`/residents/inspections/${id}`);
};

export const scheduleInspection = (payload) =>
  apiFetch('/residents/inspections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const updateInspectionStatus = (id, payload) => {
  if (!id || id === 'null') throw new Error('Inspection ID is required');
  return apiFetch(`/residents/inspections/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteInspection = (id) => {
  if (!id || id === 'null') throw new Error('Inspection ID is required');
  return apiFetch(`/residents/inspections/${id}`, {
    method: 'DELETE',
  });
};
