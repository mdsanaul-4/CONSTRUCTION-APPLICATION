export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters.',
        errors: result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
      });
    }
    req.query = result.data;
    next();
  };
}
