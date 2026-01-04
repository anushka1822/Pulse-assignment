# Pulse CMS - Video Management & Hosting Platform

A professional full-stack multi-tenant application for secure video upload, AI-powered sensitivity analysis, and seamless streaming.
---

## 🎥 Project Demo

You can view a complete walkthrough of the application functionality here:
[**Watch Demo Video**](https://drive.google.com/file/d/1y416EppEsduyVAZY5YjvTHUsL5-WtVas/view?usp=sharing)

---
## 🚀 Overview

Pulse CMS is designed as a robust solution for organizations to manage their video content with built-in safety checks. It features a modern dark-themed UI, real-time processing updates via Socket.io, and a secure multi-tenant architecture.

---

## 🏛️ Architecture Overview

The system follows a modular **MERN** stack architecture:

- **Frontend**: React.js with Vite, Tailwind CSS for styling, and Socket.io-client for real-time events.
- **Backend**: Node.js & Express.js REST API.
- **Database**: MongoDB (Mongoose ODM) for storing metadata, users, and tenant information.
- **Real-time Layer**: Socket.io for live upload and processing progress.
- **Storage**: AWS S3 for secure, scalable video hosting.
- **Processing**: Simulated AI moderation pipeline for sensitivity detection.

---

## 🛠️ Tech Stack

### Backend
- **Node.js**: v18+
- **Express**: Web framework
- **MongoDB**: Primary database
- **Socket.io**: Real-time communication
- **JWT**: Secure Authentication
- **Multer / Multer-S3**: File upload handling
- **AWS SDK (v3)**: S3 integration for storage

### Frontend
- **React**: UI Library
- **Vite**: Build tool
- **Tailwind CSS**: Modern styling
- **Context API**: Global state management (Auth)
- **Lucide React**: Iconography
- **Axios**: API client

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js installed
- MongoDB instance (Local or Atlas)

### 1. Clone the repository
```bash
git clone <repository-url>
cd Pulse
```

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_REGION=your_region
   AWS_BUCKET_NAME=your_bucket
   ```
4. Start the server:
   ```bash
   node server.js
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔐 Role-Based Access Control (RBAC)

The system supports three distinct roles:

1. **Super Admin**: 
   - Manage all tenants (Create/Delete)
   - Manage users across all organizations
   - Oversee AI Moderation queue and purge flagged content
2. **Editor**: 
   - Upload new videos
   - Edit their own video metadata
   - Publish/Unpublish videos
3. **Viewer**: 
   - Read-only access to published videos within their tenant

---
## 🔑 Authentication & Testing Credentials

Use the following credentials to explore the multi-tenant features. All accounts use the common password:**`password123`**

| Organization | Role | Email |
| :--- | :--- | :--- |
| **System** | Super Admin | `super@admin.com` |
| **Alpha Corp** | Editor | `editor@alpha.com` |
| **Alpha Corp** | Viewer | `viewer@alpha.com` |
| **Beta Corp** | Editor | `editor@beta.com` |
| **Pulse Corp** | Editor | `editor@pulse.com` |
| **Pulse Corp** | Viewer | `viewer@alpha.com` |

---
## 📖 User Manual

### Login
Users can log in using their email and password. The system automatically identifies the tenant and role associated with the account.

### Uploading Videos (Editor)
1. Go to the **Upload** page.
2. Drag and drop a video file or click to select.
3. Enter a title.
4. Watch real-time progress as the video is uploaded and processed for sensitivity.

### Managing Content (Editor)
- Use the **Dashboard** to see all videos.
- Toggle visibility (Publish/Unpublish).
- Deletion is available for non-flagged content.

### Moderation (Admin)
- Admins can access the **Moderation Tab** in the Admin Portal.
- Flagged videos (Insensitive/Abusive) must be reviewed.
- Admin can either **Allow** (override flags) or **Remove** the content.

---

## 📡 API Documentation

### Authentication
- `POST /api/auth/login`: Authenticate user and return JWT.
- `POST /api/auth/register`: Create a new user (Admin/Editor/Viewer).

### Videos
- `GET /api/videos`: List videos (filtered by tenant/role).
- `POST /api/videos/upload`: Upload video file and metadata.
- `GET /api/videos/stream/:videoId`: Stream video using HTTP Range requests.
- `DELETE /api/videos/:videoId`: Delete a video.
- `PATCH /api/videos/:videoId/publish`: Toggle publish status.

### Admin
- `GET /api/admin/tenants`: List all organizations.
- `POST /api/admin/tenants`: Create a new tenant.
- `GET /api/admin/moderation`: Fetch flagged videos pending review.

---

## 🧠 Assumptions & Design Decisions

1. **Cloud Native Storage**: Leverages AWS S3 for high availability and durability, avoiding local filesystem limitations.
2. **Multi-Tenancy**: Tenant isolation is enforced at the database query level using `tenantId`.
3. **Streaming**: Implemented using AWS S3 `GetObjectCommand` with support for `Range` headers to allow seeking in the player.
3. **Simulated AI**: To demonstrate the workflow, a simulated sensitivity analysis runs post-upload, flagging content based on keywords or random triggers for demonstration purposes.
4. **Security**: JWT is used for session management, and sensitive routes are protected by role-verification middleware.

---

## ✅ Deliverables Checklist

- [x] Full-Stack Architecture (Node/React)
- [x] Multi-Tenant Isolation
- [x] Video Upload & Processing Pipeline
- [x] HTTP Range-based Streaming
- [x] Real-time Progress (Socket.io)
- [x] Comprehensive README & User Manual
- [x] AI Moderation Workflow
