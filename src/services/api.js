import axios from 'axios';
import io from 'socket.io-client';

// Base URLs
const backendBaseUrl = "http://localhost:5000";
const API_BaseUrl = `${backendBaseUrl}/api`;

// Axios instance
const API = axios.create({
  baseURL: API_BaseUrl,
});

// ✅ Attach token to every request if available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ✅ Response interceptor for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle common error cases
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // You can redirect to login here if needed
    }
    return Promise.reject(error);
  }
);

// ✅ Auth APIs
export const registerUser = (userData) => API.post("/auth/register", userData);
export const loginUser = (userData) => API.post("/auth/login", userData);

// ✅ User APIs
export const getUserProfile = () => API.get("/users/profile");
export const getAllTenants = () => API.get("/users/tenants");
export const getAllLandlords = () => API.get("/users/landlords");
export const updateRentAmount = (rentData) => API.put("/users/rent-amount", rentData);
export const getAllUsers = () => API.get("/users/all"); // Debug endpoint

// ✅ Bills APIs
export const getBills = () => API.get("/bills/me");
export const createBill = (billData) => API.post("/bills", billData);
export const createMonthlyBill = (billData) => API.post("/bills/generate-monthly", billData);
export const cashPayment = (billId) => API.post(`/bills/pay-cash/${billId}`);
export const getMyBills = () => API.get("/bills/me");
export const getBillsForApartment = () => API.get("/bills/apartment");
export const generateMonthlyBills = (billData) => API.post("/bills/generate-monthly", billData);
export const makeCashPayment = (paymentData) => API.post("/bills/pay-cash", paymentData);
export const updateBill = (billId, billData) => API.put(`/bills/${billId}`, billData);
export const getUnpaidBills = () => API.get("/bills/unpaid");
export const getPaidBills = () => API.get("/bills/paid");
export const downloadBillPDF = (billId) => API.get(`/bills/download/${billId}`, { responseType: 'blob' });
export const downloadReceiptPDF = (billId) => API.get(`/bills/download-receipt/${billId}`, { responseType: 'blob' });
export const downloadPaymentReceiptPDF = (billId, paymentIndex) => API.get(`/bills/download-receipt/${billId}/${paymentIndex}`, { responseType: 'blob' });

// ✅ Complaints APIs
export const getComplaints = () => API.get("/complaints");
export const getMyComplaints = () => API.get("/complaints/me");
export const createComplaint = (complaintData) => API.post("/complaints", complaintData);
export const updateComplaint = (complaintId, statusData) => API.put(`/complaints/${complaintId}`, statusData);
export const updateComplaintStatus = (complaintId, statusData) => API.put(`/complaints/${complaintId}`, statusData);
export const addLandlordNote = (complaintId, note) => API.post(`/complaints/${complaintId}/note`, { note });

// ✅ Chat APIs
export const getChats = () => API.get("/chats/me");
export const getMyConversations = () => API.get("/chats/conversations");
export const getAvailableChatPartners = () => API.get("/chats/partners");
export const getConversation = (userId1, userId2) => API.get(`/chats/conversation/${userId1}/${userId2}`);
export const createChat = (messageData) => API.post("/chats", messageData);
export const getChatsByNationalID = (nationalID) => API.get(`/chats/user/${nationalID}`);

// ✅ Rules APIs
export const getRules = () => API.get("/rules");
export const addRule = (rulesData) => API.post("/rules", rulesData);
export const addRules = (rulesData) => API.post("/rules", rulesData);
export const updateRule = (ruleId, ruleData) => API.put(`/rules/${ruleId}`, ruleData);
export const deleteRule = (ruleId) => API.delete(`/rules/${ruleId}`);

// ✅ Apartments APIs
export const getAvailableApartments = () => API.get("/apartments/available");
export const createApartment = (apartmentData) => API.post("/apartments", apartmentData);
export const getLandlordApartments = () => API.get("/apartments/landlord/my-apartments");
export const updateApartment = (apartmentId, apartmentData) => API.put(`/apartments/${apartmentId}`, apartmentData);
export const deleteApartment = (apartmentId) => API.delete(`/apartments/${apartmentId}`);
export const getApartmentById = (apartmentId) => API.get(`/apartments/${apartmentId}`);

// ✅ Socket.io client
export const socket = io(backendBaseUrl, { autoConnect: false });

// ✅ Helper function to get current user
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

// ✅ Helper function to logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  socket.disconnect();
};
