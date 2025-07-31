import cors from 'cors';
import { ENV } from '../utils/env';

// CORS configuration
export const corsMiddleware = cors({
  origin: ENV.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});