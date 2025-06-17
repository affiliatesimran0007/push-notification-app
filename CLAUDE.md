# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This is the implementation of the Push Notification App as specified in the Product Requirements Document (@PRD_Push_Notification_App.md). The PRD contains comprehensive details about features, user stories, technical requirements, and pricing tiers.

## Common Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint

# Run Prisma migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Seed database
npm run prisma:seed
```

## Architecture Overview

This is a Next.js 15.3.3 push notification platform MVP built with the App Router architecture. The application follows a modular structure with distinct pages for each major feature area.

### Key Architectural Decisions

1. **Routing Structure**: The app uses Next.js App Router with separate pages for each module:
   - Dashboard (`/dashboard`)
   - Landing (`/landing`) - Manage landing pages and domains
     - Bot Check (`/landing/bot-check`) - Cloudflare-style verification page
   - Clients (`/clients`)
   - Notifications with sub-routes:
     - Landing (`/notifications`)
     - Campaign Builder (`/notifications/campaign-builder`)
     - Templates (`/notifications/templates`)
     - Campaigns (`/notifications/campaigns`)
   - Analytics (`/analytics`)
   - Settings (`/settings`)
   - Billing (`/billing`)

2. **Component Architecture**:
   - `DashboardLayout.jsx` wraps all pages with sidebar and navbar
   - Each page is self-contained with its own state and UI
   - Mock data is centralized in `lib/data/mockData.js`

3. **UI Framework**: 
   - Bootstrap 5 for grid and utilities
   - MDB React UI Kit for pre-built components
   - React Bootstrap for additional components
   - Custom CSS in `globals.css` for theme consistency

4. **State Management**: Currently uses local component state with mock data. Ready for integration with real APIs and state management solutions.

## Important Implementation Notes

1. **Mock Data**: All data is currently static from `mockData.js`. When implementing backend integration, replace mock data imports with API calls.

2. **No Authentication**: The MVP has no authentication system. NextAuth.js is recommended for production.

3. **Client-Side Components**: Most components use `'use client'` directive as they rely on browser APIs and interactivity.

4. **Responsive Design**: Uses Bootstrap's responsive utilities extensively. Test on mobile viewports when making UI changes.

5. **Dark Theme**: The sidebar uses a dark theme (#212529) while main content uses light backgrounds. Maintain this contrast for consistency.

6. **Landing Pages**: The landing page system allows multi-domain support with bot protection and custom redirects.

7. **Hydration Issues**: 
   - Some pages use `export const dynamic = 'force-dynamic'` in layout files to prevent hydration errors
   - React Select components are conditionally rendered after mount to avoid ID mismatches
   - Dynamic values (dates, random IDs) are initialized client-side only

8. **Sidebar Features**:
   - Collapsible sidebar with toggle button at the bottom
   - State persists across page navigations using localStorage
   - Collapsed state shows only icons (60px width)
   - Smooth transitions and glass-morphism toggle button
   - Dropdown menus hide when sidebar is collapsed

9. **Bot Check Page**: 
   - Cloudflare-style verification screen at `/landing/bot-check`
   - Collects browser info, device details, timezone, platform
   - Shows native browser notification permission prompt after 1.5s delay
   - Supports custom redirect URLs based on user's Allow/Block decision

10. **Database**: 
   - PostgreSQL with Prisma ORM
   - External database hosted on Aiven
   - Schema includes: clients, notifications, campaigns, templates, landing pages

11. **Push Notification Implementation**:
   - Web Push API with VAPID authentication
   - Service workers: `sw.js` (main), `push-sw.js` (dedicated push handler)
   - Supports Chrome, Firefox, Edge, Safari (iOS 16.4+)
   - Real-time client updates via Server-Sent Events

12. **Integration Methods**:
   - Direct HTML pages: `alerts-intuit-direct.html`, `alerts-intuit-ios.html`, `alerts-intuit-manual.html`
   - JavaScript widget: `push-widget.js`
   - Simple integration script: `simple-integration.js`

13. **Timezone Support**:
   - Browser timezone automatically detected using `Intl.DateTimeFormat()`
   - Displayed in Push Clients location field as "Unknown (timezone)"
   - No external IP geolocation APIs used
   - Campaign scheduling uses IST (India Standard Time) timezone

14. **Campaign Management**:
   - 2-column responsive layout (2 campaigns per row on desktop)
   - Campaign cards show comprehensive information:
     - Campaign icon with status badge below
     - Title, message, reference number, and date/time
     - Target audience, browsers, and operating systems with icons
     - Landing page URL
     - Detailed delivery statistics with notification-style badges
     - Control buttons: Pause/Resume, Refresh, Delete
   - Optimistic UI updates (no page refresh on actions)
   - Duplicate functionality to copy campaign settings
   - Status-based actions:
     - Active: Can pause
     - Paused: Can resume
     - Scheduled: Can cancel (converts to draft)
     - Draft: Can edit or delete
     - Completed: Can delete

15. **Push Templates**:
   - 3-column grid layout
   - Create custom templates with categories
   - Icon upload (file or URL) with base64 conversion
   - Direct navigation to campaign builder on selection
   - Database persistence with Prisma
   - No personalization variables - full dummy text only

16. **Campaign Builder**:
   - Pre-fills data from selected templates or duplicated campaigns
   - Browser and OS targeting with checkboxes and icons
   - Optional action buttons (up to 2)
   - IST timezone for scheduling
   - Landing page selection with subscriber counts
   - Save as draft functionality
   - Image URL field for hero images

## Recent Progress & Implementation Status

### ✅ Completed Features:

1. **Push Clients Page**:
   - Added Operating System column with icons
   - OS detection and icon mapping
   - Show landing page domain instead of subscribed URL
   - Real-time updates via Server-Sent Events (SSE)

2. **Push Templates**:
   - Complete redesign with 3-column grid
   - Removed usage counts and popular badges
   - Create Custom Template with category creation
   - Icon upload (file or URL)
   - Database persistence
   - Direct navigation to campaign builder

3. **Campaign Builder**:
   - Removed A/B testing feature
   - Added browser/OS targeting with icons
   - IST timezone implementation
   - Landing pages in target audience dropdown
   - Button fields for CTAs
   - Draft saving and editing

4. **Campaigns Page**:
   - Comprehensive redesign with 2-column layout
   - Detailed delivery stats with notification badges
   - Real-time stats updates via SSE
   - Campaign controls (Pause/Resume, Refresh, Delete)
   - Optimistic UI updates
   - Duplicate functionality
   - Reference numbers for easy identification
   - Fixed all stat tracking (sent, delivered, clicked, CTR)

5. **Landing Pages & Integration**:
   - Complete integration system for customer domains
   - JavaScript code generator with domain configuration
   - Bot protection via iframe overlay (visitors stay on customer domain)
   - Custom redirect URLs for allow/block
   - Service worker template download (`push-sw-template.js`)
   - Test integration buttons
   - Copy-to-clipboard functionality
   - Integration documentation at `/docs/INTEGRATION_FLOW.md`
   - PostMessage communication for cross-origin permission handling

6. **Real-time Updates**:
   - SSE implementation for campaigns and clients
   - Instant stat updates when notifications are sent/clicked
   - Auto-reconnection on connection loss
   - Event emitters for campaign and client events

7. **Campaign Scheduling & Execution**:
   - Cron job runs every minute to check scheduled campaigns
   - Automatic campaign execution at scheduled time
   - Service worker tracks clicks with clientId
   - Complete flow from registration to campaign delivery

### 🔧 Technical Improvements:
- Fixed hydration errors with conditional rendering
- Implemented proper error handling and rollback
- Added loading states and user feedback
- Consistent icon usage across the app
- Responsive design considerations
- Fixed repeated API calls with useMemo
- Improved useApi hook with AbortController
- Removed test/debug endpoints for cleaner codebase

### 📝 Database Updates:
- Templates stored in PostgreSQL
- Campaign targeting data in variantA field
- Support for all campaign statuses
- Proper relationships and constraints
- Landing pages linked to clients
- Removed unused dismissedCount/pendingCount fields

### 🚀 Platform Architecture:
- White-label push notification service
- Customers integrate on their domains
- Notifications appear from customer domains
- Centralized management in our platform
- Similar to OneSignal/PushEngage model

### 📋 Current System Capabilities:
- Multi-domain support per customer
- Bot protection for quality subscribers
- Browser/OS targeting
- Campaign scheduling with IST timezone
- Real-time delivery tracking
- Click-through rate calculation
- Template management
- Landing page analytics

### 🐛 Recent Fixes & Debugging:

1. **Emoji Icon Issue (QB Campaign)**:
   - Problem: Campaigns with emoji icons (💰, 🛒, 📦, etc.) were failing with 7 errors
   - Root Cause: Emoji icons need to be converted to URLs for web push notifications
   - Solution: Added emoji detection in `webPushService.js` that converts emoji icons to default icon URL
   - Test Page: `/test-emoji-icons` for testing various icon formats
   - The system now automatically detects emojis (≤4 chars, non-URL) and converts them

2. **Click Tracking Fix**:
   - Added CORS headers to `/api/analytics/track`
   - Updated service workers to include trackingUrl
   - Note: Customers need to update their service workers for click tracking to work

3. **Template URL Field**:
   - Templates were missing URL field in creation form
   - Added URL field to both create and edit template modals
   - URL is now properly saved and used in campaigns

4. **Base64 Icon Issue (Custom Templates)**:
   - Problem: Custom templates with Base64 encoded icons (`data:image/png;base64,...`) were failing with errors
   - Root Cause: Web push notifications require icon URLs, not Base64 encoded data
   - Solution: Updated `webPushService.js` to detect Base64 icons/badges and convert them to default URLs
   - The system now automatically detects Base64 images and uses default icons instead
   - This fixes the QB campaign issue where custom templates weren't working