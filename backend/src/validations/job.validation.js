const { z } = require('zod');

const getJob = {
  params: z.object({
    id: z.string().uuid('Invalid Job ID format'),
  }),
};

const getJobs = {
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
  }),
};

const deleteJob = {
  params: z.object({
    id: z.string().uuid('Invalid Job ID format'),
  }),
};

const retryJob = {
  params: z.object({
    id: z.string().uuid('Invalid Job ID format'),
  }),
};

const downloadJob = {
  params: z.object({
    id: z.string().uuid('Invalid Job ID format'),
  }),
};

module.exports = {
  getJob,
  getJobs,
  deleteJob,
  retryJob,
  downloadJob,
};
