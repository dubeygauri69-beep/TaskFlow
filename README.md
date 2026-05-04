# Team Task Manager - TaskFlow

A production-ready full-stack web application for managing team projects and tasks with role-based access control.

---

## 1. Installation Steps

### Prerequisites

- Node.js v18 or higher (download from https://nodejs.org)
- npm v9 or higher (comes with Node.js)
- A MongoDB Atlas account (free tier is enough) or a local MongoDB installation

### Verify Prerequisites

```bash
node --version    # Should output v18.x.x or higher
npm --version     # Should output 9.x.x or higher
```

### Step 1: Clone or download the project

```bash
# Navigate into the project directory
cd app_1
```

### Step 2: Set up the Backend

```bash
cd backend

# Install all backend dependencies
npm install

# Copy the environment variables example file
copy .env.example .env       # Windows
# or
cp .env.example .env         # macOS / Linux

# Edit .env with your actual values (see section 7 below)
```

### Step 3: Set up the Frontend

```bash
cd ../frontend

# Install all frontend dependencies
npm install

# Copy the environment variables example file
copy .env.example .env       # Windows
# or
cp .env.example .env         # macOS / Linux
```

---

## 2. Dependencies

### Backend Dependencies

```bash
npm install express cors dotenv jsonwebtoken bcryptjs mongoose express-validator
```

| Package | Version | Purpose |
|---------|---------|---------|
| express | ^4.19.2 | Web framework |
| cors | ^2.8.5 | Cross-Origin Resource Sharing |
| dotenv | ^16.4.5 | Environment variable management |
| jsonwebtoken | ^9.0.2 | JWT creation and verification |
| bcryptjs | ^2.4.3 | Password hashing |
| mongoose | ^8.4.0 | MongoDB ODM |
| express-validator | ^7.1.0 | Request validation |

```bash
# Dev dependencies
npm install --save-dev nodemon
```

| Package | Version | Purpose |
|---------|---------|---------|
| nodemon | ^3.1.3 | Auto-restart server on file changes |

### Frontend Dependencies

```bash
npm install react react-dom react-router-dom axios react-hot-toast date-fns
```

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | React DOM renderer |
| react-router-dom | ^6.23.1 | Client-side routing |
| axios | ^1.7.2 | HTTP client |
| react-hot-toast | ^2.4.1 | Toast notifications |
| date-fns | ^3.6.0 | Date formatting utilities |

```bash
# Dev dependencies
npm install --save-dev vite @vitejs/plugin-react tailwindcss postcss autoprefixer
```

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.2.13 | Build tool and dev server |
| @vitejs/plugin-react | ^4.3.0 | React plugin for Vite |
| tailwindcss | ^3.4.4 | Utility-first CSS framework |
| postcss | ^8.4.38 | CSS transformation |
| autoprefixer | ^10.4.19 | CSS vendor prefixes |

---

## 3. Project Structure

```
app_1/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # MongoDB connection
│   │   ├── controllers/
│   │   │   ├── authController.js       # Signup, login, me
│   │   │   ├── projectController.js    # Project CRUD + members
│   │   │   ├── taskController.js       # Task CRUD
│   │   │   ├── dashboardController.js  # Dashboard stats
│   │   │   └── userController.js       # User listing
│   │   ├── middleware/
│   │   │   ├── auth.js                 # JWT protect + restrictTo
│   │   │   └── validate.js             # express-validator handler
│   │   ├── models/
│   │   │   ├── User.js                 # User schema
│   │   │   ├── Project.js              # Project schema
│   │   │   └── Task.js                 # Task schema
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── projects.js
│   │   │   ├── tasks.js
│   │   │   ├── dashboard.js
│   │   │   └── users.js
│   │   └── server.js                   # Express entry point
│   ├── .env.example
│   ├── .gitignore
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── axios.js                # Axios instance + interceptors
    │   │   └── services.js             # API service functions
    │   ├── components/
    │   │   ├── Badge.jsx               # Status / Priority / Role badges
    │   │   ├── Layout.jsx              # App shell with sidebar
    │   │   ├── Modal.jsx               # Reusable modal
    │   │   ├── ProtectedRoute.jsx      # Auth + role route guards
    │   │   ├── Sidebar.jsx             # Navigation sidebar
    │   │   └── Spinner.jsx             # Loading spinner
    │   ├── context/
    │   │   └── AuthContext.jsx         # Auth state + hooks
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── ProjectsPage.jsx
    │   │   ├── NewProjectPage.jsx
    │   │   ├── ProjectDetailPage.jsx
    │   │   ├── MyTasksPage.jsx
    │   │   └── NotFoundPage.jsx
    │   ├── App.jsx                     # Routes definition
    │   ├── main.jsx                    # React entry point
    │   └── index.css                   # Tailwind + global styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── .env.example
    ├── .gitignore
    └── package.json
```

---

## 4. Backend Code Overview

The backend is a REST API built with Express.js and MongoDB (via Mongoose).

### Authentication Flow
1. User registers via POST /api/auth/signup - password is hashed with bcryptjs
2. User logs in via POST /api/auth/login - receives a signed JWT
3. All protected routes use the `protect` middleware to verify the JWT
4. Role-based routes additionally use the `restrictTo('admin')` middleware

### Key Design Decisions
- Passwords are hashed before saving using a pre-save Mongoose hook
- The `password` field is excluded from all queries by default (`select: false`)
- The `isOverdue` computed property on tasks is a Mongoose virtual field
- All validation is done with `express-validator` before reaching controllers
- A centralized error handler in `server.js` catches Mongoose, JWT, and app errors

---

## 5. Frontend Code Overview

The frontend is built with React 18, React Router v6, Axios, and Tailwind CSS.

### State Management
- Authentication state is managed via React Context (`AuthContext`)
- Component-local state handles UI interactions and data fetching
- No external state management library is required for this scope

### Routing Architecture
- `PublicRoute` - accessible only when NOT logged in (login, signup)
- `ProtectedRoute` - requires a valid JWT token
- `AdminRoute` - requires admin role in addition to authentication

### API Integration
- All API calls go through a central Axios instance in `src/api/axios.js`
- A request interceptor attaches the JWT Bearer token automatically
- A response interceptor handles 401 errors globally and redirects to login

---

## 6. Database Schema

### Users Collection

```
{
  _id:       ObjectId,
  name:      String (required, 2-50 chars),
  email:     String (required, unique, lowercase),
  password:  String (required, hashed, hidden from queries),
  role:      String (enum: 'admin' | 'member', default: 'member'),
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection

```
{
  _id:         ObjectId,
  name:        String (required, 2-100 chars),
  description: String (max 500 chars),
  owner:       ObjectId -> Users,
  members:     [ObjectId] -> Users,
  status:      String (enum: 'active' | 'archived', default: 'active'),
  createdAt:   Date,
  updatedAt:   Date
}
```

### Tasks Collection

```
{
  _id:         ObjectId,
  title:       String (required, 2-150 chars),
  description: String (max 1000 chars),
  project:     ObjectId -> Projects (required),
  assignedTo:  ObjectId -> Users (nullable),
  createdBy:   ObjectId -> Users (required),
  status:      String (enum: 'pending' | 'in-progress' | 'completed', default: 'pending'),
  priority:    String (enum: 'low' | 'medium' | 'high', default: 'medium'),
  deadline:    Date (nullable),
  createdAt:   Date,
  updatedAt:   Date,
  isOverdue:   Boolean (virtual - computed from deadline + status)
}
```

### Relationships

```
Users     1 --< Projects   (owner)
Users     *--*  Projects   (members)
Projects  1 --< Tasks      (project)
Users     1 --< Tasks      (assignedTo, createdBy)
```

---

## 7. API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | /api/auth/signup | Public | Register a new user |
| POST | /api/auth/login | Public | Login and receive JWT |
| GET | /api/auth/me | Protected | Get current user profile |

### Projects

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/projects | Protected | List projects for current user |
| POST | /api/projects | Admin | Create a new project |
| GET | /api/projects/:id | Protected | Get project details with tasks |
| PUT | /api/projects/:id | Admin (owner) | Update project |
| DELETE | /api/projects/:id | Admin (owner) | Delete project and its tasks |
| POST | /api/projects/:id/members | Admin (owner) | Add a member by email |
| DELETE | /api/projects/:id/members/:userId | Admin (owner) | Remove a member |

### Tasks

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/tasks | Protected | Get all tasks assigned to me |
| GET | /api/tasks/project/:projectId | Member | List tasks for a project |
| POST | /api/tasks/project/:projectId | Admin (owner) | Create a task |
| GET | /api/tasks/project/:projectId/:id | Member | Get a single task |
| PUT | /api/tasks/project/:projectId/:id | Member (own) | Update task (members: status only) |
| DELETE | /api/tasks/project/:projectId/:id | Admin (owner) | Delete a task |

### Dashboard

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/dashboard | Protected | Get stats for current user |

### Users

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/users | Admin | List all users |
| GET | /api/users/:id | Protected | Get a single user |

### Health Check

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | /api/health | Public | Check if API is running |

---

## 8. Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/teamtaskmanager?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.up.railway.app
```

### Frontend (.env)

```env
VITE_API_URL=https://your-backend-domain.up.railway.app/api
```

---

## 9. Running the Application Locally

### Start the Backend

```bash
cd backend

# Development mode (with auto-restart)
npm run dev

# The API will be running at: http://localhost:5000
# Test it: http://localhost:5000/api/health
```

### Start the Frontend

Open a new terminal window:

```bash
cd frontend

npm run dev

# The app will be running at: http://localhost:5173
```

---

## 10. Deployment Steps (Railway)

Railway (https://railway.app) supports deploying both backend and frontend from a single repository.

### Step 1: Prepare MongoDB

1. Go to https://cloud.mongodb.com and create a free cluster
2. Under "Database Access", create a user with read/write permissions
3. Under "Network Access", add IP address `0.0.0.0/0` (allow all)
4. Get your connection string from "Connect > Drivers" - it looks like:
   `mongodb+srv://username:password@cluster.mongodb.net/teamtaskmanager`

### Step 2: Deploy the Backend on Railway

1. Go to https://railway.app and create a new project
2. Click "New Service" and choose "GitHub Repo" (or "Empty Service")
3. Set the root directory to `/backend`
4. Set the start command to: `npm start`
5. Add the following environment variables in the Railway dashboard:
   ```
   PORT=5000
   MONGODB_URI=<your MongoDB Atlas connection string>
   JWT_SECRET=<a long random secret string>
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   FRONTEND_URL=<your frontend Railway URL - add this after deploying frontend>
   ```
6. Railway will auto-detect and run `npm install` then `npm start`
7. Note the generated backend URL (e.g., `https://your-app.up.railway.app`)

### Step 3: Deploy the Frontend on Railway

1. In the same Railway project, click "New Service" again
2. Set the root directory to `/frontend`
3. Set the build command to: `npm run build`
4. Set the start command to: `npx serve dist -p $PORT`
   (or use Railway's static site hosting)
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.up.railway.app/api
   ```
6. Deploy

### Step 4: Update CORS

Go back to the backend service and update:
```
FRONTEND_URL=https://your-frontend-url.up.railway.app
```

Then redeploy the backend.

### Alternative: Use railway.toml

Create a `railway.toml` in the backend directory for explicit config:

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3
```

---

## 11. Role Permissions Summary

| Feature | Admin | Member |
|---------|-------|--------|
| Create project | Yes | No |
| Delete project | Yes (own) | No |
| Add/remove members | Yes (own project) | No |
| Create tasks | Yes (own project) | No |
| Delete tasks | Yes (own project) | No |
| Edit all task fields | Yes | No |
| Update task status | Yes | Yes (own tasks) |
| View project details | Yes | Yes (member of) |
| View dashboard stats | Yes (owned) | Yes (assigned) |

---

## 12. Testing the API

Once the backend is running, you can test with curl or Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Register as admin
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Admin","email":"admin@example.com","password":"password123","role":"admin"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'

# Use the token from login response for protected routes
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer <your_token_here>"
```
