export const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      
      // Production
      'https://cronos-health-frontend-deploy.vercel.app',
      'https://cronos-health-frontend-deploy.vercel.app/',
        'https://cronos-health-frontend-deploy-git-main-darioques-projects.vercel.app/',
        'https://cronos-health-frontend-deploy-git-main-darioques-projects.vercel.app',
        'https://cronos-health-frontend-deploy-ls7nlvd06-darioques-projects.vercel.app/',
        'https://cronos-health-frontend-deploy-ls7nlvd06-darioques-projects.vercel.app',
    
    ];

    // Development: allow any localhost
    if (process.env.NODE_ENV === 'development' && origin?.includes('localhost')) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type', 
    'Accept',
    'Authorization',
    'x-auth-token'
  ],
  optionsSuccessStatus: 200,
  maxAge: 86400
};