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
  getAllUsers: (params) => API.get('/api/users', { params }),
  deleteUser: (id) => API.delete(`/api/users/${id}`),
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
  updateProfile:      (data)        => API.put('/api/technicians/profile', data),
};

export const dispatchAPI = {
  createRequest:   (data)                => API.post('/api/requests', data),
  getById:         (id)                  => API.get(`/api/requests/${id}`),
  getByUser:       (userId, params)      => API.get('/api/requests/my-requests', { params }),
  getByTechnician: (techId, params)      => API.get('/api/requests/my-jobs', { params }),
  getAvailable:    (serviceType, params) => API.get('/api/requests/available', { params: { serviceType, ...params } }),

  submitQuote:    (id, data) => API.post(`/api/requests/${id}/quote`, data),
  approveQuote:   (id, technicianId) => API.post(`/api/requests/${id}/approve-quote?technicianId=${technicianId}`),
  rejectQuote:    (id, technicianId) => API.post(`/api/requests/${id}/reject-quote?technicianId=${technicianId}`),
  getQuotesForRequest: (id) => API.get(`/api/requests/${id}/quotes`),
  markAsRated:    (id)       => API.patch(`/api/requests/${id}/mark-rated`),
  withdrawQuote:  (id, technicianId) => API.patch(`/api/requests/${id}/withdraw-quote?technicianId=${technicianId}`), 
  markInProgress: (id)       => API.patch(`/api/requests/${id}/in-progress`),
  complete:       (id, data) => API.patch(`/api/requests/${id}/complete`, data),
  cancel:         (id)       => API.patch(`/api/requests/${id}/cancel`),
  getRequestsByStatus: (status, params) => API.get(`/api/requests/status/${status}`, { params }),
};

export const paymentAPI = {
  // Creates a Razorpay order on the backend; returns { razorpayOrderId, amount, currency, keyId, ... }
  createOrder: (requestId) => API.post(`/api/payments/create-order?requestId=${requestId}`),
  // Verifies the payment signature server-side and marks the job PAID (no webhook needed)
  // Sent as JSON body to avoid URL-encoding issues with Razorpay's base64 signature
  verify: (requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature) =>
    API.post('/api/payments/verify', { requestId, razorpayOrderId, razorpayPaymentId, razorpaySignature }),
  // Returns current payment status for a given service request
  getStatus:   (requestId) => API.get(`/api/payments/status/${requestId}`),
};