export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      details: result.error.issues
    });
  }
  req.validated = result.data;
  next();
};
