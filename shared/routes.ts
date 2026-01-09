import { z } from 'zod';
import { 
  insertUserSchema, insertAuditorProfileSchema, insertVettingApplicationSchema, 
  insertAuditSchema, insertAuditAssignmentSchema, insertFindingSchema, insertFindingReviewSchema,
  users, auditorProfiles, vettingApplications, audits, auditAssignments, findings, findingReviews, reputationEvents
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  users: {
    me: {
      method: 'GET' as const,
      path: '/api/users/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/users',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: z.object({
        role: z.enum(['admin', 'auditor', 'client']).optional(),
        tier: z.enum(['observer', 'contributor', 'reviewer', 'lead', 'core']).optional(),
        status: z.enum(['applied', 'probation', 'active', 'removed']).optional(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    profile: {
      method: 'GET' as const,
      path: '/api/users/:id/profile',
      responses: {
        200: z.custom<typeof auditorProfiles.$inferSelect>().nullable(),
      },
    }
  },
  vetting: {
    apply: {
      method: 'POST' as const,
      path: '/api/vetting/apply',
      input: insertVettingApplicationSchema.extend({
        links: z.array(z.string()).optional(),
      }),
      responses: {
        201: z.custom<typeof vettingApplications.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/vetting',
      responses: {
        200: z.array(z.custom<typeof vettingApplications.$inferSelect & { user: typeof users.$inferSelect }>()),
      },
    },
    review: {
      method: 'POST' as const,
      path: '/api/vetting/:id/review',
      input: z.object({
        decision: z.enum(['accepted', 'rejected']),
        score: z.number().min(0).max(100),
        comments: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof vettingApplications.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  audits: {
    list: {
      method: 'GET' as const,
      path: '/api/audits',
      responses: {
        200: z.array(z.custom<typeof audits.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/audits',
      input: insertAuditSchema,
      responses: {
        201: z.custom<typeof audits.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/audits/:id',
      responses: {
        200: z.custom<typeof audits.$inferSelect & { assignments: (typeof auditAssignments.$inferSelect & { user: typeof users.$inferSelect })[] }>(),
        404: errorSchemas.notFound,
      },
    },
    assign: {
      method: 'POST' as const,
      path: '/api/audits/:id/assign',
      input: z.object({
        userId: z.string(), // Changed to string
        assignmentType: z.enum(['lead', 'reviewer']),
      }),
      responses: {
        201: z.custom<typeof auditAssignments.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  findings: {
    list: {
      method: 'GET' as const,
      path: '/api/audits/:auditId/findings',
      responses: {
        200: z.array(z.custom<typeof findings.$inferSelect & { author: typeof users.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/audits/:auditId/findings',
      input: insertFindingSchema,
      responses: {
        201: z.custom<typeof findings.$inferSelect>(),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/findings/:id',
      responses: {
        200: z.custom<typeof findings.$inferSelect & { reviews: (typeof findingReviews.$inferSelect & { reviewer: typeof users.$inferSelect })[] }>(),
        404: errorSchemas.notFound,
      },
    },
    review: {
      method: 'POST' as const,
      path: '/api/findings/:id/review',
      input: insertFindingReviewSchema,
      responses: {
        201: z.custom<typeof findingReviews.$inferSelect>(),
      },
    },
  },
  metrics: {
    get: {
      method: 'GET' as const,
      path: '/api/metrics',
      responses: {
        200: z.object({
          leaderboard: z.array(z.custom<typeof users.$inferSelect>()),
          stats: z.object({
            totalFindings: z.number(),
            acceptedFindings: z.number(),
            rejectedFindings: z.number(),
          }),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
