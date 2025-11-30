import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Auto Claims Processing',
    description: 'Complete workflow for handling auto insurance claims from initial report through settlement and closure.',
    category: 'claims',
    industrySector: 'insurance',
    isPublic: true,
    templateData: {
      steps: [
        {
          id: 'step_0',
          name: 'Claim Reported',
          description: 'Customer reports accident or damage via phone, app, or website',
          type: 'START',
          duration: null,
          position: { x: 100, y: 200 },
          metadata: {
            responsibleRole: 'Claims Intake Specialist',
            department: 'Claims',
            requiredSystems: ['Claims Management System', 'CRM'],
          },
        },
        {
          id: 'step_1',
          name: 'Capture Claim Details',
          description: 'Gather incident information, policy details, and initial documentation',
          type: 'TASK',
          duration: 15,
          position: { x: 350, y: 200 },
          metadata: {
            responsibleRole: 'Claims Intake Specialist',
            department: 'Claims',
            requiredSystems: ['Claims Management System'],
          },
        },
        {
          id: 'step_2',
          name: 'Verify Coverage',
          description: 'Check policy status, coverage limits, and deductibles',
          type: 'TASK',
          duration: 10,
          position: { x: 600, y: 200 },
          metadata: {
            responsibleRole: 'Claims Analyst',
            department: 'Claims',
            requiredSystems: ['Policy Administration System'],
          },
        },
        {
          id: 'step_3',
          name: 'Coverage Valid?',
          description: 'Decision point: Is the claim covered under the policy?',
          type: 'DECISION',
          duration: 5,
          position: { x: 850, y: 200 },
          metadata: {
            responsibleRole: 'Claims Analyst',
            department: 'Claims',
          },
        },
        {
          id: 'step_4',
          name: 'Assign Adjuster',
          description: 'Route claim to appropriate claims adjuster based on complexity and location',
          type: 'TASK',
          duration: 5,
          position: { x: 1100, y: 100 },
          metadata: {
            responsibleRole: 'Claims Supervisor',
            department: 'Claims',
            requiredSystems: ['Workflow Management'],
          },
        },
        {
          id: 'step_5',
          name: 'Investigate Claim',
          description: 'Adjuster reviews evidence, inspects damage, and interviews involved parties',
          type: 'TASK',
          duration: 120,
          position: { x: 1350, y: 100 },
          metadata: {
            responsibleRole: 'Claims Adjuster',
            department: 'Claims',
            requiredSystems: ['Mobile Inspection App', 'Photo Management'],
          },
        },
        {
          id: 'step_6',
          name: 'Determine Settlement Amount',
          description: 'Calculate repair costs or total loss value based on investigation',
          type: 'TASK',
          duration: 30,
          position: { x: 1600, y: 100 },
          metadata: {
            responsibleRole: 'Claims Adjuster',
            department: 'Claims',
            requiredSystems: ['Estimating Software', 'Valuation Tools'],
          },
        },
        {
          id: 'step_7',
          name: 'Process Payment',
          description: 'Issue payment to claimant or repair facility',
          type: 'TASK',
          duration: 10,
          position: { x: 1850, y: 100 },
          metadata: {
            responsibleRole: 'Claims Processor',
            department: 'Claims',
            requiredSystems: ['Payment System'],
          },
        },
        {
          id: 'step_8',
          name: 'Close Claim',
          description: 'Finalize claim documentation and archive records',
          type: 'TASK',
          duration: 5,
          position: { x: 2100, y: 100 },
          metadata: {
            responsibleRole: 'Claims Processor',
            department: 'Claims',
            requiredSystems: ['Claims Management System', 'Document Management'],
          },
        },
        {
          id: 'step_9',
          name: 'Deny Claim',
          description: 'Send denial letter with explanation and appeal rights',
          type: 'TASK',
          duration: 15,
          position: { x: 1100, y: 300 },
          metadata: {
            responsibleRole: 'Claims Analyst',
            department: 'Claims',
            requiredSystems: ['Document Generation'],
          },
        },
        {
          id: 'step_10',
          name: 'Claim Completed',
          description: 'Claim process finished',
          type: 'END',
          duration: null,
          position: { x: 2350, y: 200 },
          metadata: {},
        },
      ],
      connections: [
        { sourceStepId: 'step_0', targetStepId: 'step_1', type: 'DEFAULT' },
        { sourceStepId: 'step_1', targetStepId: 'step_2', type: 'DEFAULT' },
        { sourceStepId: 'step_2', targetStepId: 'step_3', type: 'DEFAULT' },
        { sourceStepId: 'step_3', targetStepId: 'step_4', label: 'Yes', type: 'CONDITIONAL' },
        { sourceStepId: 'step_3', targetStepId: 'step_9', label: 'No', type: 'CONDITIONAL' },
        { sourceStepId: 'step_4', targetStepId: 'step_5', type: 'DEFAULT' },
        { sourceStepId: 'step_5', targetStepId: 'step_6', type: 'DEFAULT' },
        { sourceStepId: 'step_6', targetStepId: 'step_7', type: 'DEFAULT' },
        { sourceStepId: 'step_7', targetStepId: 'step_8', type: 'DEFAULT' },
        { sourceStepId: 'step_8', targetStepId: 'step_10', type: 'DEFAULT' },
        { sourceStepId: 'step_9', targetStepId: 'step_10', type: 'DEFAULT' },
      ],
    },
  },
  {
    name: 'Commercial Underwriting',
    description: 'Complete underwriting process for commercial property insurance from application through policy issuance.',
    category: 'underwriting',
    industrySector: 'insurance',
    isPublic: true,
    templateData: {
      steps: [
        {
          id: 'step_0',
          name: 'Application Received',
          description: 'New commercial insurance application submitted by broker or customer',
          type: 'START',
          duration: null,
          position: { x: 100, y: 200 },
          metadata: {
            responsibleRole: 'Underwriting Assistant',
            department: 'Underwriting',
          },
        },
        {
          id: 'step_1',
          name: 'Pre-Qualify Application',
          description: 'Review basic eligibility criteria and completeness of submission',
          type: 'TASK',
          duration: 20,
          position: { x: 350, y: 200 },
          metadata: {
            responsibleRole: 'Underwriting Assistant',
            department: 'Underwriting',
            requiredSystems: ['Underwriting Workbench'],
          },
        },
        {
          id: 'step_2',
          name: 'Conduct Risk Assessment',
          description: 'Analyze property characteristics, location hazards, and business operations',
          type: 'TASK',
          duration: 90,
          position: { x: 600, y: 200 },
          metadata: {
            responsibleRole: 'Senior Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Risk Modeling System', 'GIS Tools'],
          },
        },
        {
          id: 'step_3',
          name: 'Order Inspections',
          description: 'Request property inspection and loss control survey if needed',
          type: 'TASK',
          duration: 15,
          position: { x: 850, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Inspection Scheduling System'],
          },
        },
        {
          id: 'step_4',
          name: 'Calculate Premium',
          description: 'Determine pricing based on risk factors, exposure, and rate manual',
          type: 'TASK',
          duration: 45,
          position: { x: 1100, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Rating Engine', 'Pricing Tools'],
          },
        },
        {
          id: 'step_5',
          name: 'Prepare Quote',
          description: 'Generate formal quote document with terms and conditions',
          type: 'TASK',
          duration: 30,
          position: { x: 1350, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Document Generation'],
          },
        },
        {
          id: 'step_6',
          name: 'Quote Approved?',
          description: 'Customer accepts quote and provides payment?',
          type: 'DECISION',
          duration: null,
          position: { x: 1600, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
          },
        },
        {
          id: 'step_7',
          name: 'Bind Coverage',
          description: 'Activate coverage and generate binder confirmation',
          type: 'TASK',
          duration: 15,
          position: { x: 1850, y: 100 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Policy Administration System'],
          },
        },
        {
          id: 'step_8',
          name: 'Issue Policy',
          description: 'Generate and deliver final policy documents',
          type: 'TASK',
          duration: 20,
          position: { x: 2100, y: 100 },
          metadata: {
            responsibleRole: 'Policy Services',
            department: 'Underwriting',
            requiredSystems: ['Policy Administration System', 'Document Management'],
          },
        },
        {
          id: 'step_9',
          name: 'Decline Application',
          description: 'Send declination notice with reason',
          type: 'TASK',
          duration: 10,
          position: { x: 1850, y: 300 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Document Generation'],
          },
        },
        {
          id: 'step_10',
          name: 'Process Complete',
          description: 'Underwriting process finished',
          type: 'END',
          duration: null,
          position: { x: 2350, y: 200 },
          metadata: {},
        },
      ],
      connections: [
        { sourceStepId: 'step_0', targetStepId: 'step_1', type: 'DEFAULT' },
        { sourceStepId: 'step_1', targetStepId: 'step_2', type: 'DEFAULT' },
        { sourceStepId: 'step_2', targetStepId: 'step_3', type: 'DEFAULT' },
        { sourceStepId: 'step_3', targetStepId: 'step_4', type: 'DEFAULT' },
        { sourceStepId: 'step_4', targetStepId: 'step_5', type: 'DEFAULT' },
        { sourceStepId: 'step_5', targetStepId: 'step_6', type: 'DEFAULT' },
        { sourceStepId: 'step_6', targetStepId: 'step_7', label: 'Accepted', type: 'CONDITIONAL' },
        { sourceStepId: 'step_6', targetStepId: 'step_9', label: 'Declined', type: 'CONDITIONAL' },
        { sourceStepId: 'step_7', targetStepId: 'step_8', type: 'DEFAULT' },
        { sourceStepId: 'step_8', targetStepId: 'step_10', type: 'DEFAULT' },
        { sourceStepId: 'step_9', targetStepId: 'step_10', type: 'DEFAULT' },
      ],
    },
  },
  {
    name: 'Policy Renewal Process',
    description: 'Annual policy renewal workflow including re-underwriting, rate adjustment, and renewal confirmation.',
    category: 'policy',
    industrySector: 'insurance',
    isPublic: true,
    templateData: {
      steps: [
        {
          id: 'step_0',
          name: 'Renewal Date Approaching',
          description: 'System identifies policies due for renewal in 60 days',
          type: 'START',
          duration: null,
          position: { x: 100, y: 200 },
          metadata: {
            department: 'Policy Administration',
            requiredSystems: ['Policy Administration System'],
          },
        },
        {
          id: 'step_1',
          name: 'Review Policy Performance',
          description: 'Analyze claims history, loss ratio, and payment history',
          type: 'TASK',
          duration: 30,
          position: { x: 350, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Analytics Platform'],
          },
        },
        {
          id: 'step_2',
          name: 'Re-Underwrite Risk',
          description: 'Reassess risk factors and update risk classification',
          type: 'TASK',
          duration: 45,
          position: { x: 600, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Underwriting Workbench'],
          },
        },
        {
          id: 'step_3',
          name: 'Calculate Renewal Premium',
          description: 'Apply rate changes, update exposures, and calculate new premium',
          type: 'TASK',
          duration: 25,
          position: { x: 850, y: 200 },
          metadata: {
            responsibleRole: 'Underwriter',
            department: 'Underwriting',
            requiredSystems: ['Rating Engine'],
          },
        },
        {
          id: 'step_4',
          name: 'Generate Renewal Offer',
          description: 'Create renewal notice with new terms and premium',
          type: 'TASK',
          duration: 15,
          position: { x: 1100, y: 200 },
          metadata: {
            responsibleRole: 'Policy Services',
            department: 'Policy Administration',
            requiredSystems: ['Document Generation'],
          },
        },
        {
          id: 'step_5',
          name: 'Send Renewal Notice',
          description: 'Mail or email renewal offer to policyholder 30-45 days before expiration',
          type: 'TASK',
          duration: 5,
          position: { x: 1350, y: 200 },
          metadata: {
            responsibleRole: 'Policy Services',
            department: 'Policy Administration',
            requiredSystems: ['Email System', 'Postal Service'],
          },
        },
        {
          id: 'step_6',
          name: 'Customer Response?',
          description: 'Did customer accept renewal?',
          type: 'DECISION',
          duration: null,
          position: { x: 1600, y: 200 },
          metadata: {
            department: 'Policy Administration',
          },
        },
        {
          id: 'step_7',
          name: 'Process Renewal Payment',
          description: 'Collect and apply renewal premium payment',
          type: 'TASK',
          duration: 10,
          position: { x: 1850, y: 100 },
          metadata: {
            responsibleRole: 'Billing Specialist',
            department: 'Billing',
            requiredSystems: ['Payment Processing System'],
          },
        },
        {
          id: 'step_8',
          name: 'Issue Renewed Policy',
          description: 'Generate new policy documents for renewal term',
          type: 'TASK',
          duration: 15,
          position: { x: 2100, y: 100 },
          metadata: {
            responsibleRole: 'Policy Services',
            department: 'Policy Administration',
            requiredSystems: ['Policy Administration System'],
          },
        },
        {
          id: 'step_9',
          name: 'Cancel Policy',
          description: 'Process non-renewal and send cancellation confirmation',
          type: 'TASK',
          duration: 10,
          position: { x: 1850, y: 300 },
          metadata: {
            responsibleRole: 'Policy Services',
            department: 'Policy Administration',
            requiredSystems: ['Policy Administration System'],
          },
        },
        {
          id: 'step_10',
          name: 'Renewal Complete',
          description: 'Renewal process finished',
          type: 'END',
          duration: null,
          position: { x: 2350, y: 200 },
          metadata: {},
        },
      ],
      connections: [
        { sourceStepId: 'step_0', targetStepId: 'step_1', type: 'DEFAULT' },
        { sourceStepId: 'step_1', targetStepId: 'step_2', type: 'DEFAULT' },
        { sourceStepId: 'step_2', targetStepId: 'step_3', type: 'DEFAULT' },
        { sourceStepId: 'step_3', targetStepId: 'step_4', type: 'DEFAULT' },
        { sourceStepId: 'step_4', targetStepId: 'step_5', type: 'DEFAULT' },
        { sourceStepId: 'step_5', targetStepId: 'step_6', type: 'DEFAULT' },
        { sourceStepId: 'step_6', targetStepId: 'step_7', label: 'Accepted', type: 'CONDITIONAL' },
        { sourceStepId: 'step_6', targetStepId: 'step_9', label: 'Declined', type: 'CONDITIONAL' },
        { sourceStepId: 'step_7', targetStepId: 'step_8', type: 'DEFAULT' },
        { sourceStepId: 'step_8', targetStepId: 'step_10', type: 'DEFAULT' },
        { sourceStepId: 'step_9', targetStepId: 'step_10', type: 'DEFAULT' },
      ],
    },
  },
];

export async function seedTemplates() {
  console.log('🌱 Seeding process templates...');

  for (const template of templates) {
    try {
      const existing = await prisma.processTemplate.findFirst({
        where: {
          name: template.name,
        },
      });

      if (existing) {
        console.log(`⏭️  Template "${template.name}" already exists, skipping...`);
        continue;
      }

      await prisma.processTemplate.create({
        data: template,
      });

      console.log(`✅ Created template: ${template.name}`);
    } catch (error) {
      console.error(`❌ Error creating template "${template.name}":`, error);
    }
  }

  console.log('✨ Template seeding complete!');
}

// Run if executed directly (ES module way)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  seedTemplates()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
