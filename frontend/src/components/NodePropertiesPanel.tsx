import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface NodePropertiesPanelProps {
  node: any;
  onClose: () => void;
  onSave: (nodeId: string, data: any) => void;
}

export const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  node,
  onClose,
  onSave,
}) => {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [duration, setDuration] = useState(node.data.duration || '');

  // UserTask specific
  const [assignee, setAssignee] = useState(node.data.assignee || '');
  const [dueDate, setDueDate] = useState(node.data.dueDate || '');
  const [priority, setPriority] = useState(node.data.priority || 'medium');

  // SystemTask specific
  const [serviceName, setServiceName] = useState(node.data.serviceName || '');
  const [endpoint, setEndpoint] = useState(node.data.endpoint || '');
  const [retryPolicy, setRetryPolicy] = useState(node.data.retryPolicy || '3');

  // Timer specific
  const [timerType, setTimerType] = useState(node.data.timerType || 'delay');
  const [schedule, setSchedule] = useState(node.data.schedule || '');

  // Subprocess specific
  const [subprocessRef, setSubprocessRef] = useState(node.data.subprocessRef || '');
  const [loopType, setLoopType] = useState(node.data.loopType || 'none');

  // ParallelGateway specific
  const [gatewayType, setGatewayType] = useState(node.data.gatewayType || 'fork');

  useEffect(() => {
    setLabel(node.data.label || '');
    setDescription(node.data.description || '');
    setDuration(node.data.duration || '');
    setAssignee(node.data.assignee || '');
    setDueDate(node.data.dueDate || '');
    setPriority(node.data.priority || 'medium');
    setServiceName(node.data.serviceName || '');
    setEndpoint(node.data.endpoint || '');
    setRetryPolicy(node.data.retryPolicy || '3');
    setTimerType(node.data.timerType || 'delay');
    setSchedule(node.data.schedule || '');
    setSubprocessRef(node.data.subprocessRef || '');
    setLoopType(node.data.loopType || 'none');
    setGatewayType(node.data.gatewayType || 'fork');
  }, [node]);

  const handleSave = () => {
    onSave(node.id, {
      ...node.data,
      label,
      description,
      duration: duration ? parseInt(duration) : undefined,
      assignee,
      dueDate,
      priority,
      serviceName,
      endpoint,
      retryPolicy: retryPolicy ? parseInt(retryPolicy) : undefined,
      timerType,
      schedule,
      subprocessRef,
      loopType,
      gatewayType,
    });
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-40">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="font-semibold text-gray-900">Node Properties</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node Type
          </label>
          <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-600 capitalize">
            {node.type}
          </div>
        </div>

        <div>
          <label htmlFor="node-label" className="block text-sm font-medium text-gray-700 mb-1">
            Label *
          </label>
          <Input
            id="node-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter node label"
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="node-description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="node-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter description (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
          />
        </div>

        {(node.type === 'task' || node.type === 'userTask' || node.type === 'systemTask') && (
          <div>
            <label htmlFor="node-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <Input
              id="node-duration"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="0"
              className="w-full"
              min="0"
            />
          </div>
        )}

        {/* UserTask specific fields */}
        {node.type === 'userTask' && (
          <>
            <div>
              <label htmlFor="assignee" className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="User or role"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </>
        )}

        {/* SystemTask specific fields */}
        {node.type === 'systemTask' && (
          <>
            <div>
              <label htmlFor="serviceName" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name
              </label>
              <Input
                id="serviceName"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                placeholder="API service name"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="endpoint" className="block text-sm font-medium text-gray-700 mb-1">
                API Endpoint
              </label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="/api/v1/..."
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="retryPolicy" className="block text-sm font-medium text-gray-700 mb-1">
                Retry Attempts
              </label>
              <Input
                id="retryPolicy"
                type="number"
                value={retryPolicy}
                onChange={(e) => setRetryPolicy(e.target.value)}
                placeholder="3"
                className="w-full"
                min="0"
                max="10"
              />
            </div>
          </>
        )}

        {/* Timer specific fields */}
        {node.type === 'timer' && (
          <>
            <div>
              <label htmlFor="timerType" className="block text-sm font-medium text-gray-700 mb-1">
                Timer Type
              </label>
              <select
                id="timerType"
                value={timerType}
                onChange={(e) => setTimerType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="delay">Delay (Duration)</option>
                <option value="date">Specific Date/Time</option>
                <option value="cycle">Recurring (Cron)</option>
              </select>
            </div>
            <div>
              <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                {timerType === 'delay' ? 'Delay (minutes)' : timerType === 'date' ? 'Date/Time' : 'Cron Expression'}
              </label>
              <Input
                id="schedule"
                type={timerType === 'date' ? 'datetime-local' : 'text'}
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                placeholder={timerType === 'delay' ? '60' : timerType === 'date' ? '' : '0 9 * * MON'}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Subprocess specific fields */}
        {node.type === 'subprocess' && (
          <>
            <div>
              <label htmlFor="subprocessRef" className="block text-sm font-medium text-gray-700 mb-1">
                Subprocess Reference
              </label>
              <Input
                id="subprocessRef"
                value={subprocessRef}
                onChange={(e) => setSubprocessRef(e.target.value)}
                placeholder="Subprocess ID or name"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="loopType" className="block text-sm font-medium text-gray-700 mb-1">
                Loop Type
              </label>
              <select
                id="loopType"
                value={loopType}
                onChange={(e) => setLoopType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">No Loop</option>
                <option value="standard">Standard Loop</option>
                <option value="multi-instance">Multi-Instance (Parallel)</option>
                <option value="sequential">Sequential Multi-Instance</option>
              </select>
            </div>
          </>
        )}

        {/* ParallelGateway specific fields */}
        {node.type === 'parallelGateway' && (
          <div>
            <label htmlFor="gatewayType" className="block text-sm font-medium text-gray-700 mb-1">
              Gateway Type
            </label>
            <select
              id="gatewayType"
              value={gatewayType}
              onChange={(e) => setGatewayType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fork">Fork (Split into parallel paths)</option>
              <option value="join">Join (Merge parallel paths)</option>
            </select>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSave}
            disabled={!label.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
          <p>💡 Tip: Press Ctrl+Enter to save</p>
        </div>
      </div>
    </div>
  );
};
