// import dotenv from 'dotenv';
// dotenv.config();

// import express from 'express'
// import cors from 'cors'
// import compression from 'compression'
// import morgan from 'morgan'
// import path from 'path'
// import { fileURLToPath } from 'url'
// import userRoutes from './routes.user.js'
// import parseRoutes from './routes/parse.js'
// import dashboardRoutes from './routes/dashboard.js'
// import { parseResumeData } from './resume-parser-ultimate.js'
// import { affindaStatus } from './vendor/affindaAdapter.js'
// import crypto from 'crypto'

// // Simple traceId generator without external dependencies
// function generateTraceId() {
//   return crypto.randomBytes(8).toString('hex')
// }


// // Set to production mode to serve React build from port 5000
// process.env.NODE_ENV = 'production'

// // TODO: Initialize database when pg package is available
// // initializeDatabase()

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
// const stripeRoutes = require('./routes/stripe');
// const app = express()
// app.use(cors())
// app.use(express.json({ limit: '10mb' }))
// app.use(express.urlencoded({ extended: true, limit: '10mb' }))
// app.use(compression())
// app.use(morgan('dev'))

// // File upload configuration will be added after installing required packages

// const PORT = process.env.PORT || 5001

// // --- User Routes ---
// app.use('/api/user', userRoutes)

// // --- Resume Parsing Routes (Affinda Integration) ---
// app.use('/api', parseRoutes)

// // --- Dashboard Routes ---
// app.use('/api/dashboard', dashboardRoutes)

// // --- Mock API ---
// app.get('/api/health', (req,res)=> res.json({ ok:true, service:'talendro-server' }))

// // Debug endpoint to check AFFINDA_API_KEY configuration
// app.get('/api/debug/config', (req,res)=>{
//   res.json({ affindaConfigured: !!process.env.AFFINDA_API_KEY });
// });

// // Debug endpoint to check Affinda setup
// app.get('/api/debug/affinda', async (req, res) => {
//   try {
//     const status = await affindaStatus();
//     res.json(status);
//   } catch (e) {
//     res.status(500).json({ error: String(e.message || e) });
//   }
// });


// app.get('/api/metrics/today', (req, res)=>{
//   res.json({ applied: 3, optimized: 2, found: 25, agents: 1 })
// })

// app.get('/api/metrics/alltime', (req, res)=>{
//   res.json({ applied: 87, optimized: 64, found: 412, agents: 5 })
// })

// app.post('/api/checkout/intent', (req,res)=>{
//   // TODO: integrate Stripe intent here
//   res.json({ clientSecret: 'mock_secret_123', amount: 3900, currency: 'usd' })
// })

// app.post('/api/checkout/complete', (req,res)=>{
//   // TODO: verify payment and provision subscription
//   res.json({ success: true })
// })

// // Legacy endpoint kept for backward compatibility (fallback to internal parser)
// app.post('/api/resume/parse-legacy', (req, res) => {
//   const traceId = generateTraceId()
//   const t0 = Date.now()
  
//   console.log(`[${traceId}] LEGACY PARSER: Processing with internal parser...`)
  
//   const chunks = []
  
//   req.on('data', chunk => {
//     chunks.push(chunk)
//   })
  
//   req.on('end', async () => {
//     try {
//       const buffer = Buffer.concat(chunks)
//       const contentType = req.headers['content-type'] || ''
      
//       if (!contentType.includes('multipart/form-data')) {
//         return res.status(400).json({ error: 'Expected multipart/form-data upload', traceId })
//       }
      
//       // Extract file (simplified for legacy support)
//       const boundary = contentType.split('boundary=')[1]
//       if (!boundary) {
//         return res.status(400).json({ error: 'No boundary found', traceId })
//       }
      
//       // Basic file extraction
//       const parts = buffer.toString('binary').split(`--${boundary}`)
//       let fileName = 'resume.pdf'
//       let fileBuffer = null
      
//       for (const part of parts) {
//         if (part.includes('name="file"')) {
//           const headerEndIndex = part.indexOf('\r\n\r\n')
//           if (headerEndIndex !== -1) {
//             fileBuffer = Buffer.from(part.slice(headerEndIndex + 4), 'binary')
//             break
//           }
//         }
//       }
      
//       if (!fileBuffer) {
//         return res.status(400).json({ error: 'No file data found', traceId })
//       }
      
//       const parsedData = parseResumeData(fileBuffer, fileName)
      
//       res.json({ 
//         success: true, 
//         data: parsedData,
//         fileName,
//         traceId,
//         processingTime: Date.now() - t0,
//         message: "Resume parsed with legacy parser"
//       })
      
//     } catch (error) {
//       console.error(`[${traceId}] LEGACY PARSER ERROR:`, error.message)
//       res.status(500).json({ 
//         error: 'Parse error', 
//         detail: error.message, 
//         traceId 
//       })
//     }
//   })
// })

// // --- Development: proxy to React dev server or serve build in production ---
// if (process.env.NODE_ENV === 'production') {
//   const clientBuildPath = path.resolve(__dirname, '../client/build')
//   app.use(express.static(clientBuildPath))
  
//   // Handle all non-API routes by serving the index.html
//   app.use((req, res, next) => {
//     if (req.path.startsWith('/api')) {
//       next()
//     } else {
//       res.sendFile(path.join(clientBuildPath, 'index.html'))
//     }
//   })
// } else {
//   // In development, serve React build files from port 5000
//   const clientBuildPath = path.resolve(__dirname, '../client/build')
//   app.use(express.static(clientBuildPath))
  
//   // Handle all non-API routes by serving the index.html
//   app.use((req, res, next) => {
//     if (req.path.startsWith('/api')) {
//       next()
//     } else {
//       res.sendFile(path.join(clientBuildPath, 'index.html'))
//     }
//   })
// }

// app.listen(PORT, '0.0.0.0', ()=> console.log(`Server listening on http://0.0.0.0:${PORT}`))



import './bootstrap-env.js';  // ✅ MUST BE FIRST

// ✅ DIAGNOSTIC: Print environment status immediately
console.log('[ENV] CWD:', process.cwd());
console.log('[ENV] has AFFINDA_API_KEY:', !!process.env.AFFINDA_API_KEY);
console.log('[ENV] key length:', (process.env.AFFINDA_API_KEY || '').length);
console.log('[ENV] key preview:', (process.env.AFFINDA_API_KEY || '').substring(0, 15) + '...');
console.log('[ENV] has ANTHROPIC_API_KEY:', !!process.env.ANTHROPIC_API_KEY);
console.log('[ENV] Anthropic key configured:', !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-'));

import express from 'express'
import cors from 'cors'
import compression from 'compression'
import morgan from 'morgan'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import userRoutes from './routes.user.js'
import parseRoutes from './routes/parse.js'
import dashboardRoutes from './routes/dashboard.js'
import jobsRoutes from './routes/jobs.js'
import aiRoutes from './routes/ai.js'
import authRoutes from './routes/auth.js'
import webhookRoutes from './routes/webhooks.js'
import { parseResumeData } from './resume-parser-ultimate.js'
import { affindaStatus } from './vendor/affindaAdapter.js'
import crypto from 'crypto'

// Simple traceId generator without external dependencies
function generateTraceId() {
  return crypto.randomBytes(8).toString('hex')
}

// Set to production mode to serve React build from port 5000
process.env.NODE_ENV = 'production'

// TODO: Initialize database when pg package is available
// initializeDatabase()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import stripeRoutes from './routes/stripe.js'

const app = express()

// ============================================
// DATABASE CONNECTION
// ============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/talendro', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// CORS Configuration - Allow requests from frontend
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      // Add your production domains here
      process.env.FRONTEND_URL, // Set this in Railway env vars
      process.env.DOMAIN, // Or set this
    ].filter(Boolean); // Remove undefined values
    
    // In production, allow Railway domains and custom domains
    const isRailwayDomain = origin.includes('.up.railway.app');
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isAllowed = allowedOrigins.includes(origin) || isRailwayDomain;
    
    if (isAllowed || isLocalhost || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked origin:', origin);
      // In production, be more strict; in dev, allow all
      callback(null, process.env.NODE_ENV !== 'production');
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

// Webhook route (needs raw body) - MUST be before express.json()
app.use('/api/webhooks', webhookRoutes);

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(compression())
app.use(morgan('dev'))

// File upload configuration will be added after installing required packages

const PORT = process.env.PORT || 5001

// --- User Routes ---
app.use('/api/user', userRoutes)

// --- Auth Routes ---
app.use('/api/auth', authRoutes)

// --- Resume Parsing Routes (Affinda Integration) ---
app.use('/api', parseRoutes)

// --- Dashboard Routes ---
app.use('/api/dashboard', dashboardRoutes)

// --- Job Search Routes ---
app.use('/api/jobs', jobsRoutes)

// --- AI Routes (Anthropic API Proxy) ---
app.use('/api/ai', aiRoutes)

app.use('/api/stripe', stripeRoutes)

// --- Mock API ---
app.get('/api/health', (req,res)=> res.json({ ok:true, service:'talendro-server' }))

// Debug endpoint to check AFFINDA_API_KEY configuration
app.get('/api/debug/config', (req,res)=>{
  res.json({ affindaConfigured: !!process.env.AFFINDA_API_KEY });
});

// Debug endpoint to check Affinda setup
app.get('/api/debug/affinda', async (req, res) => {
  try {
    const status = await affindaStatus();
    res.json(status);
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

app.get('/api/metrics/today', (req, res)=>{
  res.json({ applied: 3, optimized: 2, found: 25, agents: 1 })
})

app.get('/api/metrics/alltime', (req, res)=>{
  res.json({ applied: 87, optimized: 64, found: 412, agents: 5 })
})

app.post('/api/checkout/intent', (req,res)=>{
  // TODO: integrate Stripe intent here
  res.json({ clientSecret: 'mock_secret_123', amount: 3900, currency: 'usd' })
})

app.post('/api/checkout/complete', (req,res)=>{
  // TODO: verify payment and provision subscription
  res.json({ success: true })
})

// Legacy endpoint kept for backward compatibility (fallback to internal parser)
app.post('/api/resume/parse-legacy', (req, res) => {
  const traceId = generateTraceId()
  const t0 = Date.now()
  
  console.log(`[${traceId}] LEGACY PARSER: Processing with internal parser...`)
  
  const chunks = []
  
  req.on('data', chunk => {
    chunks.push(chunk)
  })
  
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks)
      const contentType = req.headers['content-type'] || ''
      
      if (!contentType.includes('multipart/form-data')) {
        return res.status(400).json({ error: 'Expected multipart/form-data upload', traceId })
      }
      
      // Extract file (simplified for legacy support)
      const boundary = contentType.split('boundary=')[1]
      if (!boundary) {
        return res.status(400).json({ error: 'No boundary found', traceId })
      }
      
      // Basic file extraction
      const parts = buffer.toString('binary').split(`--${boundary}`)
      let fileName = 'resume.pdf'
      let fileBuffer = null
      
      for (const part of parts) {
        if (part.includes('name="file"')) {
          const headerEndIndex = part.indexOf('\r\n\r\n')
          if (headerEndIndex !== -1) {
            fileBuffer = Buffer.from(part.slice(headerEndIndex + 4), 'binary')
            break
          }
        }
      }
      
      if (!fileBuffer) {
        return res.status(400).json({ error: 'No file data found', traceId })
      }
      
      const parsedData = parseResumeData(fileBuffer, fileName)
      
      res.json({ 
        success: true, 
        data: parsedData,
        fileName,
        traceId,
        processingTime: Date.now() - t0,
        message: "Resume parsed with legacy parser"
      })
      
    } catch (error) {
      console.error(`[${traceId}] LEGACY PARSER ERROR:`, error.message)
      res.status(500).json({ 
        error: 'Parse error', 
        detail: error.message, 
        traceId 
      })
    }
  })
})

// --- Development: proxy to React dev server or serve build in production ---
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.resolve(__dirname, '../client/build')
  app.use(express.static(clientBuildPath))
  
  // Handle all non-API routes by serving the index.html
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
    } else {
      res.sendFile(path.join(clientBuildPath, 'index.html'))
    }
  })
} else {
  // In development, serve React build files from port 5000
  const clientBuildPath = path.resolve(__dirname, '../client/build')
  app.use(express.static(clientBuildPath))
  
  // Handle all non-API routes by serving the index.html
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      next()
    } else {
      res.sendFile(path.join(clientBuildPath, 'index.html'))
    }
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Talendro API server running on port ${PORT}`);
  console.log(`✅ Anthropic API key configured: ${!!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')}`);
  console.log(`✅ CORS enabled for: http://localhost:3000, http://localhost:3001`);
})
