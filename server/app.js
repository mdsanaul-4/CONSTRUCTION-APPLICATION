// import express from 'express';
// import helmet from 'helmet';
// import cors from 'cors';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import mongoSanitize from 'express-mongo-sanitize';

// import authRoutes from './routes/authRoutes.js';
// import companyRoutes from './routes/companyRoutes.js';
// import projectRoutes from './routes/projectRoutes.js';
// import supplierRoutes from './routes/supplierRoutes.js';
// import labourerRoutes from './routes/labourerRoutes.js';
// import attendanceRoutes from './routes/attendanceRoutes.js';
// import payrollRoutes from './routes/payrollRoutes.js';
// import paymentRoutes from './routes/paymentRoutes.js';
// import reportRoutes from './routes/reportRoutes.js';
// import activityRoutes from './routes/activityRoutes.js';
// import settingsRoutes from './routes/settingsRoutes.js';
// import dashboardRoutes from './routes/dashboardRoutes.js';

// import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

// export function createApp() {
//   const app = express();

//   app.set('trust proxy', 1);
//   app.use(helmet());

//   const allowedOrigins = [
//   "http://localhost:5173",
//   "https://construction-application-sigma.vercel.app",
//   "https://construction-application-lzhjddamn-md-sanaul.vercel.app",
// ];



// const allowedOrigin = [
//   "http://localhost:5173",
//   "http://localhost:3000",
//   "https://construction-application-sigma.vercel.app",
// ];

// const corsOptions = {
//   origin: function (origin, callback) {
//     // Allow requests without an Origin header
//     if (!origin) {
//       return callback(null, true);
//     }

//     // Allow your Vercel deployments
//     if (
//       origin.endsWith(".vercel.app") ||
//       allowedOrigins.includes(origin)
//     ) {
//       return callback(null, true);
//     }

//     return callback(
//       new Error(`CORS blocked: ${origin}`),
//       false
//     );
//   },
//   credentials: true,
// };

// app.use(cors(corsOptions));

//   app.use(express.json({ limit: '6mb' }));
//   app.use(express.urlencoded({ extended: true }));
//   app.use(mongoSanitize());

//   if (process.env.NODE_ENV !== 'test') {
//     app.use(morgan('dev'));
//   }

//   // General API rate limiting.
//   const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 500,
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
//   app.use('/api', apiLimiter);

//   // Stricter limiting on login to slow down credential stuffing.
//   const authLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 20,
//     standardHeaders: true,
//     legacyHeaders: false,
//     message: { success: false, message: 'Too many login attempts. Please try again later.', errors: [] },
//   });

//   app.use('/api/auth', authLimiter, authRoutes);

//   app.get('/api/health', (req, res) => {
//     res.json({ success: true, message: 'API is running', data: { timestamp: new Date().toISOString() } });
//   });


//   app.get('/api/auth-test', (req, res) => {
//     res.json({
//     success: true,
//     message: 'Auth section is reachable'
//       });
//   });



//   app.use('/api/auth/login', authRoutes);
//   app.use('/api/company/', companyRoutes);
//   app.use('/api/projects/', projectRoutes);
//   app.use('/api/suppliers/', supplierRoutes);
//   app.use('/api/labourers/', labourerRoutes);
//   app.use('/api/attendance/', attendanceRoutes);
//   app.use('/api/payroll/', payrollRoutes);
//   app.use('/api/payments/', paymentRoutes);
//   app.use('/api/reports/', reportRoutes);
//   app.use('/api/activity/', activityRoutes);
//   app.use('/api/settings/', settingsRoutes);
//   app.use('/api/dashboard/', dashboardRoutes);
//   app.use(notFoundHandler);
//   app.use(errorHandler);

//   return app;
// }


import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import authRoutes from './routes/authRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import labourerRoutes from './routes/labourerRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import payrollRoutes from './routes/payrollRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';

import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  // Trust Render's proxy
  app.set('trust proxy', 1);

  // Security
  app.use(helmet());

  // =========================
  // CORS CONFIGURATION
  // =========================
  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (Postman, server-to-server requests, health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      try {
        const url = new URL(origin);

        const isLocalhost =
          url.hostname === 'localhost' ||
          url.hostname === '127.0.0.1';

        const isVercel =
          url.hostname.endsWith('.vercel.app');

        if (isLocalhost || isVercel) {
          return callback(null, true);
        }

        return callback(
          new Error(`CORS blocked: ${origin}`)
        );
      } catch {
        return callback(
          new Error(`Invalid origin: ${origin}`)
        );
      }
    },

    credentials: true,
  };

  app.use(cors(corsOptions));

  // =========================
  // BODY PARSING
  // =========================
  app.use(express.json({ limit: '6mb' }));
  app.use(express.urlencoded({ extended: true }));

  // MongoDB security
  app.use(mongoSanitize());

  // Logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // =========================
  // GENERAL API RATE LIMIT
  // =========================
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter);

  // =========================
  // AUTH RATE LIMIT
  // =========================
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many login attempts. Please try again later.',
      errors: [],
    },
  });

  // =========================
  // AUTH ROUTES
  // =========================
  app.use('/api/auth', authLimiter, authRoutes);

  // =========================
  // HEALTH CHECK
  // =========================
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'API is running',
      data: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  // =========================
  // AUTH TEST
  // =========================
  app.get('/api/auth-test', (req, res) => {
    res.json({
      success: true,
      message: 'Auth section is reachable',
    });
  });

  // =========================
  // OTHER API ROUTES
  // =========================
  app.use('/api/company', companyRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/suppliers', supplierRoutes);
  app.use('/api/labourers', labourerRoutes);
  app.use('/api/attendance', attendanceRoutes);
  app.use('/api/payroll', payrollRoutes);
  app.use('/api/payments', paymentRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/activity', activityRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/users', userRoutes);

  // =========================
  // ERROR HANDLING
  // =========================
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}