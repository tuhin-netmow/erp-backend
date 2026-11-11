/**
 * Convert Zod field to human-readable type
 * Supports ZodOptional, ZodNullable, and basic Zod types
 */
function getZodTypeName(zodField) {
  const t = zodField._def.typeName;

  // Handle optional / nullable
  if (t === 'ZodOptional' || t === 'ZodNullable') {
    const innerType = getZodTypeName(zodField._def.innerType);
    return `${innerType} (optional)`;
  }

  // Map core Zod types to readable names
  const map = {
    ZodString: 'string',
    ZodNumber: 'number',
    ZodBoolean: 'boolean',
    ZodDate: 'date',
    ZodArray: 'array',
    ZodObject: 'object',
    ZodEnum: 'enum',
    ZodLiteral: 'literal',
    ZodUnion: 'union',
  };

  return map[t] || t;
}

/**
 * Wrap an Express handler and attach Zod fields metadata
 * @param {Function} handler - Express route handler
 * @param {ZodSchema} schema - Zod schema object
 * @returns {Function} wrapped handler with .fields
 */
function handlerWithFields(handler, schema) {
  const fn = (req, res, next) => handler(req, res, next);

  // Handle ZodEffects (e.g. .refine())
  let shape = schema.shape;
  if (!shape && schema._def && schema._def.schema) {
    shape = schema._def.schema.shape;
  }

  if (shape) {
    fn.fields = Object.entries(shape).map(([key, value]) => {
      const type = getZodTypeName(value);
      return `${key} (${type})`;
    });
  } else {
    fn.fields = [];
  }

  return fn;
}

module.exports = { getZodTypeName, handlerWithFields };
