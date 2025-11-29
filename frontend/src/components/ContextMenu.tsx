import React, { useEffect, useRef } from 'react';
import { Edit, Trash2, Copy, Settings, AlertCircle } from 'lucide-react';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const newX = x + rect.width > window.innerWidth ? x - rect.width : x;
      const newY = y + rect.height > window.innerHeight ? y - rect.height : y;

      if (newX !== x || newY !== y) {
        menuRef.current.style.left = `${Math.max(0, newX)}px`;
        menuRef.current.style.top = `${Math.max(0, newY)}px`;
      }
    }
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[180px]"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.divider ? (
            <div className="h-px bg-gray-200 my-1" />
          ) : (
            <button
              onClick={() => {
                item.onClick();
                onClose();
              }}
              className={`
                w-full px-4 py-2 text-left text-sm flex items-center gap-3
                transition-colors duration-150
                ${item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }
              `}
            >
              {item.icon && <span className="w-4 h-4">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// Common menu items for reuse
export const getNodeContextMenuItems = (
  onEdit: () => void,
  onDuplicate: () => void,
  onDelete: () => void,
  onAddPainPoint: () => void
): MenuItem[] => [
  {
    label: 'Edit Properties',
    icon: <Edit className="w-4 h-4" />,
    onClick: onEdit,
  },
  {
    label: 'Duplicate',
    icon: <Copy className="w-4 h-4" />,
    onClick: onDuplicate,
  },
  {
    label: 'Add Pain Point',
    icon: <AlertCircle className="w-4 h-4" />,
    onClick: onAddPainPoint,
  },
  {
    divider: true,
    label: '',
    onClick: () => {},
  },
  {
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    onClick: onDelete,
    danger: true,
  },
];

export const getEdgeContextMenuItems = (
  onEditLabel: () => void,
  onDelete: () => void
): MenuItem[] => [
  {
    label: 'Edit Label',
    icon: <Edit className="w-4 h-4" />,
    onClick: onEditLabel,
  },
  {
    divider: true,
    label: '',
    onClick: () => {},
  },
  {
    label: 'Delete',
    icon: <Trash2 className="w-4 h-4" />,
    onClick: onDelete,
    danger: true,
  },
];
