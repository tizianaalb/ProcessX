/**
 * Template Category Configuration
 * Defines the hierarchical structure of insurance industry process templates
 */

export interface TemplateSubcategory {
  key: string;
  label: string;
  description: string;
}

export interface TemplateCategory {
  key: string;
  label: string;
  description: string;
  icon: string; // Lucide icon name
  order: number;
  subcategories: TemplateSubcategory[];
}

export const TEMPLATE_CATEGORIES: Record<string, TemplateCategory> = {
  underwriting: {
    key: 'underwriting',
    label: 'Underwriting',
    description: 'Risk assessment, policy issuance, and underwriting workflows',
    icon: 'FileCheck',
    order: 1,
    subcategories: [
      {
        key: 'risk_assessment',
        label: 'Risk Assessment',
        description: 'Evaluating potential risks associated with insuring a client',
      },
      {
        key: 'policy_issuance',
        label: 'Policy Issuance',
        description: 'Creating and issuing insurance policies based on underwriting decisions',
      },
      {
        key: 'premium_calculation',
        label: 'Premium Calculation',
        description: 'Determining appropriate premiums based on risk factors',
      },
      {
        key: 'policy_renewal',
        label: 'Policy Renewal',
        description: 'Reviewing and renewing existing policies',
      },
    ],
  },

  claims: {
    key: 'claims',
    label: 'Claims Management',
    description: 'End-to-end claims processing and fraud detection',
    icon: 'AlertCircle',
    order: 2,
    subcategories: [
      {
        key: 'registration',
        label: 'Claims Registration',
        description: 'Recording and documenting claims received from policyholders',
      },
      {
        key: 'investigation',
        label: 'Claims Investigation',
        description: 'Investigating the validity and details of a claim',
      },
      {
        key: 'settlement',
        label: 'Claims Settlement',
        description: 'Processing and settling valid claims, including payments',
      },
      {
        key: 'fraud_detection',
        label: 'Fraud Detection',
        description: 'Identifying and managing fraudulent claims',
      },
    ],
  },

  reinsurance: {
    key: 'reinsurance',
    label: 'Reinsurance',
    description: 'Reinsurance placement, administration, and recovery processes',
    icon: 'Shield',
    order: 3,
    subcategories: [
      {
        key: 'placement',
        label: 'Reinsurance Placement',
        description: "Securing reinsurance coverage for the company's underwritten risks",
      },
      {
        key: 'administration',
        label: 'Reinsurance Administration',
        description: 'Managing reinsurance contracts and ensuring compliance',
      },
      {
        key: 'recovery',
        label: 'Reinsurance Recovery',
        description: 'Collecting payments from reinsurers for claims covered under reinsurance agreements',
      },
    ],
  },

  customer_service: {
    key: 'customer_service',
    label: 'Customer Service',
    description: 'Customer onboarding, support, and policy service operations',
    icon: 'Users',
    order: 4,
    subcategories: [
      {
        key: 'onboarding',
        label: 'Customer Onboarding',
        description: 'Assisting new customers with the application and policy issuance process',
      },
      {
        key: 'support',
        label: 'Customer Support',
        description: 'Providing ongoing support and addressing customer inquiries and issues',
      },
      {
        key: 'policy_service',
        label: 'Policy Service',
        description: 'Handling policy changes, updates, and cancellations',
      },
    ],
  },

  financial: {
    key: 'financial',
    label: 'Financial Management',
    description: 'Premium billing, financial reporting, and investment management',
    icon: 'DollarSign',
    order: 5,
    subcategories: [
      {
        key: 'billing',
        label: 'Premium Billing',
        description: 'Invoicing and collecting premiums from policyholders',
      },
      {
        key: 'reporting',
        label: 'Financial Reporting',
        description: 'Preparing and reporting financial statements and performance metrics',
      },
      {
        key: 'investment',
        label: 'Investment Management',
        description: "Managing the company's investment portfolio to ensure financial stability",
      },
    ],
  },

  compliance: {
    key: 'compliance',
    label: 'Compliance & Risk',
    description: 'Regulatory compliance, risk monitoring, and internal audit processes',
    icon: 'Scale',
    order: 6,
    subcategories: [
      {
        key: 'regulatory',
        label: 'Regulatory Compliance',
        description: 'Ensuring adherence to legal and regulatory requirements',
      },
      {
        key: 'monitoring',
        label: 'Risk Monitoring',
        description: 'Continuously monitoring and assessing risks to the company',
      },
      {
        key: 'audit',
        label: 'Internal Audit',
        description: 'Conducting internal audits to ensure operational efficiency and compliance',
      },
    ],
  },

  marketing: {
    key: 'marketing',
    label: 'Marketing & Sales',
    description: 'Market research, product development, and sales management',
    icon: 'TrendingUp',
    order: 7,
    subcategories: [
      {
        key: 'research',
        label: 'Market Research',
        description: 'Analyzing market trends and customer needs to develop effective products',
      },
      {
        key: 'product_dev',
        label: 'Product Development',
        description: 'Designing and developing new insurance products',
      },
      {
        key: 'sales',
        label: 'Sales Management',
        description: 'Managing the sales process, including lead generation and performance analysis',
      },
    ],
  },

  it_data: {
    key: 'it_data',
    label: 'IT & Data Management',
    description: 'System maintenance, data analysis, and cybersecurity',
    icon: 'Server',
    order: 8,
    subcategories: [
      {
        key: 'maintenance',
        label: 'System Maintenance',
        description: 'Maintaining and updating IT systems and infrastructure',
      },
      {
        key: 'analysis',
        label: 'Data Analysis',
        description: 'Analyzing data to improve underwriting, claims, and customer service processes',
      },
      {
        key: 'cybersecurity',
        label: 'Cybersecurity',
        description: "Protecting the company's data and systems from cyber threats",
      },
    ],
  },

  hr: {
    key: 'hr',
    label: 'Human Resources',
    description: 'Recruitment, training & development, and performance management',
    icon: 'Briefcase',
    order: 9,
    subcategories: [
      {
        key: 'recruitment',
        label: 'Recruitment',
        description: 'Hiring and onboarding new employees',
      },
      {
        key: 'training',
        label: 'Training & Development',
        description: 'Providing ongoing training and professional development opportunities',
      },
      {
        key: 'performance',
        label: 'Performance Management',
        description: 'Evaluating and managing employee performance',
      },
    ],
  },
};

/**
 * Get all categories sorted by order
 */
export const getCategoriesSorted = (): TemplateCategory[] => {
  return Object.values(TEMPLATE_CATEGORIES).sort((a, b) => a.order - b.order);
};

/**
 * Get category by key
 */
export const getCategoryByKey = (key: string): TemplateCategory | undefined => {
  return TEMPLATE_CATEGORIES[key];
};

/**
 * Get subcategory by keys
 */
export const getSubcategoryByKeys = (
  categoryKey: string,
  subcategoryKey: string
): TemplateSubcategory | undefined => {
  const category = TEMPLATE_CATEGORIES[categoryKey];
  return category?.subcategories.find((sub) => sub.key === subcategoryKey);
};

/**
 * Get formatted category label
 */
export const getCategoryLabel = (categoryKey: string): string => {
  return TEMPLATE_CATEGORIES[categoryKey]?.label || categoryKey;
};

/**
 * Get formatted subcategory label
 */
export const getSubcategoryLabel = (categoryKey: string, subcategoryKey: string): string => {
  const subcategory = getSubcategoryByKeys(categoryKey, subcategoryKey);
  return subcategory?.label || subcategoryKey;
};

/**
 * Get total count of all subcategories
 */
export const getTotalSubcategoryCount = (): number => {
  return Object.values(TEMPLATE_CATEGORIES).reduce(
    (total, category) => total + category.subcategories.length,
    0
  );
};
