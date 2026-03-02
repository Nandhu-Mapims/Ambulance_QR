const { z } = require('zod');

const closeIssueSchema = z.object({
  key: z.string().min(1),
  actionText: z.string().min(1, 'Action text is required'),
  evidenceUrl: z.string().url().optional().nullable(),
});

const closeActionSchema = z.object({
  issues: z.array(closeIssueSchema).min(1, 'At least one issue resolution is required'),
});

module.exports = { closeActionSchema };
