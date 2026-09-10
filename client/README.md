# Client Application (React.js)

The React.js user interface is powered by Vite, Tailwind CSS, Socket.io-client, and Plus Jakarta Sans typography.

## Directory Layout
- `/src/components/`:
  - `LoginPage.tsx` — Root auth gate with JWT session storage and bcrypt support
  - `UserDashboard.tsx` — Ticket queue, SLA countdowns, priority metrics, filters
  - `TicketDetailView.tsx` — Visual lifecycle timeline, AI Assistant markdown chat bubble, reply box, SLA countdown timer
  - `NewTicketModal.tsx` — Ticket submission with automated AI triage triggering
  - `EscalateModal.tsx` — Manual escalation dispatch to engineering
  - `Navbar.tsx` — Real-time Socket.io and MongoDB Atlas status indicators
  - `ToastContainer.tsx` — Real-time event notifications via Socket.io
- `/src/lib/`:
  - `api.ts` — Typed REST API client for Express backend
  - `socket.ts` — Socket.io client manager with room subscriptions
- `/src/types.ts` — Shared TypeScript types
