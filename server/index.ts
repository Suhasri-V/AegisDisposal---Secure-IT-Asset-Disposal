import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import { db } from './db/store';

// Routes
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import assetsRoutes from './routes/assets';
import disposalRequestsRoutes from './routes/disposalRequests';
import wipingRoutes from './routes/wiping';
import verificationRoutes from './routes/verification';
import complianceRoutes from './routes/compliance';
import certificatesRoutes from './routes/certificates';
import auditLogsRoutes from './routes/auditLogs';
import notificationsRoutes from './routes/notifications';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';
import settingsRoutes from './routes/settings';
import { provisionAdminAccount } from './adminSetup';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

// Initialize Database on startup
db.initialize();
provisionAdminAccount();

// Middleware
const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL?.trim().replace(/\/+$/, ''),
    'https://aegis-disposal-secure-it-asset-disp.vercel.app',
    'https://aegis-disposal-secure-it-asset-disposal.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173',
  ].filter((origin): origin is string => Boolean(origin))
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        allowedOrigins.has(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        cleanOrigin.startsWith('http://localhost:') ||
        cleanOrigin.startsWith('http://127.0.0.1:')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

// Request logging (simplified)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/assets/')) {
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'AegisDisposal SecOps Engine',
    timestamp: new Date().toISOString(),
  });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/disposal-requests', disposalRequestsRoutes);
app.use('/api/wiping', wipingRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/audit-logs', auditLogsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);

// Serve static frontend build if present
const distPath = path.resolve(process.cwd(), 'dist');
app.use(express.static(distPath));

// For SPA routing fallback (non-API requests)
app.get('*', (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ success: false, error: 'EndpointNotFound', message: `Cannot ${req.method} ${req.path}` });
    return;
  }
  const indexPath = path.join(distPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Frontend not built. Run vite dev server or build the frontend.');
    }
  });
});

// Centralized error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred.',
  });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    const googleConfigured = Boolean(process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim());
    console.log(`\n======================================================`);
    console.log(`  AEGIS DISPOSAL SECOPS BACKEND API SERVER RUNNING   `);
    console.log(`  Local: http://localhost:${PORT}                      `);
    console.log(`  Database Storage: server/data (Persistent JSON ACID)`);
    console.log(`  Google Sign-In:   ${googleConfigured ? '✓ Configured' : '✗ Not configured (set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET)'}`);
    console.log(`======================================================\n`);
  });
}

export default app;
