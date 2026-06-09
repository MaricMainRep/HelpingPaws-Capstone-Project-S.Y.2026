# HelpingPaws - Veterinary Management System

A comprehensive veterinary management system designed for veterinary clinics and pet owners. HelpingPaws enables clinics to manage appointments, pet health records, prescriptions, vaccinations, pet confinement monitoring, live video monitoring, and automated notifications.

## Features

### Authentication

- Secure login with email/password
- User registration with role selection (Admin, Staff, Pet Owner)
- Password visibility toggle
- Session management with cookies

### Admin Dashboard

- **User Management** - Create, edit, and deactivate staff accounts
- **Pet Records Management** - View and manage all registered pets
- **Appointment Management** - View, modify, cancel, and reassign appointments
- **Live Monitoring Management** - Register cameras and assign to rooms
- **Dashboard Analytics** - View total pets, appointments today, pets under monitoring, staff online
- **Activity Logs** - Track all system activities
- **Filter Management** - Dynamically manage dropdown filters
- **Room Management** - Manage clinic rooms and cages

### Staff Dashboard

- **Availability Scheduling** - Set working schedules and available appointment slots
- **Appointment Handling** - Confirm, reject, and reschedule appointments
- **Pet Health Records** - Create diagnosis and record treatments
- **Prescription Management** - Add medications with dosage, duration, and notes
- **Vaccination Management** - Track vaccinations with due dates
- **Pet Confinement Monitoring** - Update pet status and location

### Pet Owner Portal

- **Pet Management** - Register and update pet information
- **Appointment Booking** - Choose pet, select veterinarian, date and time
- **Medical Records Access** - View diagnosis, prescriptions, and vaccination history
- **Live Monitoring** - Watch pets through clinic cameras remotely

### Core System Features

- Real-time notifications via Supabase
- Progressive Web App (PWA) support with offline capabilities
- Push notification support
- Responsive design for all devices

## Tech Stack

| Category        | Technology                  |
| --------------- | --------------------------- |
| Framework       | Next.js 16.1.6 (App Router) |
| Language        | TypeScript 5.9.3            |
| Styling         | TailwindCSS 4.2.1           |
| UI Components   | Radix UI (shadcn/ui based)  |
| Backend         | Supabase (PostgreSQL)       |
| Authentication  | Custom with bcryptjs        |
| Package Manager | pnpm                        |
| Real-time       | Supabase Realtime           |
| Form Validation | Zod                         |
| Form Handling   | React Hook Form             |

## Color Scheme

- **Primary (Darker)**: `#3a7d6c`
- **Primary (Lighter)**: `#57aa95`
- **Background**: White

## User Roles

1. **ADMIN** - Full system access to all features
2. **STAFF** - Veterinarians/staff handling appointments and medical records
3. **PET_OWNER** - Clients who can book appointments and view pet records

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- Supabase account (or PostgreSQL database)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd helping-paws
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Initialize the database:

Run the SQL scripts in `scripts/init-db.sql` on your Supabase project:

- `scripts/init-db.sql` - Main database schema
- `scripts/add-filters.sql` - Filter management tables

5. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command      | Description              |
| ------------ | ------------------------ |
| `pnpm dev`   | Start development server |
| `pnpm build` | Build for production     |
| `pnpm start` | Start production server  |
| `pnpm lint`  | Run ESLint               |

## Database Schema

The system uses a normalized relational database design (3NF) with the following core tables:

### Core Tables

- `users` - Authentication and user profiles
- `staff` - Staff-specific data and specialty
- `pet_owners` - Pet owner profiles
- `pets` - Pet records
- `appointments` - Appointment scheduling

### Medical Tables

- `health_records` - Pet diagnoses and treatments
- `prescriptions` - Medication prescriptions
- `vaccinations` - Vaccination logs with due dates

### Management Tables

- `staff_availability` - Staff working schedules
- `rooms` - Clinic rooms/cages
- `cameras` - Video monitoring equipment
- `pet_locations` - Real-time pet tracking

### System Tables

- `notifications` - System notifications
- `activity_logs` - Audit trail for system actions
- `filter_categories` - Filter category definitions
- `filter_options` - Filter option values

## API Endpoints

| Endpoint                  | Methods                  | Description             |
| ------------------------- | ------------------------ | ----------------------- |
| `/api/auth/*`             | POST, GET                | Authentication routes   |
| `/api/users`              | GET, POST, PATCH, DELETE | User management         |
| `/api/pets`               | GET, POST, PATCH, DELETE | Pet management          |
| `/api/appointments`       | GET, POST, PATCH, DELETE | Appointment CRUD        |
| `/api/staff`              | GET, POST, PATCH         | Staff management        |
| `/api/staff/availability` | GET, POST, PATCH         | Availability scheduling |
| `/api/health-records`     | GET, POST, PATCH, DELETE | Health records          |
| `/api/prescriptions`      | GET, POST, PATCH, DELETE | Prescriptions           |
| `/api/vaccinations`       | GET, POST, PATCH, DELETE | Vaccinations            |
| `/api/rooms`              | GET, POST, PATCH, DELETE | Room management         |
| `/api/cameras`            | GET, POST, PATCH, DELETE | Camera management       |
| `/api/pet-locations`      | GET, POST, PATCH         | Pet location tracking   |
| `/api/notifications`      | GET, POST, PATCH         | Notifications           |
| `/api/activity-logs`      | GET                      | Activity logs           |
| `/api/dashboard/stats`    | GET                      | Dashboard statistics    |
| `/api/analytics`          | GET                      | Analytics data          |
| `/api/filters`            | GET, POST, PATCH, DELETE | Filter management       |

## Project Structure

```
helping-paws/
├── app/                      # Next.js App Router pages
│   ├── admin/               # Admin dashboard pages
│   │   ├── activity-logs/
│   │   ├── analytics/
│   │   ├── appointments/
│   │   ├── cameras/
│   │   ├── filters/
│   │   ├── notifications/
│   │   ├── pets/
│   │   ├── rooms/
│   │   └── users/
│   ├── staff/               # Staff dashboard pages
│   │   ├── appointments/
│   │   ├── availability/
│   │   ├── health-records/
│   │   ├── pets/
│   │   ├── prescriptions/
│   │   └── vaccinations/
│   ├── owner/               # Pet owner pages
│   │   ├── appointments/
│   │   ├── pets/
│   │   └── records/
│   ├── api/                 # API routes
│   ├── login/               # Login page
│   ├── register/            # Registration page
│   ├── dashboard/           # Main dashboard
│   └── live/                # Live monitoring page
├── components/              # Reusable components
│   ├── ui/                  # shadcn/ui components
│   ├── admin/               # Admin-specific components
│   ├── auth/                # Authentication components
│   ├── dashboard/           # Dashboard components
│   └── common/              # Common components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and configurations
├── scripts/                 # Database scripts
└── public/                  # Static assets
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary and confidential. All rights reserved.

## Contact

For questions or support, please contact the development team.

---
