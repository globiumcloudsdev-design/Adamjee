# Ease Academy - School Management System

A comprehensive school management system built with Next.js 16, featuring multi-branch support, role-based access control, and modern UI components.

## 🚀 Features

- **Multi-Branch Management**: Support for multiple school branches
- **Role-Based Access Control**: Super Admin, Branch Admin, Teacher, Parent, and Student roles
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components
- **Real-time Dashboard**: Interactive dashboards for all user roles
- **Student Management**: Complete student information system
- **Teacher Portal**: Class management, attendance, and grading
- **Parent Portal**: Track student progress and attendance
- **Attendance System**: Digital attendance tracking
- **Exam & Results**: Comprehensive exam and result management
- **Fee Management**: Track payments and generate invoices
- **Authentication**: Secure JWT-based authentication
- **Redis Caching**: Optimized performance with Redis
- **Cloud Storage**: Cloudinary integration for media files

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5+
- Redis (optional, for caching)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd ease-academy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update `.env.local` with your configuration:
   - MongoDB connection string
   - JWT secret
   - Redis URL (optional)
   - Cloudinary credentials (for file uploads)

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
ease-academy/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── (dashboard)/       # Dashboard pages
│   │   ├── api/               # API routes
│   │   └── layout.js          # Root layout
│   ├── backend/               # Backend logic
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Authentication & middleware
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes configuration
│   │   └── utils/             # Utility functions
│   ├── components/            # React components
│   │   ├── ui/                # shadcn/ui components
│   │   ├── tables/            # Table components
│   │   ├── forms/             # Form components
│   │   └── charts/            # Chart components
│   ├── lib/                   # Utilities
│   │   ├── database.js        # MongoDB connection
│   │   ├── redis.js           # Redis client
│   │   └── api-client.js      # API client utility
│   ├── hooks/                 # Custom React hooks
│   ├── styles/                # Global styles
│   └── constants/             # Constants & configurations
├── .env.local                 # Environment variables
├── next.config.mjs            # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json               # Dependencies
```

## 🔑 Default Credentials

**Super Admin:**
- Email: `admin@easeacademy.com`
- Password: `password123`

> ⚠️ **Important**: Change these credentials after first login!

## 🎨 Technology Stack

- **Frontend**: Next.js 16, React, Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Caching**: Redis
- **File Upload**: Cloudinary
- **Validation**: bcryptjs for password hashing

## 📚 API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### Super Admin
- `GET /api/super-admin/dashboard` - Dashboard statistics
- `GET /api/super-admin/branches` - List all branches
- `POST /api/super-admin/branches` - Create new branch
- `GET /api/super-admin/branch-admins` - List branch admins

### Branch Admin
- `GET /api/branch-admin/dashboard` - Branch dashboard
- `GET /api/branch-admin/teachers` - List teachers
- `GET /api/branch-admin/students` - List students
- `POST /api/branch-admin/classes` - Create class

### Teacher
- `GET /api/teacher/dashboard` - Teacher dashboard
- `GET /api/teacher/classes` - My classes
- `POST /api/teacher/attendance` - Mark attendance
- `POST /api/teacher/grades` - Submit grades

## 🔒 User Roles & Permissions

### Super Admin
- Manage all branches
- Create branch admins
- View system-wide reports
- Manage global settings

### Branch Admin
- Manage branch operations
- Add/edit teachers and students
- Create classes and subjects
- View branch reports

### Teacher
- View assigned classes
- Mark attendance
- Create assignments
- Grade exams
- View student progress

### Parent
- View child's information
- Track attendance
- View grades and reports
- Communicate with teachers

### Student
- View profile
- Check attendance
- View grades
- Access assignments

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables
4. Deploy

### Manual Deployment
```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 📧 Support

For support, email support@easeacademy.com or join our Slack channel.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- shadcn for the beautiful UI components
- All contributors who helped build this project

---

Made with ❤️ by the Ease Academy Team
