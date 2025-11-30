import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import processRoutes, { stepRouter, connectionRouter } from './routes/process.routes.js';
import painPointRoutes from './routes/painpoint.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import exportRoutes from './routes/export.routes.js';
import aiAnalysisRoutes from './routes/ai-analysis.routes.js';
import aiGenerationRoutes from './routes/ai-generation.routes.js';
import templateRoutes from './routes/template.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3100;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5200',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/processes', processRoutes);
app.use('/api/steps', stepRouter);
app.use('/api/connections', connectionRouter);
app.use('/api', painPointRoutes);
app.use('/api', recommendationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api', exportRoutes);
app.use('/api', aiAnalysisRoutes);
app.use('/api/processes', aiGenerationRoutes);
app.use('/api/templates', templateRoutes);

app.get('/api', (req, res) => {
  res.json({
    message: 'ProcessX API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      processes: '/api/processes/*',
      painPoints: '/api/processes/:processId/pain-points',
      analyze: '/api/processes/:processId/analyze',
      recommendations: '/api/processes/:processId/recommendations',
      targetProcess: '/api/processes/:processId/target',
    },
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ProcessX Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${PORT}`);
});

export default app;
