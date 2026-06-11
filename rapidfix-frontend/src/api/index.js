import axios from 'axios';

// Single gateway instance — all requests go through port 8080
const API = axios.create({ baseURL: '' });

API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
    res => res,
    err => {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear();
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
);

export const authAPI = {
  register: (data) => API.post('/api/auth/register', data),
  login:    (data) => API.post('/api/auth/login', data),
};

export const userAPI = {
  getMe: (id) => API.get(`/api/users/${id}`),
};

export const techAPI = {
  register:           (data)        => API.post('/api/technicians', data),
  getByUserId:        (userId)      => API.get(`/api/technicians/user/${userId}`),
  getById:            (id)          => API.get(`/api/technicians/${id}`),
  updateAvailability: (id, status)  => API.patch(`/api/technicians/${id}/availability?status=${status}`),
  updateLocation:     (id, data)    => API.patch(`/api/technicians/${id}/location`, data),
  updateRating:       (id, data)    => API.patch(`/api/technicians/${id}/rating`, data),
  getNearby:          (params)      => API.get('/api/technicians/nearby', { params }),
  getAll:             (params)      => API.get('/api/technicians', { params }),
};

export const dispatchAPI = {
  createRequest:   (data)                => API.post('/api/requests', data),
  getById:         (id)                  => API.get(`/api/requests/${id}`),
  getByUser:       (userId, params)      => API.get(`/api/requests/user/${userId}`, { params }),
  getByTechnician: (techId, params)      => API.get(`/api/requests/technician/${techId}`, { params }),
  getAvailable:    (serviceType, params) => API.get('/api/requests/available', { params: { serviceType, ...params } }),

  submitQuote:    (id, data) => API.post(`/api/requests/${id}/quote`, data),
  approveQuote:   (id)       => API.post(`/api/requests/${id}/approve-quote`),
  rejectQuote:    (id)       => API.post(`/api/requests/${id}/reject-quote`),
  markAsRated:    (id)       => API.patch(`/api/requests/${id}/mark-rated`),
  withdrawQuote:  (id, technicianId) => API.patch(`/api/requests/${id}/withdraw-quote?technicianId=${technicianId}`), 
  markInProgress: (id)       => API.patch(`/api/requests/${id}/in-progress`),
  complete:       (id, data) => API.patch(`/api/requests/${id}/complete`, data),
  cancel:         (id)       => API.patch(`/api/requests/${id}/cancel`),
};