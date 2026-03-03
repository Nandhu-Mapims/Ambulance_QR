const { z } = require('zod');

const QUESTION_TYPES = ['YESNO', 'TEXT', 'NUMBER', 'DROPDOWN', 'DATE', 'PHOTO'];
const AMBULANCE_TYPES = ['BLS', 'ALS', 'TRANSPORT'];

const questionSchema = z
  .object({
    key: z.string().min(1, 'Question key is required'),
    label: z.string().min(1, 'Question label is required'),
    type: z.enum(QUESTION_TYPES, { required_error: 'Question type is required' }),
    required: z.boolean().default(true),
    options: z.array(z.string()).optional().default([]),
    requiresEvidenceIfNo: z.boolean().default(false),
    order: z.number().int().default(0),
  })
  .refine(
    (q) => q.type !== 'DROPDOWN' || (q.options && q.options.length > 0),
    { message: 'DROPDOWN questions must have at least one option', path: ['options'] }
  );

const createTemplateSchema = z.object({
  ambulanceType: z.enum(AMBULANCE_TYPES, { required_error: 'Ambulance type is required' }),
  name: z.string().min(2, 'Template name is required'),
  version: z.number().int().positive().default(1),
  questions: z
    .array(questionSchema)
    .min(1, 'At least one question is required'),
});

const updateTemplateSchema = createTemplateSchema.partial();

module.exports = { createTemplateSchema, updateTemplateSchema };
