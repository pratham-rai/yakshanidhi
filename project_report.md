# Project Report: YakshaNidhi Digital Platform
**Date:** May 15, 2026
**Version:** 1.0 (Final Polish)
**Developer:** Antigravity AI & Pratham Rai

---

## 1. Executive Summary
YakshaNidhi is a premium, high-performance web platform designed to digitize and preserve the discovery of Yakshagana events. It bridges the gap between traditional cultural performances and modern digital convenience by providing a centralized hub for event listings, interactive mapping, and automated user reminders.

## 2. Technical Stack
The project is built using a modern, scalable architecture:
- **Frontend:** Single Page Application (SPA) built with **Vite** and **Vanilla Javascript**.
- **Styling:** Custom CSS with a focus on "Premium Aesthetics" (glassmorphism, gradients, and micro-animations).
- **Backend:** **Node.js** with **Express.js**.
- **Database:** **MongoDB Atlas** (Cloud Database).
- **Storage:** **Cloudinary** (for event posters).
- **Maps:** **Leaflet.js** with OpenStreetMap.
- **Deployment:** **Firebase Hosting** (Frontend) and **Render** (Backend).

## 3. Core Features & Functional Details

### 3.1. Event Discovery & Mapping
- **Interactive Map:** A real-time map view showing all upcoming approved events.
- **Dynamic Filtering:** Users can filter events by **Prasanga** (Story), **Troupe**, or **Thittu** (Style: Thenku, Badagu, Bada-Badagu).
- **Event Details:** Dedicated pages for each event featuring posters, descriptions, and location metadata.

### 3.2. Administrative Management (The "Moderation" System)
- **Multi-Level Roles:** User, Admin, and Master Admin.
- **Moderation Queue:** Admins can Approve, Reject (with reason), or Revert events to pending.
- **Past Events Archive:** An automated system that hides events from the public 12 hours after they start and moves them into a secure "Past Events" archive for Master Admins.
- **User Management:** Master Admins can promote/demote users to Admin roles.

### 3.3. Advanced Automated Systems
- **Google Maps Auto-Resolver:** A custom backend service that follows redirected Google Maps links (e.g., `maps.app.goo.gl`) and uses regex to extract precise Latitude and Longitude coordinates, eliminating manual data entry.
- **Dual-Email Reminder Scheduler:** A background service powered by `node-cron` that checks for upcoming saved events every 15 minutes. It sends two automated emails:
    1. **12 Hours Before:** Preparation alert.
    2. **1 Hour Before:** Final "Starting Soon" alert.
- **Google Calendar Integration:** One-click generation of template-based calendar links with pre-filled event metadata.

## 4. Backend Architecture (Minute Details)

### 4.1. Data Models
- **User Model:** Stores credentials, roles, saved `reminders`, and `sentReminders` (to track email delivery history).
- **Event Model:** Stores Prasanga, Troupe, Thittu, Date, Time, Location, Map Links, Coordinates, Descriptions, and Poster URLs.

### 4.2. Security
- **JWT Authentication:** Secure token-based sessions for all logged-in users.
- **Middleware Protection:** Custom `auth`, `adminOnly`, and `masterAdminOnly` guards for API endpoints.
- **Password Hashing:** Uses `bcryptjs` for secure credential storage.

## 5. UI/UX Design System
- **Theme:** Sleek Dark Mode with a "Yaksagana Orange" (`#E8751A`) primary accent.
- **Responsiveness:** Mobile-first design ensures accessibility on smartphones and tablets.
- **Aesthetics:** Subtle glow effects (`box-shadow`), skeleton loaders for data fetching, and CSS transitions for smooth page navigation.

## 6. Deployment Workflow
- **CI/CD:** Continuous integration via **Git** with automated deployment triggers.
- **Environment Management:** Secured API keys and database URIs using `.env` files.

---
*End of Report*
