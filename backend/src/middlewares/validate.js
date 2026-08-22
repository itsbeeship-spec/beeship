/**
 * Express middleware to validate incoming request data against a Zod schema.
 * Supports validation of req.body, req.query, and req.params.
 * 
 * @param {import('zod').ZodSchema} schema
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Assign parsed values back (sanitizes unneeded fields)
    if (parsed.body) req.body = parsed.body;
    if (parsed.query) req.query = parsed.query;
    if (parsed.params) req.params = parsed.params;

    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const details = (error.errors || error.issues || []).map((err) => ({
        field: err.path.slice(1).join('.') || err.path[0], // removes 'body'/'query'/'params' prefix
        message: err.message,
      }));
      
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          statusCode: 400,
          details,
        },
      });
    }

    next(error);
  }
};


