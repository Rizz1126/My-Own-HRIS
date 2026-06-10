<div align="center">
  <img src="./public/portfolio-banner.png" alt="HRIS Dashboard Portfolio Banner" width="100%" />
</div>

# ✨ NexusHR - Modern HRIS Dashboard

> **NexusHR** is a comprehensive, modern Human Resources Information System (HRIS) designed to streamline employee management, attendance tracking, payroll processing, and organizational data analytics. Built with a stunning glassmorphism aesthetic and robust full-stack architecture.

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FRizz1126%2FMy-Own-HRIS)
[![React](https://img.shields.io/badge/React-19.2-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-purple.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express.js-5.2-lightgrey.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?style=for-the-badge&logo=postgresql)](https://postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45-yellow.svg?style=for-the-badge)](https://orm.drizzle.team/)

## 🚀 Key Features

### 👥 1. Employee Management
Comprehensive database of all employees, organizational hierarchy, departments, and roles. Easily track employee details, assign managers, and manage lifecycles from onboarding to offboarding.

### 🕒 2. Attendance & Time Tracking
Monitor real-time attendance, track clock-ins/outs, and manage employee shifts. Integrates directly with payroll to calculate late deductions or perfect attendance bonuses.

### 💰 3. Payroll Processing
Automated payroll calculation combining base salaries, attendance data, deductions, and bonuses. Generate secure digital payslips for employees in a single click.

### 🏖️ 4. Leave & Overtime (ESS)
**Employee Self Service (ESS)** portal allowing staff to request leaves, track remaining balances, and log overtime. Managers can approve or reject requests seamlessly.

### 📊 5. Dynamic Analytics Dashboard
Beautiful, real-time charts and widgets to give HR managers a bird's-eye view of company metrics: headcounts, monthly payroll expenses, attendance rates, and demographic breakdowns.

### 🔐 6. Secure Authentication (Better Auth)
State-of-the-art authentication system with secure sessions, Role-Based Access Control (RBAC), and enterprise-grade security protocols powered by `better-auth`.

---

## 🛠️ Technology Stack

**Frontend:**
- **React 19** - UI Library
- **Vite** - Lightning fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization and dashboard charts
- **Lucide React** - Beautiful, consistent iconography

**Backend:**
- **Node.js & Express 5** - Robust API Server
- **Drizzle ORM** - Type-safe SQL Object Relational Mapper
- **PostgreSQL** - High-performance relational database (Supabase)
- **Better Auth** - Modern, secure authentication

**Deployment:**
- **Vercel** - Edge-optimized Serverless deployment
- **Supabase** - Managed PostgreSQL Database Cloud

---

## ⚙️ Local Development

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rizz1126/My-Own-HRIS.git
   cd My-Own-HRIS
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL="postgresql://user:pass@host:port/db"
   POSTGRES_URL="postgresql://user:pass@host:port/db"
   BETTER_AUTH_SECRET="your-super-secret-key"
   BETTER_AUTH_URL="http://localhost:5173"
   FRONTEND_URL="http://localhost:5173"
   ```

4. **Initialize Database & Seed Data**
   ```bash
   # Push schema to database
   npx drizzle-kit push --config backend/drizzle.config.ts
   
   # Seed database with dummy data
   npm run seed --workspace=backend
   ```

5. **Run the Application**
   Start both the frontend and backend concurrently:
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

---

## 📐 Architecture Note

This project is structured as an **NPM Workspace Monorepo**. 
- The frontend (React/Vite) resides in the root directory.
- The backend API (Express/Drizzle) resides in the `backend/` directory.
- For Vercel Serverless deployment, the API is compiled and served via the `/api/index.ts` entry point, resolving advanced ESM/CJS interop for maximum performance.

<div align="center">
  <p>Built with ❤️ for modern HR management.</p>
</div>
