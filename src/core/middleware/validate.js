module.exports = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse(req.body);
    req.body = parsed;
    next();
  } catch (err) {
    // zod error
    const issues = err.errors ? err.errors.map(e => ({ path: e.path, message: e.message })) : [{ message: err.message }];
    return res.status(422).json({ status: false, errors: issues });
  }
};
