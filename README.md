
# Project Management Platform

A full-stack Project Management Platform built using React.js, FastAPI, and Microservices Architecture. The platform helps organizations manage projects, assign tasks, collaborate with team members, monitor progress, and receive notifications.

## Project Overview

The Project Management Platform is designed to simplify project and task management within organizations.

It supports multiple user roles and provides independent microservices for authentication, organization management, project management, task management, collaboration, notifications, and analytics.

The API Gateway acts as a single entry point for communication between the frontend and backend microservices.

## Technology Stack

### Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- React Toastify
- Recharts

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- MySQL
- HTTPX
- APScheduler

### Tools
- Visual Studio Code
- Postman
- Swagger UI
- Git
- GitHub

## Architecture

The application follows a Microservices Architecture.

1. API Gateway
2. Authentication & Organization Service
3. Project Management Service
4. Task Management Service
5. Collaboration Service
6. Notification Service
7. Analytics Service

Each service handles its own responsibilities and communicates through the API Gateway or service-to-service requests.

## User Roles

### Admin
- Manage organizations.
- Manage organization members.
- View all projects.
- Access notifications.
- View analytics.

### Project Manager
- Create and manage projects.
- Add project members.
- Create and assign tasks.
- Monitor project progress.
- Collaborate with team members.

### Team Member
- View assigned projects and tasks.
- Update task status.
- Add comments.
- Receive notifications.
- Track assigned work.

## Microservices Description

### 1. API Gateway
- Provides a single entry point for frontend requests.
- Routes requests to the appropriate microservice.
- Handles request forwarding.
- Supports authentication dependencies.
- Configures frontend CORS.

### 2. Authentication & Organization Service
- User registration and login.
- JWT-based authentication.
- Current user information.
- Organization creation and management.
- Organization member management.
- Role-based access control.

### 3. Project Management Service
- Create projects.
- View project details.
- Update project information.
- Archive and delete projects.
- Assign project members.
- Track project progress.

### 4. Task Management Service
- Create and manage tasks.
- Assign tasks to team members.
- Update task status.
- Manage task dependencies.
- View task activities.
- Delete tasks.

### 5. Collaboration Service
- Create task comments.
- View task comments.
- Update comments.
- Delete comments.
- Support team collaboration.

### 6. Notification Service
- Create and send notifications.
- Send mention notifications.
- View personal notifications.
- Admin notification listing.
- View notification details.
- Retry failed notifications.
- Maintain notification delivery status.
- Schedule notifications using APScheduler.
- Send email notifications using SMTP.

### 7. Analytics Service
- Dashboard analytics.
- Project analytics.
- Team performance.
- Weekly reports.
- Monthly reports.

## Notification Status

The Notification Service supports the following statuses:

| Status | Description |
|---|---|
| PENDING | Notification waiting to be sent |
| SENT | Notification successfully sent |
| FAILED | Notification delivery failed |

Scheduled notifications are checked periodically by the background scheduler.

## Project Structure

```text
Project-Management-Platform/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── organization/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   ├── notifications/
│   │   │   └── analytics/
│   │   ├── routes/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── api-gateway/
│   ├── auth-organization-service/
│   ├── project-service/
│   ├── task-service/
│   ├── collaboration-service/
│   ├── notification-service/
│   └── analytics-service/
│
└── README.md
```

## Installation and Setup

### Prerequisites

Install the following:

- Python 3.10+
- Node.js and npm
- MySQL Server
- Git

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Project-Management-Platform
```

### 2. Backend Setup

Navigate to the required microservice directory.

```bash
cd backend/notification-service
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate the environment on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install fastapi uvicorn sqlalchemy pymysql pydantic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart email-validator httpx apscheduler
```

Create a `.env` file:

```env
NOTIFICATION_DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/notification_db

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
```

Update the environment variables according to your configuration.

Create the MySQL database:

```sql
CREATE DATABASE notification_db;
```

Start the Notification Service:

```bash
uvicorn app.main:app --reload --port 8005
```

Repeat the backend setup for the other microservices using their respective dependencies, environment variables, and ports.

### 3. Frontend Setup

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

## Service Ports

| Service | Port |
|---|---:|
| Frontend | 5173 |
| API Gateway | 8000 |
| Authentication & Organization | 8001 |
| Project Management | 8003 |
| Task Management | 8004 |
| Notification | 8005 |
| Analytics | 8006 |

The Collaboration Service port should match its configured service URL.

## API Documentation

FastAPI provides interactive API documentation through Swagger UI.

| Service | Documentation |
|---|---|
| API Gateway | http://127.0.0.1:8000/docs |
| Notification Service | http://127.0.0.1:8005/docs |

Open the corresponding service URL to explore and test available endpoints.

## Notification API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/notifications/send` | Send notification |
| POST | `/notifications/mentions` | Send mention notification |
| GET | `/notifications/` | List user notifications |
| GET | `/notifications/all` | List all notifications (Admin) |
| GET | `/notifications/{notification_id}` | Get notification details |
| POST | `/notifications/{notification_id}/retry` | Retry notification |

These endpoints are accessed through the API Gateway in the frontend.

## Authentication

The platform uses JWT-based authentication.

- Users register and log in.
- The authentication service generates access tokens.
- The frontend stores the access token.
- Axios attaches the token to authorized API requests.
- Backend services validate user authentication and roles.

## Database

The application uses MySQL with SQLAlchemy ORM.

Each microservice manages its own database configuration and models according to its responsibilities.

## Future Enhancements

- Real-time notifications using WebSockets.
- Advanced project reporting.
- Improved dashboard visualizations.
- Automated task reminders.
- File attachments for tasks and projects.
- Enhanced notification delivery monitoring.
- Expanded automated testing.
