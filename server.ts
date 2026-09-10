import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

import { connectDB, getMongoStatus } from './server/db';
import { initSocketIO } from './server/socket';
import { startEscalationCron } from './server/services/escalationCron';
import authRouter from './server/routes/auth';
import ticketsRouter from './server/routes/tickets';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Health and DB status endpoints
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'ResolveDesk Node+Express Server',
    time: new Date().toISOString()
  });
});

app.get('/api/db-status', (req: Request, res: Response) => {
  res.json(getMongoStatus());
});

app.post('/api/db-status/retry', async (req: Request, res: Response) => {
  const result = await connectDB();
  res.json({
    ...getMongoStatus(),
    retryResult: result
  });
});

// Primary REST APIs
app.use('/api/auth', authRouter);
app.use('/api/tickets', ticketsRouter);

async function startServer() {
  // 1. Initialize MongoDB connection (resilient Atlas connection with memory fallback)
  await connectDB();

  // 2. Create HTTP server & Socket.io engine
  const server = http.createServer(app);
  initSocketIO(server);

  // 3. Start automated background escalation watchdog
  startEscalationCron();

  // 4. Vite middleware in dev mode or static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 ResolveDesk Support System running on http://0.0.0.0:${PORT}`);
    console.log(`⚡ Socket.io Real-time engine active`);
    console.log(`⏱️  node-cron SLA escalation engine active`);
    console.log(`======================================================\n`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
