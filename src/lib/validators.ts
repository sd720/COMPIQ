import { z } from 'zod';

export const salarySubmissionSchema = z.object({
  companyName: z.string().min(2, 'Company name required').max(100),
  role: z.string().min(2, 'Role required').max(100),
  roleCategory: z.enum([
    'SOFTWARE_ENGINEERING', 'DATA_SCIENCE', 'PRODUCT_MANAGEMENT',
    'DESIGN', 'DEVOPS', 'SECURITY', 'MANAGEMENT', 'SALES', 'MARKETING', 'FINANCE', 'HR', 'OTHER'
  ]),
  level: z.string().min(1, 'Level required').max(50),
  yearsOfExperience: z.number().min(0).max(50),
  baseSalary: z.number().min(0, 'Base salary must be positive').max(10000),
  bonus: z.number().min(0).max(10000).optional(),
  equity: z.number().min(0).max(10000).optional(),
  city: z.enum(['BANGALORE', 'MUMBAI', 'DELHI', 'HYDERABAD', 'PUNE', 'CHENNAI', 'KOLKATA', 'NOIDA', 'GURGAON', 'REMOTE', 'OTHER']),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
  gender: z.string().optional(),
  education: z.string().optional(),
  anonymous: z.boolean().optional(),
});

export type SalarySubmission = z.infer<typeof salarySubmissionSchema>;

export const salaryFilterSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  roleCategory: z.string().optional(),
  level: z.string().optional(),
  city: z.string().optional(),
  minYoe: z.number().optional(),
  maxYoe: z.number().optional(),
  minTC: z.number().optional(),
  maxTC: z.number().optional(),
  sortBy: z.enum(['totalCompensation', 'baseSalary', 'submittedAt', 'yearsOfExperience']).default('totalCompensation'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(25),
});

export type SalaryFilter = z.infer<typeof salaryFilterSchema>;

export const csvRowSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  level: z.string().min(1),
  years_of_experience: z.string().transform(Number),
  base_salary_lpa: z.string().transform(Number),
  bonus_lpa: z.string().transform(Number).optional(),
  equity_lpa: z.string().transform(Number).optional(),
  city: z.string().min(1),
  role_category: z.string().optional(),
});
