import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { networkInterfaces } from 'os';
import { fileURLToPath } from 'url';
import path from 'path';
import { handleConnection, getSessionToken } from './handlers/connection.js';
import { getState } from './state.js';

// ─────────────────────────── CONSTANTS ───────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const PORT = parseInt(process.env.PORT || '3000', 10);

// ─────────────────────── PATH TRAVERSAL GUARD ────────────────────

/**
 * Middleware that blocks path traversal attempts on static file routes.
 * Only allows access to the specified directory.
 *
 * @param allowedDir - The resolved absolute path of the allowed directory
 * @returns Express middleware function
 */
const guardPathTraversal = (allowedDir: string) => {
  return (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    const resolved = path.resolve(allowedDir, '.' + req.path);
    const normalized = path.normalize(resolved);

    if (!normalized.startsWith(allowedDir)) {
      res.status(403).send('Forbidden');
      return;
    }

    next();
  };
};

// ──────────────────────── SERVER SETUP ────────────────────────────

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// ────────────────────── STATIC FILE SERVING ──────────────────────

const publicDir = path.join(PROJECT_ROOT, 'public');
const assetsDir = path.join(PROJECT_ROOT, 'assets');

app.use('/public', guardPathTraversal(publicDir), express.static(publicDir));
app.use('/assets', guardPathTraversal(assetsDir), express.static(assetsDir));

// ─────────────────────── API ENDPOINTS ───────────────────────────

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Returns the session token — used by the Host's browser to authenticate
app.get('/api/session', (_req, res) => {
  res.json({ token: getSessionToken() });
});

// Returns network info for the join link
app.get('/api/network-info', (_req, res) => {
  res.json({
    ip: getLocalIp(),
    port: PORT,
    url: `http://${getLocalIp()}:${PORT}`,
  });
});

// ──────────────────── SOCKET.IO CONNECTIONS ──────────────────────

io.on('connection', (socket) => {
  handleConnection(io, socket);
});

// ─────────────────── LOCAL IP DETECTION ──────────────────────────

/**
 * Detects the first non-internal IPv4 address from network interfaces.
 *
 * @returns The local IP address string, or 'localhost' if none found
 */
const getLocalIp = (): string => {
  const interfaces = networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const netInterface = interfaces[name];
    if (!netInterface) continue;

    for (const entry of netInterface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }
  return 'localhost';
};

// ──────────────────────── START SERVER ────────────────────────────

httpServer.listen(PORT, () => {
  const localIp = getLocalIp();
  const token = getSessionToken();
  console.log(`\n  Dialect Digital Tableau — Server`);
  console.log(`  ─────────────────────────────────`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://${localIp}:${PORT}`);
  console.log(`  Session: ${token}`);
  console.log(`\n  Share the Network URL with players to join.\n`);
});
