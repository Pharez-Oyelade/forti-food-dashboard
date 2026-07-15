/**
 * Express middleware factory that validates `req.body` against a Zod schema.
 * Returns 400 with per-field error details when validation fails.
 *
 * @param {import('zod').ZodSchema} zodSchema - The Zod schema to validate against.
 */
export function validate(zodSchema) {
  return (req, res, next) => {
    const result = zodSchema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }

    // Replace body with the parsed (and possibly transformed) data
    req.body = result.data;
    next();
  };
}
