# 🎓 Teacher Dashboard Components

Complete component-based teacher dashboard built with modern React patterns, animations, and premium UI/UX design.

## 📦 Components Overview

### Dashboard Components

#### 1. **DashboardGreeting.jsx**

Dynamic greeting component with time-based messages and animated icons.

**Features:**

- Time-based greetings (Morning, Afternoon, Evening, Night)
- Animated icons (Sun, Moon, Sunrise, Sunset)
- Real-time date display
- Branch information integration

**Props:**

```javascript
{
  user: {
    fullName: string
  },
  branchInfo: {
    branchName: string
  }
}
```

---

#### 2. **DashboardStats.jsx**

Animated statistics cards with gradient effects and hover animations.

**Features:**

- 4 key metrics: Classes, Students, Attendance Rate, Upcoming Exams
- Gradient backgrounds on hover
- Change indicators (trending up/down)
- Smooth animations with framer-motion
- Click-to-navigate functionality

**Props:**

```javascript
{
  stats: {
    classes: { total: number, active: number, change: number },
    students: { total: number, change: number },
    attendance: { average: number, change: number },
    exams: { total: number, thisWeek: number, change: number }
  }
}
```

---

#### 3. **QuickActions.jsx**

Grid of quick action buttons for common teacher tasks.

**Features:**

- 8 action cards with unique colors
- Hover animations and scale effects
- Gradient borders on hover
- Icon-based navigation
- Responsive grid layout

**Actions:**

- My Classes
- Mark Attendance
- Manage Exams
- View Results
- Assignments
- Students
- Analytics
- Profile

---

#### 4. **MyClassesCard.jsx**

Interactive class cards with live indicators and stats.

**Features:**

- Live class detection based on schedule
- Animated LIVE badge with pulse effect
- Student count and attendance rate
- Next class time display
- Click to view class details
- Gradient hover effects

**Props:**

```javascript
{
  classes: [
    {
      _id: string,
      name: string,
      code: string,
      studentCount: number,
      attendanceRate: number,
      schedule: [{ day: string, startTime: string, endTime: string }],
      nextClass: string,
    },
  ];
}
```

---

#### 5. **UpcomingExamsCard.jsx**

Exam cards with date badges and status indicators.

**Features:**

- Date badge with month and day
- Status badges (Today, Tomorrow, In X days)
- Exam details (time, duration, room)
- Subject tags
- Color-coded status indicators

**Props:**

```javascript
{
  exams: [
    {
      _id: string,
      title: string,
      date: string,
      classId: { name: string },
      duration: number,
      room: string,
      subject: string,
    },
  ];
}
```

---

#### 6. **TodayAttendanceCard.jsx**

Today's attendance summary with progress tracking.

**Features:**

- Overall attendance rate progress bar
- Present/Absent/Late statistics
- Classes completion tracking
- Color-coded stats grid
- Pending classes alert

**Props:**

```javascript
{
  attendanceData: {
    totalClasses: number,
    completedClasses: number,
    pendingClasses: number,
    totalStudents: number,
    presentStudents: number,
    absentStudents: number,
    lateStudents: number,
    attendanceRate: number
  }
}
```

---

#### 7. **RecentActivityFeed.jsx**

Scrollable activity feed with dynamic icons.

**Features:**

- Activity type icons (attendance, exam, assignment, etc.)
- Time ago formatting
- Color-coded activity types
- Status badges
- Custom scrollbar styling
- Max height with scroll

**Props:**

```javascript
{
  activities: [
    {
      _id: string,
      type: "attendance" | "exam" | "assignment" | "announcement" | "message",
      title: string,
      description: string,
      timestamp: string,
      className: string,
      status: string,
    },
  ];
}
```

---

### Profile/Attendance Components

#### 8. **CheckInOutCard.jsx**

Interactive check-in/out system with swipe-to-confirm.

**Features:**

- Swipe-to-confirm mechanism
- Status indicators (Not Checked In, Checked In, Checked Out)
- Working hours calculation
- Time display (check-in/check-out)
- Toast notifications
- Animated progress bar

**Props:**

```javascript
{
  teacherAttendance: {
    status: 'not_checked_in' | 'checked_in' | 'checked_out',
    checkInTime: string,
    checkOutTime: string,
    workingHours: string
  },
  onCheckIn: () => Promise<void>,
  onCheckOut: () => Promise<void>
}
```

**Usage:**

```javascript
<CheckInOutCard
  teacherAttendance={teacherAttendance}
  onCheckIn={handleCheckIn}
  onCheckOut={handleCheckOut}
/>
```

---

#### 9. **AttendanceHistoryCard.jsx**

Monthly attendance history with filtering.

**Features:**

- Month/year selector with navigation
- Monthly stats overview (Present, Absent, Late, Rate)
- Detailed attendance records
- Color-coded status indicators
- Working hours display
- Scrollable list with custom scrollbar

**Props:**

```javascript
{
  attendanceHistory: [
    {
      _id: string,
      date: string,
      status: "present" | "absent" | "late",
      checkInTime: string,
      checkOutTime: string,
      workingHours: string,
    },
  ];
}
```

---

## 🎨 Design Features

### Animations

- **Framer Motion**: Smooth entrance animations, hover effects, and transitions
- **Staggered Animations**: Cards animate in sequence for visual appeal
- **Micro-interactions**: Scale, rotate, and color transitions on hover

### Color System

- **Gradient Backgrounds**: Subtle gradients on hover
- **Color-coded Status**: Green (success), Red (error), Yellow (warning), Blue (info)
- **Themed Components**: Respects light/dark mode

### UI/UX Best Practices

- **Responsive Design**: Mobile-first approach with breakpoints
- **Loading States**: Animated spinners and skeleton screens
- **Error Handling**: User-friendly error messages
- **Empty States**: Informative placeholders when no data
- **Accessibility**: Semantic HTML and ARIA labels

---

## 📱 Mobile App Features Implemented

Based on the Teacher Mobile App README, all key features have been implemented:

### ✅ Dashboard

- [x] Dynamic greeting based on time of day
- [x] Live class indicator with LIVE badge
- [x] Animated statistics cards
- [x] Quick actions for common tasks
- [x] Today's attendance summary
- [x] Recent activity feed

### ✅ Class Management

- [x] View all classes with details
- [x] Quick stats and performance overview
- [x] Filter and navigation capabilities

### ✅ Profile & Check-in

- [x] Teacher profile with stats
- [x] One-tap check-in/check-out system (swipe-to-confirm)
- [x] Attendance history with month filtering
- [x] Working hours calculation

---

## 🚀 Usage

### Import Components

```javascript
// Individual imports
import DashboardGreeting from "@/components/teacher/DashboardGreeting";
import DashboardStats from "@/components/teacher/DashboardStats";
// ... etc

// Or use index file
import {
  DashboardGreeting,
  DashboardStats,
  QuickActions,
  MyClassesCard,
  UpcomingExamsCard,
  TodayAttendanceCard,
  RecentActivityFeed,
  CheckInOutCard,
  AttendanceHistoryCard,
} from "@/components/teacher";
```

### Example Dashboard Layout

```javascript
export default function TeacherDashboard() {
  const { user, dashboardData } = useDashboard();

  return (
    <div className="p-6 space-y-6">
      <DashboardGreeting user={user} branchInfo={dashboardData.branchInfo} />
      <DashboardStats stats={dashboardData.stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <MyClassesCard classes={dashboardData.myClasses} />
            <UpcomingExamsCard exams={dashboardData.upcomingExams} />
          </div>
          <TodayAttendanceCard attendanceData={dashboardData.todayAttendance} />
          <QuickActions />
        </div>

        <div className="space-y-6">
          <CheckInOutCard
            teacherAttendance={dashboardData.teacherAttendance}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />
          <RecentActivityFeed activities={dashboardData.recentActivity} />
        </div>
      </div>

      <AttendanceHistoryCard
        attendanceHistory={dashboardData.attendanceHistory}
      />
    </div>
  );
}
```

---

## 🛠️ Dependencies

```json
{
  "framer-motion": "^11.x",
  "sonner": "^2.x",
  "lucide-react": "^0.x",
  "next": "^16.x",
  "react": "^19.x"
}
```

---

## 🎯 API Integration

The dashboard expects the following API response structure:

```javascript
{
  success: true,
  data: {
    stats: { /* stats object */ },
    myClasses: [ /* classes array */ ],
    upcomingExams: [ /* exams array */ ],
    branchInfo: { branchName: string },
    todayAttendance: { /* attendance data */ },
    recentActivity: [ /* activities array */ ],
    teacherAttendance: { /* teacher attendance */ },
    attendanceHistory: [ /* history array */ ]
  }
}
```

---

## 🌟 Features Highlights

1. **Component-Based Architecture**: Modular, reusable components
2. **Premium Animations**: Smooth, professional animations throughout
3. **Responsive Design**: Works on all screen sizes
4. **Type Safety**: Proper prop validation and TypeScript-ready
5. **Performance Optimized**: Lazy loading and efficient re-renders
6. **Accessibility**: WCAG compliant with proper ARIA labels
7. **Dark Mode Support**: Seamless theme switching
8. **Real-time Updates**: Live class detection and status updates

---

## 📝 Notes

- All components use the shadcn/ui component library
- Colors are theme-aware and respect user preferences
- Animations can be disabled for users who prefer reduced motion
- All time/date formatting uses browser locale settings
- Components are optimized for Next.js 16 App Router

---

**Made with ❤️ for Teachers**
