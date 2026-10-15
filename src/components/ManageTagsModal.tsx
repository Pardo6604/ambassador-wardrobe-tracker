import React, { useState, useEffect } from 'react';
import { X, GripVertical, Trash2 } from 'lucide-react';
import { IconPicker } from './IconPicker';
import * as Icons from 'lucide-react';

interface ManageTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  defaultTags: string[];
  customTagsStr: string;
  onSave: (newTags: string, iconsMap?: Record<string, string>) => Promise<void>;
  showIcons?: boolean;
  initialIcons?: Record<string, string>;
}

export const ManageTagsModal: React.FC<ManageTagsModalProps> = ({
  isOpen,
  onClose,
  title,
  defaultTags,
  customTagsStr,
  onSave,
  showIcons = false,
  initialIcons = {}
}) => {
  const [tags, setTags] = useState<{ id: string; val: string; icon?: string }[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeIconEditId, setActiveIconEditId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (customTagsStr && customTagsStr.trim().length > 0) {
        const custom = customTagsStr.split(',').map(s => s.trim()).filter(Boolean);
        setTags(custom.map((t, i) => ({ id: `tag_${i}`, val: t, icon: initialIcons[t] })));
      } else {
        setTags(defaultTags.map((t, i) => ({ id: `default_${i}`, val: t, icon: initialIcons[t] })));
      }
      setActiveIconEditId(null);
    }
  }, [isOpen, defaultTags, customTagsStr, initialIcons]);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const val = newTag.trim();
    if (val && !tags.some(t => t.val.toLowerCase() === val.toLowerCase())) {
      setTags([...tags, { id: `tag_${Date.now()}`, val, icon: 'Tag' }]);
      setNewTag('');
    }
  };

  const handleDelete = (id: string) => {
    setTags(tags.filter(t => t.id !== id));
  };

  const handleUpdateIcon = (id: string, icon: string) => {
    setTags(tags.map(t => t.id === id ? { ...t, icon } : t));
    setActiveIconEditId(null);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    if (sourceId && sourceId !== targetId) {
      const sourceIdx = tags.findIndex(t => t.id === sourceId);
      const targetIdx = tags.findIndex(t => t.id === targetId);
      if (sourceIdx >= 0 && targetIdx >= 0) {
        const newTags = [...tags];
        const [removed] = newTags.splice(sourceIdx, 1);
        newTags.splice(targetIdx, 0, removed);
        setTags(newTags);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSave = async () => {
    setIsSaving(true);
    const finalTags = tags.map(t => t.val).join(',');
    const finalIcons: Record<string, string> = {};
    if (showIcons) {
      tags.forEach(t => {
        if (t.icon) finalIcons[t.val] = t.icon;
      });
    }
    await onSave(finalTags, showIcons ? finalIcons : undefined);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl flex flex-col overflow-hidden max-h-[85vh]">
        <div className="flex items-center justify-between p-4 border-b border-neutral-100">
          <h2 className="font-bold text-neutral-900">Manage {title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-neutral-50/50">
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="Add new..."
              className="flex-1 px-3 py-1.5 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-900"
            />
            <button type="submit" className="px-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 cursor-pointer text-sm font-semibold">
              Add
            </button>
          </form>

          <div className="space-y-2">
            {tags.map((tag) => {
              // @ts-ignore
              const IconComp = showIcons ? (Icons[tag.icon || 'Tag'] || Icons.Tag) : null;
              
              return (
                <div key={tag.id} className="flex flex-col">
                  <div 
                    draggable
                    onDragStart={(e) => handleDragStart(e, tag.id)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, tag.id)}
                    className="flex items-center justify-between bg-white p-2.5 border border-neutral-200 rounded-lg shadow-sm group cursor-grab active:cursor-grabbing hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 shrink-0" />
                      {showIcons && IconComp && (
                        <button 
                          type="button"
                          onClick={() => setActiveIconEditId(activeIconEditId === tag.id ? null : tag.id)}
                          className="p-1.5 bg-neutral-100 rounded-md hover:bg-neutral-200 transition-colors text-neutral-600"
                          title="Change icon"
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      )}
                      <span className="text-sm font-medium text-neutral-800">{tag.val}</span>
                    </div>
                    <button onClick={() => handleDelete(tag.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {activeIconEditId === tag.id && showIcons && (
                    <IconPicker 
                      value={tag.icon || 'Tag'} 
                      onChange={(icon) => handleUpdateIcon(tag.id, icon)} 
                    />
                  )}
                </div>
              );
            })}
            {tags.length === 0 && (
              <div className="text-center py-4 text-sm text-neutral-500">
                No items. Add one above!
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-neutral-100 bg-white">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Order & Tags'}
          </button>
        </div>
      </div>
    </div>
  );
};
