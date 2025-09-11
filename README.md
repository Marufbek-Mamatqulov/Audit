# Audit Team - Document Management System

Django + React + OnlyOffice integration orqali audit jamoasi uchun hujjat boshqaruv tizimi.

## 🚀 Xususiyatlari

### 🔐 Autentifikatsiya
- JWT-based authentication
- Role-based access control (Admin, Manager, User)
- User profile management

### 📊 Fayllar boshqaruvi
- Excel, Word, PDF fayllarni yuklash
- Online Excel tahrirlash va ko'rish
- File permissions system
- Department-based file organization

### 👥 Foydalanuvchilar
- User management (Admin only)
- Department assignment
- Role-based permissions

### 🏢 Bo'limlar
- Department creation and management
- Hierarchical organization
- User assignment

## 🛠 Texnologiyalar

### Backend
- **Django 5.2.6** - Web framework
- **Django REST Framework** - API development
- **JWT Authentication** - Secure authentication
- **PostgreSQL/SQLite** - Database
- **OnlyOffice Integration** - Document editing

### Frontend
- **React 18** - User interface
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **TailwindCSS** - Styling
- **Heroicons** - Icons

### Key Models
- **User**: Custom user model with department assignment and roles
- **Department**: Hierarchical department structure
- **File**: Document storage with versioning and permissions
- **Permission**: Granular file access control (read/write/admin)

## 📋 Prerequisites

- Python 3.8+
- Node.js 14+
- PostgreSQL (for production)
- OnlyOffice Document Server (optional, for document editing)

## 🛠️ Installation & Setup

### Backend Setup

1. **Clone and navigate to the project**:
   ```bash
   cd "Audit team"
   ```

2. **Create and activate virtual environment**:
   ```bash
   python -m venv .venv
   # On Windows:
   .venv\Scripts\activate
   # On macOS/Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install Django djangorestframework djangorestframework-simplejwt psycopg2-binary django-cors-headers python-decouple Pillow requests
   ```

4. **Environment Configuration**:
   Create a `.env` file in the root directory:
   ```env
   SECRET_KEY=your-secret-key
   DEBUG=True
   
   # Database (PostgreSQL for production)
   DB_NAME=audit_system
   DB_USER=postgres
   DB_PASSWORD=password
   DB_HOST=localhost
   DB_PORT=5432
   
   # OnlyOffice Document Server
   ONLYOFFICE_DOCUMENT_SERVER_URL=http://localhost:8080
   ONLYOFFICE_JWT_SECRET=your-onlyoffice-secret
   ```

5. **Database Migration**:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

6. **Create Superuser**:
   ```bash
   python manage.py createsuperuser
   ```

7. **Run Development Server**:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment file** (`.env.local`):
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. **Start development server**:
   ```bash
   npm start
   ```

## 🏗️ Project Structure

### Backend Structure
```
audit_system/
├── authentication/          # User authentication & management
│   ├── models.py           # User and Permission models
│   ├── serializers.py      # API serializers
│   ├── views.py           # API views
│   └── urls.py            # URL routing
├── departments/            # Department management
├── files/                 # File management & OnlyOffice integration
├── audit_system/          # Main Django project
│   ├── settings.py        # Django settings
│   ├── urls.py           # Main URL configuration
│   └── wsgi.py           # WSGI configuration
├── manage.py              # Django management script
└── requirements.txt       # Python dependencies
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Layout.tsx     # Main layout with sidebar
│   │   ├── ProtectedRoute.tsx # Route protection
│   │   └── OnlyOfficeEditor.tsx # Document editor
│   ├── pages/            # Page components
│   │   ├── LoginPage.tsx
│   │   ├── Dashboard.tsx
│   │   └── ...
│   ├── store/            # Redux store
│   │   ├── index.ts      # Store configuration
│   │   └── slices/       # Redux slices
│   ├── services/         # API services
│   │   └── api.ts        # Axios configuration
│   ├── hooks/            # Custom hooks
│   └── App.tsx           # Main App component
├── public/               # Static assets
├── package.json          # Node.js dependencies
└── tailwind.config.js    # TailwindCSS configuration
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/logout/` - User logout
- `GET /api/auth/profile/` - Get user profile
- `POST /api/auth/change-password/` - Change password

### Users
- `GET /api/auth/users/` - List users
- `GET /api/auth/users/{id}/` - Get user details
- `PATCH /api/auth/users/{id}/` - Update user

### Departments
- `GET /api/departments/` - List departments
- `POST /api/departments/` - Create department
- `GET /api/departments/tree/` - Get department tree
- `GET /api/departments/{id}/stats/` - Get department statistics

### Files
- `GET /api/files/` - List files
- `POST /api/files/` - Upload file
- `GET /api/files/{id}/` - Get file details
- `GET /api/files/{id}/onlyoffice-config/` - Get OnlyOffice config
- `POST /api/files/{id}/lock/` - Lock/unlock file

## 🔐 Authentication & Authorization

### Roles
- **Admin**: Full system access, user management, department management
- **Manager**: Department management, user management within department
- **User**: File access based on permissions

### Permissions
- **Read**: View file content
- **Write**: Edit and modify files
- **Admin**: Full file management including permissions

## 📝 OnlyOffice Integration

The system integrates with OnlyOffice Document Server for real-time collaborative editing:

1. **Document Opening**: Files are served through OnlyOffice with proper permissions
2. **Collaborative Editing**: Multiple users can edit simultaneously
3. **Version Control**: Changes are automatically versioned
4. **Lock Management**: Files are locked during editing sessions

### OnlyOffice Setup (Optional)

1. Install OnlyOffice Document Server
2. Configure the server URL in environment variables
3. Set JWT secret for secure communication

## 🚀 Deployment

### Backend Deployment (Production)

1. **Configure PostgreSQL**:
   - Update database settings in `settings.py`
   - Set `DEBUG=False` in production

2. **Static Files**:
   ```bash
   python manage.py collectstatic
   ```

3. **WSGI Server** (e.g., Gunicorn):
   ```bash
   pip install gunicorn
   gunicorn audit_system.wsgi:application
   ```

### Frontend Deployment

1. **Build for production**:
   ```bash
   npm run build
   ```

2. **Serve static files** (nginx, Apache, or CDN)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support or questions, please contact the development team.

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and credentials are correct
2. **CORS Errors**: Check `CORS_ALLOWED_ORIGINS` in Django settings
3. **File Upload**: Verify `MEDIA_ROOT` and `MEDIA_URL` settings
4. **OnlyOffice**: Ensure Document Server is running and accessible

### Development Tips

- Use SQLite for development (default configuration)
- Enable Django Debug Toolbar for API debugging
- Use React DevTools for frontend debugging
- Check browser console for JavaScript errors
