# TeamFlow - Work Record

## Task: Build AI-Powered Team Management Platform

### Architecture
- Single-page app with client-side routing via Zustand store
- Next.js 16 with App Router
- Prisma SQLite database
- NextAuth.js for authentication
- OpenRouter API for AI features
- shadcn/ui + Tailwind CSS for UI
- Recharts for charts
- All text in Russian

### Files Created

#### Core Libraries
- `src/lib/auth.ts` - NextAuth configuration with Credentials provider
- `src/lib/ai.ts` - OpenRouter AI helper for report analysis, retro assist, deadline insights
- `src/lib/store.ts` - Zustand store for app state (currentPage, sidebar, selections)

#### API Routes (20+ endpoints)
- Auth: signin/callback/session
- Teams: CRUD, join via invite code, member management
- Reports: CRUD, status workflow, comments, AI analysis
- Projects: CRUD with tree structure, milestones
- Retros: CRUD, items, AI analysis
- Notifications: CRUD, mark as read
- AI: Report analysis, retro assist
- User: Profile update

#### Components (12 view components)
- Landing page, Auth form, App shell
- Dashboard, Reports, Projects, Calendar
- Retro, Team, Settings
- All with Russian text and emerald/green color scheme

### Key Features
1. Role-based dashboard (manager/employee)
2. AI-powered report analysis and retro assist
3. Project tree with milestones
4. Calendar with color-coded events
5. Invite code system for teams
6. Notification system
7. Dark/light theme
