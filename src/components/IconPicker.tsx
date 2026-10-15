import React from 'react';
import * as Icons from 'lucide-react';

const AVAILABLE_ICONS = [
  'Package', 'Clock', 'CheckCircle2', 'RotateCcw', 'Tag', 
  'Star', 'Heart', 'Camera', 'Zap', 'Flame', 'Gift', 
  'Award', 'Sparkles', 'Briefcase', 'Calendar'
];

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-2 p-2 bg-neutral-50 rounded-lg border border-neutral-200 h-24 overflow-y-auto">
      {AVAILABLE_ICONS.map(iconName => {
        // @ts-ignore
        const IconComponent = Icons[iconName] || Icons.Tag;
        const isSelected = value === iconName;
        return (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`p-1.5 rounded-md transition-colors ${isSelected ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-200'}`}
          >
            <IconComponent className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
};
