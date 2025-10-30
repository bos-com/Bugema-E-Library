# E-Library - Full-Stack Digital Library Management System

A comprehensive e-library management system built with Django REST Framework and React, featuring MongoDB for data storage, JWT authentication, and advanced reading capabilities with PDF/EPUB support.

## 🚀 Features

### Core Features
- **Digital Book Management**: Upload, categorize, and manage books in PDF and EPUB formats
- **Online Reading**: Read books directly in the browser with progress tracking
- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Search & Discovery**: Full-text search with MongoDB text indexes and search suggestions
- **Personal Library**: Like, bookmark, and track reading progress
- **Analytics Dashboard**: Comprehensive analytics for both users and administrators

### User Features
- **Reading Progress**: Track reading progress with page/CFI location and completion percentage
- **Personal Dashboard**: View reading history, in-progress books, completed books, and statistics
- **Book Management**: Like, bookmark, and organize favorite books
- **Reading Statistics**: Track reading time, pages read, and reading streaks

### Admin Features
- **Book Management**: CRUD operations for books and categories
- **User Management**: View and manage user accounts
- **Analytics**: Comprehensive analytics including most read books, popular categories, and user activity
- **Content Moderation**: Hide/unhide books and manage content visibility

### Technical Features
- **Security**: JWT token rotation, role-based permissions, signed URLs for file access
- **File Storage**: MongoDB GridFS for efficient file storage and streaming
- **Responsive Design**: Mobile-first responsive design with dark mode support
- **Real-time Updates**: Optimistic UI updates with React Query
- **Accessibility**: Keyboard navigation and screen reader support

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Database**: MongoDB with MongoEngine ODM
- **Authentication**: JWT with django-rest-framework-simplejwt
- **File Storage**: MongoDB GridFS
- **API Documentation**: drf-spectacular (OpenAPI/Swagger)
- **Rate Limiting**: django-ratelimit

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **HTTP Client**: Axios
- **PDF Reading**: react-pdf (PDF.js)
- **EPUB Reading**: epubjs
- **Notifications**: react-hot-toast

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Web Server**: Nginx (production)
- **Database**: MongoDB 7.0

## 📁 Project Structure

```
elibrary/
├── backend/                 # Django backend
│   ├── elibrary/           # Django project settings
│   ├── accounts/           # User authentication
│   ├── catalog/            # Books and categories
│   ├── reading/            # Reading progress tracking
│   ├── analytics/          # Analytics and event logging
│   ├── manage.py
│   ├── requirements.txt
│   ├── seed.py            # Database seeding script
│   └── Dockerfile
├── frontend/               # React frontend
│   ├── src/
│   │   ├── app/           # Pages, layouts, components
│   │   ├── lib/           # API client, stores, utilities
│   │   ├── types/         # TypeScript type definitions
│   │   └── main.tsx
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml      # Development environment
└── README.md
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd elibrary
   ```

2. **Start the services**
   ```bash
   docker-compose up -d
   ```

3. **Seed the database**
   ```bash
   docker-compose exec backend python seed.py
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000/api
   - API Documentation: http://localhost:8000/api/docs
   - MongoDB: localhost:27017

### Local Development

#### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate #On Linux
   venv\Scripts\activate #On windows
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB** (using Docker)
   ```bash
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   ```

6. **Run migrations and seed data**
   ```bash
   python seed.py
   ```

7. **Start the development server**
   ```bash
   python manage.py runserver
   ```

#### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
SECRET_KEY=your-secret-key-here
DEBUG=True
MONGODB_URI=mongodb://localhost:27017/elibrary
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
JWT_ACCESS_TOKEN_LIFETIME=900
JWT_REFRESH_TOKEN_LIFETIME=604800
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000/api
```

## 📚 API Documentation

The API documentation is available at `/api/docs` when running the backend server. The API includes:

### Authentication Endpoints
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `GET /api/auth/me/` - Get current user profile
- `POST /api/auth/logout/` - User logout

### Catalog Endpoints
- `GET /api/catalog/categories/` - List all categories
- `GET /api/catalog/books/` - List books with search and filtering
- `GET /api/catalog/books/{id}/` - Get book details
- `GET /api/catalog/books/{id}/cover/` - Get book cover image
- `GET /api/catalog/books/{id}/read/stream/` - Stream book file
- `POST /api/catalog/books/{id}/like/` - Toggle book like
- `POST /api/catalog/books/{id}/bookmark/` - Toggle book bookmark

### Reading Endpoints
- `GET /api/reading/progress/{book_id}/` - Get reading progress
- `PATCH /api/reading/progress/{book_id}/` - Update reading progress
- `GET /api/reading/dashboard/` - Get user dashboard data

### Analytics Endpoints
- `GET /api/analytics/admin/overview/` - Admin analytics overview
- `GET /api/analytics/user/stats/` - User reading statistics

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

## 🚀 Deployment

### Production Environment Variables

#### Backend
```env
SECRET_KEY=your-production-secret-key
DEBUG=False
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/elibrary
ALLOWED_ORIGINS=https://yourdomain.com
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

#### Frontend
```env
VITE_API_URL=https://api.yourdomain.com/api
```

### Docker Production Build
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh token rotation
- **Role-based Access Control**: Admin and user role separation
- **Signed URLs**: Secure file access with time-limited tokens
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for secure cross-origin requests
- **Input Validation**: Comprehensive input validation and sanitization
- **File Security**: Watermarked file access with no direct download

## 📱 Mobile Support

The application is fully responsive and optimized for mobile devices:
- Touch-friendly interface
- Mobile-optimized reading experience
- Responsive navigation
- Mobile-specific UI components

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@elibrary.com or create an issue in the repository.

## 🎯 Roadmap

- [ ] Advanced reading features (annotations, highlights)
- [ ] Social features (reviews, ratings, sharing)
- [ ] Offline reading support
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Audio book support
- [ ] Recommendation engine

---

Built with ❤️ using Django, React, and MongoDB
