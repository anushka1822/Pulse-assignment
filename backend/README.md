# Multi-Tenant Video CMS Backend

## Setup & Run

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Ensure your `.env` file has the following:
    ```env
    MONGO_URI=mongodb+srv://...
    JWT_SECRET=your_jwt_secret
    AWS_ACCESS_KEY_ID=your_aws_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret
    AWS_REGION=us-east-1
    AWS_BUCKET_NAME=your_bucket_name
    PORT=5000
    ```

3.  **Seed Database (Optional but Recommended)**
    Populate the DB with standard users and tenants.
    ```bash
    node scripts/seed.js
    ```
    *Note: This clears existing data.*

4.  **Start Server**
    ```bash
    npm start
    # or
    node server.js
    ```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login (returns JWT)
- `POST /api/auth/register` - Register a new user

### Tenants
- `POST /api/tenants` - Create Tenant (Admin/Dev usage)
- `GET /api/tenants` - List Tenants

### Users
- `POST /api/users` - Add user to your tenant (Requires Admin role)
- `GET /api/users` - List users in your tenant

### Videos
- `POST /api/videos/upload` - Upload video (multipart/form-data, key: `video`)
- `GET /api/videos` - List your tenant's videos
- `GET /api/videos/stream/:id` - Stream video (supports Range header)

## Testing Guide
1. Run `node scripts/seed.js`.
2. Use Postman/Insomnia.
3. Login as `admin@alpha.com` (password: `password123`).
4. Use the token to upload a video to `alpha-corp`.
5. Login as `admin@beta.com`.
6. Verify you CANNOT see the video uploaded by Alpha.
