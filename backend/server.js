const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const requiredEnvs = ['MONGO_URI', 'JWT_SECRET'];
requiredEnvs.forEach((name) => {
    if (!process.env[name]) {
        console.error(`Error: Environment variable ${name} is missing!`);
        process.exit(1); // Stop the server immediately
    }
});

// Connect to Database
connectDB();
// Initialize Socket.io for Real-Time Updates 
const io = new Server(server, {
    cors: {
        origin: ["https://pulse-assignment-beta.vercel.app", "http://localhost:5173", "http://localhost:3000"],
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('join', (userData) => {
        if (!userData) return;

        // Join Tenant Room (for Editors/Viewers)
        if (userData.tenantId) {
            socket.join(userData.tenantId);
            console.log(`[SOCKET] Socket ${socket.id} joined tenant: ${userData.tenantId}`);
        }

        // Join Admin Room (for Super Admin)
        if (userData.role === 'Admin') {
            socket.join('admin');
            console.log(`[SOCKET] Socket ${socket.id} joined admin room`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

app.use(cors({
    origin: ["https://pulse-assignment-beta.vercel.app", "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Attach socket to request so controllers can use it
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/videos', require('./routes/videoRoutes'));
app.use('/api/tenants', require('./routes/tenantRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Basic Health Check
app.get('/', (req, res) => res.send('API Running'));

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server started on port ${PORT}`));