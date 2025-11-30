import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { prisma } from './prisma';

interface BPMNProcess {
  id: string;
  name: string;
  description?: string;
  steps: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    position?: { x: number; y: number };
  }>;
  connections: Array<{
    id: string;
    sourceStepId: string;
    targetStepId: string;
    label?: string;
  }>;
}

export class BPMNService {
  /**
   * Export ProcessX process to BPMN 2.0 XML
   */
  static async exportToBPMN(processId: string, organizationId: string): Promise<string> {
    // Fetch process data
    const process = await prisma.process.findFirst({
      where: {
        id: processId,
        organizationId,
      },
      include: {
        steps: {
          orderBy: { order: 'asc' },
        },
        connections: true,
      },
    });

    if (!process) {
      throw new Error('Process not found');
    }

    // Build BPMN structure
    const bpmnProcess = {
      process: {
        '@_id': `Process_${process.id.replace(/-/g, '')}`,
        '@_name': process.name,
        '@_isExecutable': 'false',
        startEvent: {
          '@_id': 'StartEvent_1',
          '@_name': 'Start',
          outgoing: process.steps.length > 0 ? `Flow_to_${process.steps[0].id.replace(/-/g, '')}` : undefined,
        },
        task: process.steps.map((step, index) => {
          const incoming = [];
          const outgoing = [];

          // Find incoming connections
          process.connections
            .filter((c) => c.targetStepId === step.id)
            .forEach((c) => {
              incoming.push(`Flow_${c.id.replace(/-/g, '')}`);
            });

          // Find outgoing connections
          process.connections
            .filter((c) => c.sourceStepId === step.id)
            .forEach((c) => {
              outgoing.push(`Flow_${c.id.replace(/-/g, '')}`);
            });

          // If first step, add start event connection
          if (index === 0) {
            incoming.push(`Flow_to_${step.id.replace(/-/g, '')}`);
          }

          // If last step, add end event connection
          if (index === process.steps.length - 1 && outgoing.length === 0) {
            outgoing.push(`Flow_to_End`);
          }

          return {
            '@_id': `Task_${step.id.replace(/-/g, '')}`,
            '@_name': step.name,
            documentation: step.description || undefined,
            incoming: incoming.length > 0 ? incoming : undefined,
            outgoing: outgoing.length > 0 ? outgoing : undefined,
          };
        }),
        endEvent: {
          '@_id': 'EndEvent_1',
          '@_name': 'End',
          incoming: process.steps.length > 0 ? `Flow_to_End` : undefined,
        },
        sequenceFlow: [
          // Start to first step
          ...(process.steps.length > 0
            ? [
                {
                  '@_id': `Flow_to_${process.steps[0].id.replace(/-/g, '')}`,
                  '@_sourceRef': 'StartEvent_1',
                  '@_targetRef': `Task_${process.steps[0].id.replace(/-/g, '')}`,
                },
              ]
            : []),
          // Connections between steps
          ...process.connections.map((conn) => ({
            '@_id': `Flow_${conn.id.replace(/-/g, '')}`,
            '@_sourceRef': `Task_${conn.sourceStepId.replace(/-/g, '')}`,
            '@_targetRef': `Task_${conn.targetStepId.replace(/-/g, '')}`,
            '@_name': conn.label || undefined,
          })),
          // Last step to end
          ...(process.steps.length > 0
            ? [
                {
                  '@_id': 'Flow_to_End',
                  '@_sourceRef': `Task_${process.steps[process.steps.length - 1].id.replace(/-/g, '')}`,
                  '@_targetRef': 'EndEvent_1',
                },
              ]
            : []),
        ],
      },
    };

    const bpmnDoc = {
      '?xml': {
        '@_version': '1.0',
        '@_encoding': 'UTF-8',
      },
      'bpmn:definitions': {
        '@_xmlns:bpmn': 'http://www.omg.org/spec/BPMN/20100524/MODEL',
        '@_xmlns:bpmndi': 'http://www.omg.org/spec/BPMN/20100524/DI',
        '@_xmlns:dc': 'http://www.omg.org/spec/DD/20100524/DC',
        '@_xmlns:di': 'http://www.omg.org/spec/DD/20100524/DI',
        '@_id': `Definitions_${process.id.replace(/-/g, '')}`,
        '@_targetNamespace': 'http://processx.example.com/schema/1.0/bpmn',
        'bpmn:process': bpmnProcess.process,
      },
    };

    const builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      attributeNamePrefix: '@_',
    });

    return builder.build(bpmnDoc);
  }

  /**
   * Import BPMN 2.0 XML to ProcessX process
   */
  static async importFromBPMN(
    xmlContent: string,
    organizationId: string,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    process?: any;
  }> {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
        parseAttributeValue: false,
      });

      const parsed = parser.parse(xmlContent);

      // Navigate to BPMN process
      const definitions = parsed['bpmn:definitions'] || parsed['definitions'];
      if (!definitions) {
        throw new Error('Invalid BPMN file: missing definitions');
      }

      const bpmnProcess = definitions['bpmn:process'] || definitions['process'];
      if (!bpmnProcess) {
        throw new Error('Invalid BPMN file: missing process');
      }

      const processName = bpmnProcess['@_name'] || 'Imported BPMN Process';
      const processId = bpmnProcess['@_id'];

      // Extract tasks
      let tasks = bpmnProcess['bpmn:task'] || bpmnProcess['task'] || [];
      if (!Array.isArray(tasks)) {
        tasks = [tasks];
      }

      // Extract sequence flows
      let flows = bpmnProcess['bpmn:sequenceFlow'] || bpmnProcess['sequenceFlow'] || [];
      if (!Array.isArray(flows)) {
        flows = [flows];
      }

      // Create ProcessX process
      const process = await prisma.process.create({
        data: {
          name: processName,
          description: `Imported from BPMN (ID: ${processId})`,
          type: 'AS_IS',
          category: 'imported',
          status: 'DRAFT',
          version: 1,
          organizationId,
          createdById: userId,
        },
      });

      // Create steps with mapping
      const stepIdMap = new Map<string, string>();

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];
        const taskId = task['@_id'];
        const taskName = task['@_name'] || `Step ${i + 1}`;
        const documentation = task['bpmn:documentation'] || task['documentation'] || '';

        const step = await prisma.processStep.create({
          data: {
            processId: process.id,
            name: taskName,
            description: typeof documentation === 'string' ? documentation : JSON.stringify(documentation),
            type: 'TASK',
            order: i,
            positionX: 100 + i * 200,
            positionY: 100,
          },
        });

        stepIdMap.set(taskId, step.id);
      }

      // Create connections
      const createdConnections = [];
      for (const flow of flows) {
        const sourceRef = flow['@_sourceRef'];
        const targetRef = flow['@_targetRef'];
        const flowName = flow['@_name'];

        // Skip start/end event connections
        if (sourceRef.includes('StartEvent') || targetRef.includes('EndEvent')) {
          continue;
        }

        const sourceStepId = stepIdMap.get(sourceRef);
        const targetStepId = stepIdMap.get(targetRef);

        if (sourceStepId && targetStepId) {
          const connection = await prisma.processConnection.create({
            data: {
              processId: process.id,
              sourceStepId,
              targetStepId,
              label: flowName || '',
            },
          });
          createdConnections.push(connection);
        }
      }

      return {
        success: true,
        message: `Successfully imported BPMN process with ${tasks.length} steps and ${createdConnections.length} connections`,
        process: {
          id: process.id,
          name: process.name,
          stepsCount: tasks.length,
          connectionsCount: createdConnections.length,
        },
      };
    } catch (error) {
      console.error('BPMN import error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to import BPMN file',
      };
    }
  }
}
