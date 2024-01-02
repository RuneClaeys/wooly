import { z } from 'zod';

export const genericSort = z
   .object({
      orderBy: z.enum(['name', 'createdAt', 'updatedAt']).optional().default('createdAt'),
      order: z.enum(['asc', 'desc']).optional().default('desc'),
   })
   .optional()
   .default({ orderBy: 'createdAt', order: 'desc' });
