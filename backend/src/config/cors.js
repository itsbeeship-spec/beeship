const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:3000'
];

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. same-origin static serving, LiteSpeed, server-side)
    if (!origin) {
      return callback(null, true);
    }
    
    if (
      allowedOrigins.indexOf(origin) !== -1 || 
      allowedOrigins.includes('*') ||
      process.env.NODE_ENV === 'production' ||
      origin.includes('hostingersite.com')
    ) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};
