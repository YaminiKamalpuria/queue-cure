# Queue Cure 🏥

A real-time digital queue management system for clinics — built for **Queue Cure '26** (Wooble Full Stack Hackathon).

**Live app:** https://queue-cure-gamma.vercel.app

**Backend API:** https://queue-cure-production-fa71.up.railway.app

---

## The problem

76% of India's 1.5 million clinics still run on paper token slips. Patients wait 2–3 hours with zero visibility into when they'll be called. Receptionists manage everything from memory, and doctors have no dashboard at all.

Queue Cure replaces the paper slip with a live, synced digital queue — one screen for the receptionist, one for the waiting room, updating in real time with no page refresh.

## The moment that sells it

A patient checks their phone, sees "3 people ahead of you, ~25 min" — and puts the phone away instead of staring at a waiting room wall. That's the difference between a clinic that feels chaotic and one that feels in control.

---

## What's built

**Receptionist screen**
- Add a patient → instantly assigned a token (`Q001`, `Q002`, ...)
- Call Next → advances the queue, marks the current patient as done
- Set average consultation time (drives every wait-time calculation downstream)
- Live queue table with status badges (waiting / serving / done)
- Reset queue for a new day

**Patient waiting room screen**
- Now Serving — current token + patient name
- Live stats: patients waiting, avg time/patient, estimated total wait
- Up Next — preview of the next 3 tokens
- Token lookup — patient enters their own token and gets their exact position, patients ahead, and a personalized wait estimate

**Live sync**
- Both screens connect over a persistent WebSocket (Socket.IO)
- Every state-changing action (add patient, call next, set avg time) broadcasts the full queue state to all connected clients instantly — no polling, no refresh

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite, Socket.IO client |
| Backend | Node.js, Express 5, Socket.IO server |
| Realtime | WebSocket (Socket.IO, polling fallback) |
| Persistence | JSON file store (see [Design Decisions](#design-decisions)) |
| Deployment | Vercel (frontend), Railway (backend) |

---

## Architecture

```
┌─────────────────┐         WebSocket          ┌──────────────────┐
│  Receptionist   │  ◄──────────────────────►  │                  │
│  (React client) │                            │   Node.js +      │
└─────────────────┘                            │   Socket.IO      │
                                               │   server         │
┌─────────────────┐         WebSocket          │                  │
│  Waiting Room   │  ◄──────────────────────►  │  (single source  │
│  (React client) │                            │   of truth)      │
└─────────────────┘                            └──────────────────┘
                                                         │
                                                         ▼
                                                 ┌──────────────────┐
                                                 │  queue.js        │
                                                 │  (state machine) │
                                                 └──────────────────┘
```

The server holds one in-memory queue as the single source of truth. Every client action is a socket event with an acknowledgement callback; every successful mutation triggers a `queue:state` broadcast to **all** connected sockets, which is what makes both screens update instantly without either one polling the other.

---

## Socket events

| Event | Direction | Payload | Purpose |
|---|---|---|---|
| `queue:state` | Server → Client | Full queue state | Broadcast after every mutation; also sent immediately on connect |
| `patient:add` | Client → Server | `{ name }` | Adds a patient, assigns the next token |
| `queue:next` | Client → Server | — | Marks current patient done, promotes next waiting patient to serving |
| `avgTime:set` | Client → Server | `{ minutes }` | Updates the average consultation time used in all wait calculations |
| `token:lookup` | Client → Server | `{ token }` | Returns position, patients ahead, and estimated wait for a specific token |
| `queue:reset` | Client → Server | — | Clears the queue for a new day, keeps the avg consultation time setting |

A full visual diagram of this flow is included separately in the submission.

---

## Wait-time calculation (real data, not hardcoded)

```
waitMinutes = (tokensAhead × avgConsultationTime) + servingBonus
```

- `tokensAhead` — exact count of patients still waiting ahead of this token, computed live from queue state
- `servingBonus` — if someone is currently being served, we assume they're halfway through, so we add `avgConsultationTime / 2` instead of treating their slot as a full unit. This avoids systematically overestimating wait time for the very next patient in line.

---

## Project structure

```
queue-cure/
├── server/
│   ├── index.js        # Express + Socket.IO entry point, all socket event handlers
│   ├── queue.js         # Queue state machine — all business logic lives here
│   ├── store.js          # JSON file persistence layer
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Receptionist.jsx
│   │   │   └── WaitingRoom.jsx
│   │   ├── components/
│   │   │   └── TokenLookup.jsx
│   │   ├── socket.js     # Socket.IO client singleton
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

## Running locally

**Backend**
```bash
cd server
npm install
npm run dev
# runs on http://localhost:3001
```

**Frontend** (in a separate terminal)
```bash
cd client
npm install
npm run dev
# runs on http://localhost:5173
```

Open two browser tabs at `http://localhost:5173` — one on Receptionist, one on Waiting Room — to see live sync in action.

---

## Design decisions

**In-memory state + JSON file backup, not a database.** For a same-day clinic queue, there's no need for a persistent relational store — the queue resets every day in real clinics too. A JSON file gives crash recovery within a session without the setup overhead of MongoDB/Postgres for a system that doesn't need historical queries. The tradeoff: on platforms with ephemeral filesystems (like a typical Railway deploy), the file resets on redeploy. For production beyond a hackathon demo, this would move to Redis or a lightweight database with a daily reset job.

**Polling fallback alongside WebSocket.** Socket.IO is configured with `['polling', 'websocket']` transports so the app degrades gracefully on networks or proxies that block raw WebSocket upgrades — common in clinic wifi setups.

**Concurrency handling.** Node's single-threaded event loop processes socket events sequentially, so two near-simultaneous "Call Next" clicks from a receptionist can't corrupt queue state server-side — they're handled one after another, not in parallel. On the client, the Call Next button disables itself while a request is in flight, preventing accidental double-submission from a fast double-click.

**Token format.** Tokens are zero-padded sequential IDs (`Q001`, `Q002`...) rather than random strings, so they're easy for a receptionist to read aloud and easy for a patient to type into the lookup field without typos.

---

## Submission for Queue Cure '26

Built for the Wooble Full Stack Hackathon (Queue Cure '26). Full submission includes this repo, a live demo, a socket event diagram, and a written thought-process document covering concurrency and edge-case handling.

**Author:** Yamini Kamalpuria
