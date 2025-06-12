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