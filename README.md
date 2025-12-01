# E-Bugema - Full-Stack Digital Library Management System

A modern, feature-rich e-library management system built with Django REST Framework and React, featuring cloud-based file storage with Cloudinary, PostgreSQL database on NEON, and a beautiful, responsive UI with advanced reading capabilities.

## ✨ Features

### 📚 Core Features
- **Digital Book Management**: Upload, categorize, and manage books in PDF format
- **Online Reading**: Read books directly in the browser with progress tracking
- **Cloud Storage**: Secure file storage and delivery via Cloudinary CDN
- **JWT Authentication**: Secure token-based authentication with automatic refresh
- **Advanced Search**: Full-text search with filtering and sorting
- **Personal Library**: Like, bookmark, and track reading progress
- **Analytics Dashboard**: Comprehensive analytics for users and administrators

### 👥 User Features
- **Reading Progress Tracking**: Automatic tracking of reading progress with page location and completion percentage
- **Personal Dashboard**: View reading history, in-progress books, completed books, and statistics
- **Book Interaction**: Like, bookmark, and organize favorite books
- **Reading Statistics**: Track reading time, pages read, and reading goals
- **Responsive Reader**: Optimized PDF reader with zoom and navigation controls

### 🔧 Admin Features
- **Book Management**: Full CRUD operations for books and categories
- **User Management**: View and manage user accounts with role-based access
- **Rich Analytics**: 
  - Most read books and trending content
  - User activity and engagement metrics
  - Popular categories and search terms
  - Peak usage time analysis with interactive charts
- **Content Moderation**: Control book visibility and manage content

### 🔒 Technical Features
- **Security**: JWT token rotation, role-based permissions, secure file streaming
- **Cloud Infrastructure**: Cloudinary for file storage, NEON PostgreSQL database
- **Real-time Updates**: Optimistic UI updates with TanStack Query
- **Modern UI**: Beautiful, accessible design with dark mode support
- **Performance**: Optimized with caching (Redis), pagination, and lazy loading

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2.7 + Django REST Framework 3.14.0
- **Database**: PostgreSQL (NEON Cloud Database)
- **File Storage**: Cloudinary (Cloud-based media storage and CDN)
- **Authentication**: JWT with djangorestframework-simplejwt 5.3.0
- **Caching**: Redis 5.0.1
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)
- **Rate Limiting**: django-ratelimit
- **Web Server**: Gunicorn with WhiteNoise for static files
- **Additional Libraries**:
  - `django-cors-headers` - CORS handling
  - `django-filter` - Advanced filtering
  - `psycopg[binary]` - PostgreSQL adapter
  - `python-dotenv` - Environment variable management
  - `Pillow` - Image processing

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.5.4
- **Build Tool**: Vite 5.4.0 (Fast, modern build tool)
- **Routing**: React Router v6.26.2
- **Styling**: TailwindCSS 3.4.10 with custom design system
- **State Management**: Zustand 4.5.5 (Lightweight state management)
- **Data Fetching**: TanStack Query (React Query) 5.40.0
- **HTTP Client**: Axios 1.7.3
- **Form Handling**: React Hook Form 7.51.3 with Zod validation
- **Charts**: Recharts 2.10.4 (for analytics visualization)
- **Notifications**: react-hot-toast 2.4.1
- **Icons**: Lucide React 0.469.0
- **Utilities**: 
  - `clsx` - Conditional className utility
  - `date-fns` - Date formatting and manipulation

### Infrastructure & DevOps
- **Deployment**: Vercel (Frontend), Render/Railway (Backend)
- **Database Hosting**: NEON (Serverless PostgreSQL)
- **File Storage**: Cloudinary (Cloud-based CDN)
- **Caching**: Redis (for rate limiting and session management)
- **Version Control**: Git

## 📁 Project Structure

```
E-bugema/
│
├── backend/                          # Django REST API
│   ├── elibrary/                     # Django project configuration  
│   │   ├── __init__.py
│   │   ├── settings.py               # Settings (DB, Cloudinary, JWT, CORS)
│   │   ├── urls.py                   # Main URL configuration
│   │   ├── wsgi.py                   # WSGI configuration
│   │   └── asgi.py                   # ASGI configuration
│   │
│   ├── accounts/                     # User authentication & management
│   │   ├── models.py                 # Custom User model
│   │   ├── serializers.py            # User/auth serializers
│   │   ├── views.py                  # Auth endpoints (login, register, etc.)
│   │   ├── urls.py                   # Auth routes
│   │   └── permissions.py            # Custom permissions
│   │
│   ├── catalog/                      # Books and categories management
│   │   ├── models.py                 # Book, Category, Author models
│   │   ├── serializers.py            # Catalog serializers
│   │   ├── views.py                  # Book CRUD, search, filtering
│   │   ├── urls.py                   # Catalog routes
│   │   └── utils.py                  # Helper functions
│   │
│   ├── reading/                      # Reading progress tracking
│   │   ├── models.py                 # ReadingProgress model
│   │   ├── serializers.py            # Progress serializers
│   │   ├── views.py                  # Progress tracking endpoints
│   │   ├── urls.py                   # Reading routes
│   │   └── utils.py                  # Progress calculation utilities
│   │
│   ├── analytics/                    # Analytics and event tracking
│   │   ├── models.py                 # AnalyticsEvent model
│   │   ├── serializers.py            # Analytics serializers
│   │   ├── views.py                  # Analytics endpoints
│   │   ├── urls.py                   # Analytics routes
│   │   └── middleware.py             # Request tracking middleware
│   │
│   ├── manage.py                     # Django management script
│   ├── requirements.txt              # Python dependencies
│   ├── runtime.txt                   # Python version specification
│   ├── build.sh                      # Build script for deployment
│   ├── seed.py                       # Database seeding script
│   └── env.example.txt               # Environment variables template
│
├── frontend/                         # React Frontend Application
│   ├── src/
│   │   ├── app/                      # Application pages and layouts
│   │   │   ├── layouts/              # Layout components
│   │   │   │   ├── MainLayout.tsx    # Main user layout
│   │   │   │   ├── AdminLayout.tsx   # Admin dashboard layout
│   │   │   │   └── AuthLayout.tsx    # Authentication pages layout
│   │   │   │
│   │   │   └── pages/                # Page components
│   │   │       ├── HomePage.tsx      # Landing/home page
│   │   │       ├── LoginPage.tsx     # User login
│   │   │       ├── RegisterPage.tsx  # User registration
│   │   │       ├── CatalogPage.tsx   # Book catalog with search
│   │   │       ├── BookDetailPage.tsx# Individual book details
│   │   │       ├── ReaderPage.tsx    # PDF reader
│   │   │       ├── DashboardPage.tsx # User dashboard
│   │   │       ├── ProfilePage.tsx   # User profile
│   │   │       └── admin/            # Admin pages
│   │   │           ├── AdminOverviewPage.tsx  # Analytics overview
│   │   │           ├── AdminBooksPage.tsx     # Book management
│   │   │           ├── AdminUsersPage.tsx     # User management
│   │   │           └── AdminCategoriesPage.tsx# Category management
│   │   │
│   │   ├── components/               # Reusable UI components
│   │   │   ├── cards/                # Card components
│   │   │   │   └── StatCard.tsx      # Statistics card with icons
│   │   │   ├── catalog/              # Catalog-specific components
│   │   │   │   └── BookCard.tsx      # Book card display
│   │   │   ├── feedback/             # User feedback components
│   │   │   │   └── LoadingOverlay.tsx# Loading indicator
│   │   │   ├── forms/                # Form components
│   │   │   ├── HamburgerMenu.tsx     # Mobile navigation menu
│   │   │   ├── ProfileDropdown.tsx   # User profile dropdown
│   │   │   ├── ThemeToggle.tsx       # Dark/light mode toggle
│   │   │   └── ProtectedRoute.tsx    # Route protection wrapper
│   │   │
│   │   ├── lib/                      # Core utilities and configurations
│   │   │   ├── api/                  # API client modules
│   │   │   │   ├── client.ts         # Axios client with interceptors
│   │   │   │   ├── auth.ts           # Authentication API calls
│   │   │   │   ├── catalog.ts        # Catalog API calls
│   │   │   │   ├── reading.ts        # Reading progress API
│   │   │   │   └── analytics.ts      # Analytics API calls
│   │   │   │
│   │   │   ├── store/                # Zustand state stores
│   │   │   │   └── auth.ts           # Authentication state
│   │   │   │
│   │   │   └── types/                # TypeScript type definitions
│   │   │       └── index.ts          # Shared type definitions
│   │   │
│   │   ├── hooks/                    # Custom React hooks
│   │   │   └── useAutoRefreshToken.ts# Auto token refresh hook
│   │   │
│   │   ├── routes/                   # Routing configuration
│   │   │   └── AppRoutes.tsx         # Main app routes
│   │   │
│   │   ├── styles/                   # Global styles
│   │   │   └── globals.css           # Tailwind + custom styles
│   │   │
│   │   ├── App.tsx                   # Root App component
│   │   └── main.tsx                  # Application entry point
│   │
│   ├── public/                       # Static assets
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Node dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── vite.config.ts                # Vite build configuration
│   ├── postcss.config.js             # PostCSS configuration
│   └── .env.example                  # Frontend environment variables template
│
├── .git/                             # Git repository
├── README.md                         # This file
├── render.yaml                       # Render deployment configuration
└── setup.sh                          # Setup script
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- Node.js 18+ and npm
- PostgreSQL database (or NEON account)
- Cloudinary account
- Redis (optional, for caching)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd E-bugema/backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv .venv
   
   # On Windows
   .venv\Scripts\activate
   
   # On Linux/Mac
   source .venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   SECRET_KEY=your-secret-key-here
   DEBUG=True
   
   # Database (NEON PostgreSQL)
   DATABASE_URL=postgresql://username:password@host/database?sslmode=require
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   
   # JWT Configuration
   JWT_ACCESS_TOKEN_LIFETIME=900
   JWT_REFRESH_TOKEN_LIFETIME=604800
   
   # CORS Configuration
   CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000
   
   # Redis (optional)
   REDIS_URL=redis://127.0.0.1:6379/1
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Seed the database (optional)**
   ```bash
   python seed.py
   ```

8. **Run the development server**
   ```bash
   python manage.py runserver
   ```

   Backend API will be available at: `http://localhost:8000/api`
   Admin panel: `http://localhost:8000/admin`
   API documentation: `http://localhost:8000/api/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `frontend/` directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at: `http://localhost:5173`

## 📚 API Documentation

The API documentation is automatically generated and available at `/api/docs` when running the backend server.

### Main API Endpoints

#### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login (returns access & refresh tokens)
- `POST /api/auth/token/refresh/` - Refresh access token
- `GET /api/auth/me/` - Get current user profile
- `PATCH /api/auth/me/` - Update user profile
- `POST /api/auth/logout/` - User logout

#### Catalog
- `GET /api/catalog/categories/` - List all categories
- `GET /api/catalog/books/` - List books (supports search, filtering, pagination)
- `GET /api/catalog/books/{id}/` - Get book details
- `GET /api/catalog/books/{id}/cover/` - Get book cover image
- `GET /api/catalog/books/{id}/read/stream/` - Stream book file (secure)
- `POST /api/catalog/books/{id}/like/` - Toggle book like
- `POST /api/catalog/books/{id}/bookmark/` - Toggle book bookmark

#### Admin (Requires Admin Role)
- `POST /api/catalog/books/` - Create a new book
- `PATCH /api/catalog/books/{id}/` - Update book details
- `DELETE /api/catalog/books/{id}/` - Delete a book
- `GET /api/admin/users/` - List all users
- `POST /api/catalog/categories/` - Create category
- `PATCH /api/catalog/categories/{id}/` - Update category

#### Reading Progress
- `GET /api/reading/progress/{book_id}/` - Get reading progress for a book
- `PATCH /api/reading/progress/{book_id}/` - Update reading progress
- `GET /api/reading/dashboard/` - Get user's dashboard data

#### Analytics
- `GET /api/analytics/admin/overview/` - Admin analytics overview (charts, stats)
- `GET /api/analytics/user/stats/` - User reading statistics

## 🔧 Configuration

### Cloudinary Setup

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret from the dashboard
3. Add credentials to your `.env` file
4. Files will be automatically uploaded to Cloudinary when books are created

### NEON PostgreSQL Setup

1. Create a NEON account at [neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string
4. Add to `DATABASE_URL` in your `.env` file

### Redis Setup (Optional but Recommended)

Redis is used for caching and rate limiting:

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install locally
# Windows: Download from https://redis.io/download
# Mac: brew install redis
# Linux: sudo apt-get install redis-server
```

## 🎨 Design System

The frontend features a modern, premium design system:

- **Color Palette**: Vibrant blues, emeralds, violets, ambers, and roses
- **Background**: Soft gray (slate-50) for reduced eye strain
- **Typography**: Inter font family with responsive scaling
- **Components**: Glassmorphism effects, gradient buttons, smooth animations
- **Dark Mode**: Full dark mode support with optimized colors
- **Accessibility**: WCAG AA compliant, keyboard navigation

## 🚀 Deployment

### Backend Deployment (Render/Railway)

1. **Push code to GitHub**
2. **Connect to Render/Railway**
3. **Set environment variables**:
   - All variables from `.env` template
   - Set `DEBUG=False`
   - Set proper `CORS_ALLOWED_ORIGINS`
4. **Deploy**: Platform will automatically run `build.sh`

### Frontend Deployment (Vercel)

1. **Push code to GitHub**
2. **Import project to Vercel**
3. **Configure**:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
4. **Set environment variable**: `VITE_API_URL=<your-backend-url>/api`
5. **Deploy**

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with automatic rotation
- **Role-Based Access Control**: Separate admin and user permissions
- **Secure File Streaming**: Cloudinary signed URLs with expiration
- **Rate Limiting**: Protection against API abuse
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Comprehensive validation on all endpoints
- **SQL Injection Protection**: Django ORM prevents SQL injection
- **XSS Protection**: React automatically escapes output

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🎯 Roadmap

- [ ] Advanced reading features (annotations, highlights, bookmarks with notes)
- [ ] Social features (reviews, ratings, book discussions)
- [ ] Reading challenges and achievement badges
- [ ] Personalized AI-powered book recommendations
- [ ] Offline reading support (PWA)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and export features
- [ ] Multi-language support
- [ ] EPUB reading support
- [ ] Audio book support

## 🆘 Support

For questions and support:
- Create an issue in the repository
- Email: support@e-bugema.com

---

**Built with ❤️ using Django, React, PostgreSQL, and Cloudinary**