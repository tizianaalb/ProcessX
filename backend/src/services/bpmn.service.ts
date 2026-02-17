import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import { prisma } from './prisma';

// Map ProcessX step types to BPMN element names
const STEP_TYPE_TO_BPMN: Record<string, string> = {
  START: 'bpmn:startEvent',
  END: 'bpmn:endEvent',
  TASK: 'bpmn:task',
  USERTASK: 'bpmn:userTask',
  SYSTEMTASK: 'bpmn:serviceTask',
  DECISION: 'bpmn:exclusiveGateway',
  PARALLELGATEWAY: 'bpmn:parallelGateway',
  INCLUSIVEGATEWAY: 'bpmn:inclusiveGateway',
  EVENTGATEWAY: 'bpmn:eventBasedGateway',
  SUBPROCESS: 'bpmn:subProcess',
  TIMER: 'bpmn:intermediateCatchEvent',
  MESSAGEEVENT: 'bpmn:intermediateThrowEvent',
  ERROREVENT: 'bpmn:intermediateCatchEvent',
  SIGNALEVENT: 'bpmn:intermediateThrowEvent',
  ANNOTATION: 'bpmn:textAnnotation',
  DATAOBJECT: 'bpmn:dataObject',
};

// Map BPMN element names back to ProcessX types
const BPMN_TO_STEP_TYPE: Record<string, string> = {
  'bpmn:startEvent': 'START',
  'startEvent': 'START',
  'bpmn:endEvent': 'END',
  'endEvent': 'END',
  'bpmn:task': 'TASK',
  'task': 'TASK',
  'bpmn:userTask': 'USERTASK',
  'userTask': 'USERTASK',
  'bpmn:serviceTask': 'SYSTEMTASK',
  'serviceTask': 'SYSTEMTASK',
  'bpmn:scriptTask': 'SYSTEMTASK',
  'scriptTask': 'SYSTEMTASK',
  'bpmn:sendTask': 'TASK',
  'sendTask': 'TASK',
  'bpmn:receiveTask': 'TASK',
  'receiveTask': 'TASK',
  'bpmn:manualTask': 'USERTASK',
  'manualTask': 'USERTASK',
  'bpmn:businessRuleTask': 'SYSTEMTASK',
  'businessRuleTask': 'SYSTEMTASK',
  'bpmn:exclusiveGateway': 'DECISION',
  'exclusiveGateway': 'DECISION',
  'bpmn:parallelGateway': 'PARALLELGATEWAY',
  'parallelGateway': 'PARALLELGATEWAY',
  'bpmn:inclusiveGateway': 'INCLUSIVEGATEWAY',
  'inclusiveGateway': 'INCLUSIVEGATEWAY',
  'bpmn:eventBasedGateway': 'EVENTGATEWAY',
  'eventBasedGateway': 'EVENTGATEWAY',
  'bpmn:subProcess': 'SUBPROCESS',
  'subProcess': 'SUBPROCESS',
  'bpmn:intermediateCatchEvent': 'TIMER',
  'intermediateCatchEvent': 'TIMER',
  'bpmn:intermediateThrowEvent': 'MESSAGEEVENT',
  'intermediateThrowEvent': 'MESSAGEEVENT',
  'bpmn:boundaryEvent': 'ERROREVENT',
  'boundaryEvent': 'ERROREVENT',
};

// Default sizes for BPMNDI shapes
const SHAPE_SIZES: Record<string, { width: number; height: number }> = {
  START: { width: 36, height: 36 },
  END: { width: 36, height: 36 },
  TASK: { width: 100, height: 40 },
  USERTASK: { width: 100, height: 40 },
  SYSTEMTASK: { width: 100, height: 40 },
  DECISION: { width: 50, height: 50 },
  PARALLELGATEWAY: { width: 50, height: 50 },
  INCLUSIVEGATEWAY: { width: 50, height: 50 },
  EVENTGATEWAY: { width: 50, height: 50 },
  SUBPROCESS: { width: 120, height: 50 },
  TIMER: { width: 36, height: 36 },
  MESSAGEEVENT: { width: 36, height: 36 },
  ERROREVENT: { width: 36, height: 36 },
  SIGNALEVENT: { width: 36, height: 36 },
  ANNOTATION: { width: 100, height: 30 },
  DATAOBJECT: { width: 36, height: 50 },
};

export class BPMNService {
  /**
   * Export ProcessX process to BPMN 2.0 XML with proper element types and BPMNDI
   */
  static async exportToBPMN(processId: string, organizationId: string): Promise<string> {
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

    const processXmlId = `Process_${process.id.replace(/-/g, '')}`;

    // Build flow elements grouped by BPMN type
    const elementsByType: Record<string, any[]> = {};
    const sequenceFlows: any[] = [];
    const bpmndiShapes: any[] = [];
    const bpmndiEdges: any[] = [];

    // Create a mapping for step IDs to BPMN IDs
    const stepIdToBpmnId = new Map<string, string>();

    for (const step of process.steps) {
      const stepType = step.type.toUpperCase();
      const bpmnTag = STEP_TYPE_TO_BPMN[stepType] || 'bpmn:task';
      const bpmnId = `${stepType}_${step.id.replace(/-/g, '').substring(0, 12)}`;
      stepIdToBpmnId.set(step.id, bpmnId);

      // Collect incoming and outgoing flow IDs
      const incoming = process.connections
        .filter((c) => c.targetStepId === step.id)
        .map((c) => `Flow_${c.id.replace(/-/g, '').substring(0, 12)}`);

      const outgoing = process.connections
        .filter((c) => c.sourceStepId === step.id)
        .map((c) => `Flow_${c.id.replace(/-/g, '').substring(0, 12)}`);

      // Build element
      const element: any = {
        '@_id': bpmnId,
        '@_name': step.name,
      };

      if (step.description) {
        element['bpmn:documentation'] = step.description;
      }
      if (incoming.length > 0) {
        element['bpmn:incoming'] = incoming.length === 1 ? incoming[0] : incoming;
      }
      if (outgoing.length > 0) {
        element['bpmn:outgoing'] = outgoing.length === 1 ? outgoing[0] : outgoing;
      }

      // Add event definitions for intermediate events
      if (stepType === 'TIMER') {
        element['bpmn:timerEventDefinition'] = { '@_id': `TimerDef_${bpmnId}` };
      } else if (stepType === 'MESSAGEEVENT') {
        element['bpmn:messageEventDefinition'] = { '@_id': `MsgDef_${bpmnId}` };
      } else if (stepType === 'ERROREVENT') {
        element['bpmn:errorEventDefinition'] = { '@_id': `ErrDef_${bpmnId}` };
      } else if (stepType === 'SIGNALEVENT') {
        element['bpmn:signalEventDefinition'] = { '@_id': `SigDef_${bpmnId}` };
      }

      if (!elementsByType[bpmnTag]) {
        elementsByType[bpmnTag] = [];
      }
      elementsByType[bpmnTag].push(element);

      // BPMNDI shape
      const size = SHAPE_SIZES[stepType] || { width: 100, height: 40 };
      bpmndiShapes.push({
        '@_id': `${bpmnId}_di`,
        '@_bpmnElement': bpmnId,
        'dc:Bounds': {
          '@_x': Math.round(step.positionX),
          '@_y': Math.round(step.positionY),
          '@_width': size.width,
          '@_height': size.height,
        },
      });
    }

    // Build sequence flows
    for (const conn of process.connections) {
      const flowId = `Flow_${conn.id.replace(/-/g, '').substring(0, 12)}`;
      const sourceRef = stepIdToBpmnId.get(conn.sourceStepId);
      const targetRef = stepIdToBpmnId.get(conn.targetStepId);

      if (!sourceRef || !targetRef) continue;

      const flow: any = {
        '@_id': flowId,
        '@_sourceRef': sourceRef,
        '@_targetRef': targetRef,
      };
      if (conn.label) {
        flow['@_name'] = conn.label;
      }

      sequenceFlows.push(flow);

      // BPMNDI edge
      const sourceStep = process.steps.find((s) => s.id === conn.sourceStepId);
      const targetStep = process.steps.find((s) => s.id === conn.targetStepId);
      if (sourceStep && targetStep) {
        const sourceSize = SHAPE_SIZES[sourceStep.type.toUpperCase()] || { width: 100, height: 40 };
        const targetSize = SHAPE_SIZES[targetStep.type.toUpperCase()] || { width: 100, height: 40 };
        bpmndiEdges.push({
          '@_id': `${flowId}_di`,
          '@_bpmnElement': flowId,
          'di:waypoint': [
            {
              '@_x': Math.round(sourceStep.positionX + sourceSize.width / 2),
              '@_y': Math.round(sourceStep.positionY + sourceSize.height),
            },
            {
              '@_x': Math.round(targetStep.positionX + targetSize.width / 2),
              '@_y': Math.round(targetStep.positionY),
            },
          ],
        });
      }
    }

    // Build the process element
    const bpmnProcess: any = {
      '@_id': processXmlId,
      '@_name': process.name,
      '@_isExecutable': 'false',
    };

    // Add elements by type to the process
    for (const [tag, elements] of Object.entries(elementsByType)) {
      bpmnProcess[tag] = elements.length === 1 ? elements[0] : elements;
    }

    // Add sequence flows
    if (sequenceFlows.length > 0) {
      bpmnProcess['bpmn:sequenceFlow'] = sequenceFlows.length === 1 ? sequenceFlows[0] : sequenceFlows;
    }

    // Build BPMNDI diagram
    const bpmnDiagram: any = {
      '@_id': 'BPMNDiagram_1',
      'bpmndi:BPMNPlane': {
        '@_id': 'BPMNPlane_1',
        '@_bpmnElement': processXmlId,
        'bpmndi:BPMNShape': bpmndiShapes,
        'bpmndi:BPMNEdge': bpmndiEdges.length > 0 ? bpmndiEdges : undefined,
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
        '@_id': `Definitions_${process.id.replace(/-/g, '').substring(0, 12)}`,
        '@_targetNamespace': 'http://processx.example.com/schema/1.0/bpmn',
        '@_exporter': 'ProcessX',
        '@_exporterVersion': '1.0',
        'bpmn:process': bpmnProcess,
        'bpmndi:BPMNDiagram': bpmnDiagram,
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
   * Import BPMN 2.0 XML to ProcessX process — recognizes all element types and BPMNDI positions
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

      // Navigate to BPMN definitions
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

      // Extract BPMNDI position data if available
      const positionMap = new Map<string, { x: number; y: number }>();
      const bpmnDiagram = definitions['bpmndi:BPMNDiagram'] || definitions['BPMNDiagram'];
      if (bpmnDiagram) {
        const plane = bpmnDiagram['bpmndi:BPMNPlane'] || bpmnDiagram['BPMNPlane'];
        if (plane) {
          let shapes = plane['bpmndi:BPMNShape'] || plane['BPMNShape'] || [];
          if (!Array.isArray(shapes)) shapes = [shapes];
          for (const shape of shapes) {
            const elementId = shape['@_bpmnElement'];
            const bounds = shape['dc:Bounds'] || shape['Bounds'];
            if (elementId && bounds) {
              positionMap.set(elementId, {
                x: parseFloat(bounds['@_x']) || 0,
                y: parseFloat(bounds['@_y']) || 0,
              });
            }
          }
        }
      }

      // Collect all elements from the process
      const allElements: Array<{ bpmnId: string; name: string; type: string }> = [];

      // List of BPMN element tags to look for
      const elementTags = [
        'bpmn:startEvent', 'startEvent',
        'bpmn:endEvent', 'endEvent',
        'bpmn:task', 'task',
        'bpmn:userTask', 'userTask',
        'bpmn:serviceTask', 'serviceTask',
        'bpmn:scriptTask', 'scriptTask',
        'bpmn:sendTask', 'sendTask',
        'bpmn:receiveTask', 'receiveTask',
        'bpmn:manualTask', 'manualTask',
        'bpmn:businessRuleTask', 'businessRuleTask',
        'bpmn:exclusiveGateway', 'exclusiveGateway',
        'bpmn:parallelGateway', 'parallelGateway',
        'bpmn:inclusiveGateway', 'inclusiveGateway',
        'bpmn:eventBasedGateway', 'eventBasedGateway',
        'bpmn:subProcess', 'subProcess',
        'bpmn:intermediateCatchEvent', 'intermediateCatchEvent',
        'bpmn:intermediateThrowEvent', 'intermediateThrowEvent',
        'bpmn:boundaryEvent', 'boundaryEvent',
      ];

      for (const tag of elementTags) {
        let elements = bpmnProcess[tag];
        if (!elements) continue;
        if (!Array.isArray(elements)) elements = [elements];

        const processXType = BPMN_TO_STEP_TYPE[tag] || 'TASK';

        for (const el of elements) {
          const bpmnId = el['@_id'];
          const name = el['@_name'] || `${processXType} ${allElements.length + 1}`;
          allElements.push({ bpmnId, name, type: processXType });
        }
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
      const GRID_X = 300;
      const GRID_Y_START = 40;
      const GRID_Y_GAP = 120;

      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];

        // Use BPMNDI position if available, otherwise use vertical grid
        const pos = positionMap.get(el.bpmnId) || {
          x: GRID_X,
          y: GRID_Y_START + i * GRID_Y_GAP,
        };

        const step = await prisma.processStep.create({
          data: {
            processId: process.id,
            name: el.name,
            description: '',
            type: el.type,
            order: i,
            positionX: pos.x,
            positionY: pos.y,
          },
        });

        stepIdMap.set(el.bpmnId, step.id);
      }

      // Create connections
      const createdConnections = [];
      for (const flow of flows) {
        const sourceRef = flow['@_sourceRef'];
        const targetRef = flow['@_targetRef'];
        const flowName = flow['@_name'];

        const sourceStepId = stepIdMap.get(sourceRef);
        const targetStepId = stepIdMap.get(targetRef);

        if (sourceStepId && targetStepId) {
          const connection = await prisma.processConnection.create({
            data: {
              processId: process.id,
              sourceStepId,
              targetStepId,
              label: flowName || '',
              type: flowName ? 'CONDITIONAL' : 'DEFAULT',
            },
          });
          createdConnections.push(connection);
        }
      }

      return {
        success: true,
        message: `Successfully imported BPMN process with ${allElements.length} elements and ${createdConnections.length} connections`,
        process: {
          id: process.id,
          name: process.name,
          stepsCount: allElements.length,
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
