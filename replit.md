# Overview

**MarceConnect** is a full-stack web application designed as a central hub for Brazilian CNC woodworking professionals. It enables marceneiros, técnicos, and companies to share projects, upload design files, interact through comments and likes, and access educational blog content. The platform features a professional dark-themed interface with Portuguese language support, aiming to foster community building, and includes a prominent technicians directory, multi-media project creation, robust admin controls, advanced account types, and a modern landing page with categorized CNC brand partners.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
Built with **React 18** and **TypeScript**, utilizing **Wouter** for routing and **TanStack Query** for server state management. UI components are derived from **shadcn/ui** (based on **Radix UI**) and styled with **Tailwind CSS** in a custom dark theme. **FontAwesome** provides iconography.
Key features include:
- **Authentication-Gated Access**: ALL content requires authentication. Landing page, login, and register are public routes. Unauthenticated users attempting to access protected routes are redirected to landing page with toast "Login necessário".
- **Public Routes**: Landing Page (/), Login (/login), Register (/register). All CTAs redirect to /login for authentication.
- **Protected Routes**: Home, Projects Gallery, Project Details, Technicians Directory, Blog, Blog Posts, FAQ, FAQ Details, Create/Edit Project, User Profile, Files Management, Complete Profile, Admin Panel. Protected via ProtectedRoute wrapper component.
- **Technician Profile System**: Enhanced profiles for technical users including location, CNC brand association, professional details (machines, contact numbers), and expertise.
- **Representative Profile System**: MACHINE_REP and SOFTWARE_REP users can select the brand/software they represent from a dropdown. Includes "Minha marca não está na lista" option that displays a WhatsApp contact button for requesting new brand additions from the administrator.
- **Landing Page**: Modern design with advanced animations (parallax, gradients, pulse effects), sticky navigation, dual CTA buttons, live statistics, features showcase, "How It Works" guide, featured projects, partners section, and technician highlights. All interactive elements redirect to /login for authentication.
- **Login & Register Pages**: Elegant redesign matching landing page aesthetics with gradient backgrounds, backdrop blur effects, FontAwesome icons, organized form sections, smooth transitions, and professional dark theme. Includes back-to-landing navigation.
- **Icon System**: Extensive use of **FontAwesome** for navigation, forms, actions, statistics, and status indicators.
- **Rich Content Editor**: **TipTap WYSIWYG editor** supporting G-code syntax highlighting, media embedding (YouTube), tables, code blocks, and standard Markdown.
- **Image Processing System**: Client-side automatic resizing and server-side optimization with Sharp. Includes image lightbox and a client-side editor (crop, resize, rotate, watermark).

## Backend
A **RESTful API** built with **Express.js** and TypeScript. It handles file uploads using **Multer** for various file types (.dxf, .stl, .pdf, .zip, images) with validation, and employs **Sharp** for advanced server-side image processing.

## Authentication
Uses **local email/password authentication** via **Passport.js** with `passport-local` strategy for secure authentication. Passwords are hashed using **bcrypt** with 10 salt rounds. Session management is stored in PostgreSQL using `connect-pg-simple` with 7-day TTL. 

**Authentication Endpoints**:
- `POST /api/auth/register`: Creates new user account with email/password. Supports all account types (USER, TECHNICAL, COMPANY, MACHINE_REP, SOFTWARE_REP). Technical users can provide additional fields: city, state, phoneNumber, cncMachine, specialties, cncBrandId. Auto-logs in user after successful registration.
- `POST /api/auth/login`: Authenticates user with email/password credentials. Returns user data on success.
- `GET /api/logout` or `POST /api/logout`: Logs out current user, destroys session and clears cookies. GET request redirects to home page.
- `GET /api/auth/user`: Returns current authenticated user data.

**Session Management**:
- Uses `express-session` with PostgreSQL store (`connect-pg-simple`)
- Session TTL: 7 days
- Cookie settings: httpOnly, sameSite (lax in dev, strict in prod), secure in production
- Session destroyed and cookie cleared on logout

**Security Notes**:
- PASSWORD CRITICAL: Set strong `SESSION_SECRET` environment variable in production (defaults to hardcoded value in development).
- Designed for self-hosted deployment on Hostinger, supporting thousands of users with traditional email/password authentication.
- Session cookies are properly configured for cross-request persistence

## Database Design
**PostgreSQL** schema managed by **Drizzle ORM** with **Neon serverless**. Key entities include Users (USER, TECHNICAL, COMPANY account types), Projects, Categories, Comments, Likes, Blog Posts, CNC Brands (with categories). Specific fields support Technician location and brand association.
Additional systems:
- **FAQ System**: Community-driven Q&A similar to Stack Overflow, allowing questions with optional built-in answers, multiple rich-text community answers, 'accepted answer' marking, and full CRUD operations.
- **Admin Panel - Partners Management**: Enhanced system with visual statistics, real-time search, category filters, responsive brand cards with sponsor badges, and full CRUD operations for partners.
- **Sponsors System**: `isSponsor` boolean field in `cncBrands` table; `true` for public landing page visibility, `false` for internal association.
- **File Management**: Server-side support for CAD formats (.dxf, .stl), documentation (.pdf), and archives (.zip) with metadata storage.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL.
- **Drizzle ORM**: Type-safe database interactions.

## Authentication & Security
- **Passport.js**: Authentication middleware with `passport-local` strategy.
- **bcrypt**: Password hashing with 10 salt rounds.
- **express-session**: Session management.
- `connect-pg-simple`: PostgreSQL session storage with 7-day TTL.

## UI Framework & Styling
- **Radix UI**: Accessible UI primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **shadcn/ui**: Component library.
- **Font Awesome**: Icon library.

## Development & Build Tools
- **Vite**: Fast build tool and development server.
- **TypeScript**: Static type checking.
- **ESBuild**: High-performance bundling.

## Utility Libraries
- **TanStack Query**: Server state management.
- **React Hook Form**: Form handling.
- **Zod**: Runtime type validation.

## Content Editing & Media
- **TipTap**: WYSIWYG rich text editor.
- **Lowlight**: Syntax highlighting.
- **Sharp**: High-performance image processing (server-side).
- `yet-another-react-lightbox`: Full-screen image gallery.