import axios from 'axios';

const api = axios.create({
    baseURL: 'https://pulse-assignment-tca5.onrender.com/api', // Adjust if backend port changes
});

// Add a request interceptor to attach the Token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
