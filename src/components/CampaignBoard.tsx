import React, { useState, useEffect } from 'react';
import { CampaignColumn, CampaignTask, OutfitSuggestion, ClothingItem, AmbassadorProfile, CampaignBoard as IBoard } from '../types';
import { apiService } from '../services/api';
import { Plus, Settings, Link as LinkIcon, Image as ImageIcon, Shirt, LayoutList, Calendar, Type, Trash2, Sparkles, GripVertical } from 'lucide-react';

interface CampaignBoardProps {
  profile: AmbassadorProfile;
  outfits: OutfitSuggestion[];
  clothingItems: ClothingItem[];
  onUpdateProfile: (profile: AmbassadorProfile) => void;
}

const DEFAULT_COLUMNS: CampaignColumn[] = [
  { id: 'brand', name: 'Brand', type: 'text', width: 150 },
  { id: 'outfit', name: 'Deliverable Outfit', type: 'outfits', width: 150 },
  { id: 'format', name: 'Format', type: 'text', width: 150 },
  { id: 'status', name: 'Status', type: 'status', options: ['Concepting', 'Shooting', 'Pending Approval', 'Live'], width: 150 },
  { id: 'url', name: 'Proof of Post', type: 'url', width: 200 }
];

export const CampaignBoard: React.FC<CampaignBoardProps> = ({
  outfits,
  clothingItems
}) => {
  const [boards, setBoards] = useState<IBoard[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [columns, setColumns] = useState<CampaignColumn[]>([]);
  const [tasks, setTasks] = useState<CampaignTask[]>([]);
  const [loading, setLoading] = useState(true);

  // New Board State
  const [isAddingBoard, setIsAddingBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  // New Task/Column State
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState<CampaignColumn['type']>('text');

  // Resize State
  const [titleWidth, setTitleWidth] = useState(250);
  const [resizingTitle, setResizingTitle] = useState<{startX: number, startWidth: number} | null>(null);
  const [resizingCol, setResizingCol] = useState<{id: string, startX: number, startWidth: number} | null>(null);
  const [resizingRow, setResizingRow] = useState<{id: string, startY: number, startHeight: number} | null>(null);

  // Zoom State
  const boardRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [autoZoomRatio, setAutoZoomRatio] = useState(1);

  const effectiveZoom = zoomLevel === 0 ? autoZoomRatio : zoomLevel;

  useEffect(() => {
    if (zoomLevel === 0) {
      const updateAutoZoom = () => {
        if (boardRef.current) {
          const containerWidth = boardRef.current.clientWidth;
          const totalWidth = titleWidth + columns.reduce((acc, col) => acc + (col.width || 150), 0) + 16;
          const ratio = containerWidth / totalWidth;
          setAutoZoomRatio(Math.min(1, Math.max(0.1, ratio)));
        }
      };
      updateAutoZoom();
      window.addEventListener('resize', updateAutoZoom);
      return () => window.removeEventListener('resize', updateAutoZoom);
    }
  }, [zoomLevel, titleWidth, columns]);

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoomLevel(prev => {
          if (prev === 0) prev = autoZoomRatio;
          const newZoom = prev - e.deltaY * 0.005;
          return Math.min(Math.max(0, newZoom), 2);
        });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [autoZoomRatio]);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    setLoading(true);
    const fetchedBoards = await apiService.getCampaignBoards();
    if (fetchedBoards && fetchedBoards.length > 0) {
      setBoards(fetchedBoards);
      setActiveBoardId(fetchedBoards[0].id);
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeBoardId) {
      loadBoardData(activeBoardId);
      const savedWidth = localStorage.getItem(`titleWidth_${activeBoardId}`);
      if (savedWidth) setTitleWidth(parseInt(savedWidth, 10));
      else setTitleWidth(250);
    }
  }, [activeBoardId]);

  const loadBoardData = async (boardId: string) => {
    const board = boards.find(b => b.id === boardId);
    if (board) {
      try {
        const parsed = JSON.parse(board.columns_json);
        setColumns(Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COLUMNS);
      } catch {
        setColumns(DEFAULT_COLUMNS);
      }
    }
    const t = await apiService.getCampaignTasks(boardId);
    setTasks(Array.isArray(t) ? t : []);
    setLoading(false);
  };

  const submitNewBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const newBoard = await apiService.createCampaignBoard(newBoardName.trim());
      if (newBoard) {
        setBoards([...boards, newBoard]);
        setActiveBoardId(newBoard.id);
        setIsAddingBoard(false);
        setNewBoardName('');
      } else {
        alert("Failed to create board. Make sure you are logged in, or try signing out and signing back in.");
      }
    } catch (e) {
      alert("Error creating board: " + (e as Error).message);
    }
  };

  const handleAddBoard = () => {
    setIsAddingBoard(true);
  };

  const handleDeleteBoard = async (id: string) => {
    if (boards.length <= 1) {
      alert("Cannot delete your only board.");
      return;
    }
    if (confirm("Are you sure you want to delete this board?")) {
      await apiService.deleteCampaignBoard(id);
      const remaining = boards.filter(b => b.id !== id);
      setBoards(remaining);
      setActiveBoardId(remaining[0].id);
    }
  };

  const saveColumns = async (newCols: CampaignColumn[]) => {
    setColumns(newCols);
    if (activeBoardId) {
      const jsonStr = JSON.stringify(newCols);
      await apiService.updateCampaignBoard(activeBoardId, undefined, jsonStr);
      setBoards(boards.map(b => b.id === activeBoardId ? { ...b, columns_json: jsonStr } : b));
    }
  };

  const handleAddColumn = () => {
    if (!newColumnName.trim()) return;
    const newCol: CampaignColumn = {
      id: `col_${Date.now()}`,
      name: newColumnName,
      type: newColumnType,
      options: newColumnType === 'status' ? ['To Do', 'In Progress', 'Done'] : undefined,
      width: 150
    };
    saveColumns([...columns, newCol]);
    setIsAddingColumn(false);
    setNewColumnName('');
  };

  const handleDeleteColumn = (id: string) => {
    saveColumns(columns.filter(c => c.id !== id));
  };

  const handleAddTask = async () => {
    if (!activeBoardId) return;
    const title = `New Campaign ${tasks.length + 1}`;
    const task = await apiService.createCampaignTask(activeBoardId, title, {});
    if (task) setTasks([task, ...tasks]);
  };

  const handleUpdateTaskCell = async (taskId: string, colId: string, value: any) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newCells = { ...task.cells, [colId]: value };
    setTasks(tasks.map(t => t.id === taskId ? { ...t, cells: newCells } : t));
    await apiService.updateCampaignTask(taskId, undefined, newCells);
  };
  
  const handleUpdateTaskCellHeight = async (taskId: string, newHeight: number) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newCells = { ...task.cells, __height: newHeight };
    setTasks(tasks.map(t => t.id === taskId ? { ...t, cells: newCells } : t));
    await apiService.updateCampaignTask(taskId, undefined, newCells);
  };

  const handleUpdateTaskTitle = async (taskId: string, title: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, title } : t));
    await apiService.updateCampaignTask(taskId, title, undefined);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    await apiService.deleteCampaignTask(taskId);
  };

  // Drag and drop columns
  const handleDragStart = (e: React.DragEvent, colId: string) => {
    e.dataTransfer.setData('text/plain', colId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const sourceColId = e.dataTransfer.getData('text/plain');
    if (sourceColId && sourceColId !== targetColId) {
      const sourceIdx = columns.findIndex(c => c.id === sourceColId);
      const targetIdx = columns.findIndex(c => c.id === targetColId);
      if (sourceIdx >= 0 && targetIdx >= 0) {
        const newCols = [...columns];
        const [removed] = newCols.splice(sourceIdx, 1);
        newCols.splice(targetIdx, 0, removed);
        saveColumns(newCols);
      }
    }
  };

  // Resizing mouse effects
  useEffect(() => {
    if (resizingTitle) {
      const onMouseMove = (e: MouseEvent) => {
        const diff = (e.clientX - resizingTitle.startX) / effectiveZoom;
        setTitleWidth(Math.max(100, resizingTitle.startWidth + diff));
      };
      const onMouseUp = () => {
        if (activeBoardId) localStorage.setItem(`titleWidth_${activeBoardId}`, titleWidth.toString());
        setResizingTitle(null);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [resizingTitle, titleWidth, activeBoardId, effectiveZoom]);

  useEffect(() => {
    if (resizingCol) {
      const onMouseMove = (e: MouseEvent) => {
        const diff = (e.clientX - resizingCol.startX) / effectiveZoom;
        const newWidth = Math.max(80, resizingCol.startWidth + diff);
        setColumns(columns.map(c => c.id === resizingCol.id ? { ...c, width: newWidth } : c));
      };
      const onMouseUp = () => {
        saveColumns(columns); // trigger API save with current state
        setResizingCol(null);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [resizingCol, columns, effectiveZoom]);

  useEffect(() => {
    if (resizingRow) {
      const onMouseMove = (e: MouseEvent) => {
        const diff = (e.clientY - resizingRow.startY) / effectiveZoom;
        const newHeight = Math.max(48, resizingRow.startHeight + diff);
        setTasks(tasks.map(t => t.id === resizingRow.id ? { ...t, cells: { ...t.cells, __height: newHeight } } : t));
      };
      const onMouseUp = () => {
        // Save the updated tasks
        const t = tasks.find(t => t.id === resizingRow.id);
        if (t) handleUpdateTaskCellHeight(t.id, t.cells.__height || 48);
        setResizingRow(null);
      };
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [resizingRow, tasks, effectiveZoom]);


  const renderCell = (task: CampaignTask, col: CampaignColumn) => {
    const val = task.cells ? task.cells[col.id] : undefined;
    switch (col.type) {
      case 'text':
        return (
          <textarea 
            className="w-full h-full min-h-[40px] bg-transparent text-sm outline-none px-2 py-1 focus:bg-white focus:ring-1 focus:ring-neutral-200 rounded resize-none whitespace-pre-wrap"
            value={val || ''}
            onChange={(e) => handleUpdateTaskCell(task.id, col.id, e.target.value)}
            placeholder="..."
          />
        );
      case 'url':
        return (
          <div className="flex items-center gap-2 px-2 w-full">
            <LinkIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input 
              className="w-full bg-transparent text-sm text-blue-600 outline-none py-1 focus:bg-white rounded"
              value={val || ''}
              onChange={(e) => handleUpdateTaskCell(task.id, col.id, e.target.value)}
              placeholder="https://"
            />
          </div>
        );
      case 'status':
        return (
          <select 
            className="text-xs font-medium px-2 py-1.5 rounded-md bg-neutral-100 text-neutral-700 outline-none border border-transparent focus:border-neutral-300 w-full"
            value={val || ''}
            onChange={(e) => handleUpdateTaskCell(task.id, col.id, e.target.value)}
          >
            <option value="">- Select -</option>
            {col.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      case 'outfits':
        return (
          <select 
            className="text-xs w-full outline-none bg-transparent"
            value={val || ''}
            onChange={(e) => handleUpdateTaskCell(task.id, col.id, e.target.value)}
          >
            <option value="">- Select Outfit -</option>
            {outfits && outfits.map(o => (
              <option key={o.id} value={o.id}>{o.title}</option>
            ))}
          </select>
        );
      case 'clothing':
        return (
          <select 
            className="text-xs w-full outline-none bg-transparent"
            value={val || ''}
            onChange={(e) => handleUpdateTaskCell(task.id, col.id, e.target.value)}
          >
            <option value="">- Select Piece -</option>
            {clothingItems && clothingItems.map(c => (
              <option key={c.id} value={c.id}>{c.brand} {c.category}</option>
            ))}
          </select>
        );
      case 'date':
        return (
          <input 
            type="date"
            className="text-xs w-full outline-none bg-transparent px-2"
            value={val || ''}
            onChange={(e) => handleUpdateTaskCell(task.id, col.id, e.target.value)}
          />
        );
      case 'image':
        return (
          <div className="text-xs text-neutral-500 w-full h-full flex items-center justify-center">
            {val ? (
              <div className="relative group w-full h-full p-1">
                 <img src={val} alt="uploaded" className="h-full w-full max-h-24 object-contain rounded" />
                 <button onClick={() => handleUpdateTaskCell(task.id, col.id, '')} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/90 p-1 rounded hover:text-rose-600">
                    <Trash2 className="w-3.5 h-3.5" />
                 </button>
              </div>
            ) : (
              <input 
                type="text" 
                placeholder="Paste image URL..." 
                className="text-xs w-full outline-none bg-transparent px-2 py-1 focus:bg-white rounded border border-transparent focus:border-neutral-200"
                onBlur={(e) => {
                  if (e.target.value) handleUpdateTaskCell(task.id, col.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateTaskCell(task.id, col.id, e.currentTarget.value);
                }}
              />
            )}
          </div>
        );
      default:
        return <span className="text-xs text-neutral-400 px-2">Unsupported</span>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'text': return <Type className="w-3.5 h-3.5" />;
      case 'url': return <LinkIcon className="w-3.5 h-3.5" />;
      case 'status': return <LayoutList className="w-3.5 h-3.5" />;
      case 'outfits': return <Sparkles className="w-3.5 h-3.5" />;
      case 'clothing': return <Shirt className="w-3.5 h-3.5" />;
      case 'image': return <ImageIcon className="w-3.5 h-3.5" />;
      case 'date': return <Calendar className="w-3.5 h-3.5" />;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading your board...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-[100vw] overflow-x-hidden mx-auto pb-32">
      {/* BOARDS SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {boards.map(b => (
            <div key={b.id} className="flex items-center group">
              <button
                onClick={() => setActiveBoardId(b.id)}
                className={`px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  activeBoardId === b.id 
                    ? 'bg-neutral-900 text-white' 
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {b.title}
              </button>
              {activeBoardId === b.id && (
                <button onClick={() => handleDeleteBoard(b.id)} className="ml-1 p-1 opacity-0 group-hover:opacity-100 hover:text-rose-600 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {isAddingBoard ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                autoFocus
                placeholder="Board name..." 
                className="px-3 py-1.5 text-sm border border-neutral-300 rounded-md outline-none focus:ring-2 focus:ring-neutral-900"
                value={newBoardName}
                onChange={e => setNewBoardName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitNewBoard()}
              />
              <button onClick={submitNewBoard} className="px-3 py-1.5 bg-neutral-900 text-white text-sm rounded-md hover:bg-neutral-800">Add</button>
              <button onClick={() => {setIsAddingBoard(false); setNewBoardName('');}} className="px-2 py-1.5 text-neutral-500 hover:text-neutral-900 text-sm">Cancel</button>
            </div>
          ) : (
            <button onClick={handleAddBoard} className="px-4 py-2 text-sm font-semibold rounded-lg whitespace-nowrap border border-dashed border-neutral-300 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400">
              + New Board
            </button>
          )}
        </div>

        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2 mr-2">
            <button onClick={() => setZoomLevel(p => Math.max(0, p - 0.1))} className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded text-neutral-500 hover:text-neutral-900">-</button>
            <span className="text-xs font-semibold text-neutral-500 w-12 text-center">
              {zoomLevel === 0 ? 'Fit' : `${Math.round(zoomLevel * 100)}%`}
            </span>
            <button onClick={() => setZoomLevel(p => p === 0 ? Math.ceil(autoZoomRatio * 10)/10 + 0.1 : Math.min(2, p + 0.1))} className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded text-neutral-500 hover:text-neutral-900">+</button>
          </div>
          <button onClick={() => setIsAddingColumn(true)} disabled={!activeBoardId} className="px-4 py-2 bg-white border border-neutral-200 text-sm font-semibold rounded-lg hover:bg-neutral-50 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            <Settings className="w-4 h-4" /> Add Column
          </button>
          <button onClick={handleAddTask} disabled={!activeBoardId} className="px-4 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-800 inline-flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {isAddingColumn && (
        <div className="mb-6 p-4 bg-white border border-neutral-200 rounded-xl flex flex-wrap items-end gap-4 shadow-sm">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Column Name</label>
            <input type="text" value={newColumnName} onChange={e=>setNewColumnName(e.target.value)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-neutral-900 outline-none" placeholder="e.g. Compensation" />
          </div>
          <div className="w-48">
            <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Data Type</label>
            <select value={newColumnType} onChange={e=>setNewColumnType(e.target.value as any)} className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-neutral-900 outline-none">
              <option value="text">Text / Number</option>
              <option value="status">Status Label</option>
              <option value="url">Link / URL</option>
              <option value="outfits">Linked Outfit</option>
              <option value="clothing">Linked Clothing Piece</option>
              <option value="date">Date</option>
              <option value="image">Image / File</option>
            </select>
          </div>
          <button onClick={handleAddColumn} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800">Save</button>
          <button onClick={()=>setIsAddingColumn(false)} className="px-4 py-2 text-neutral-500 hover:text-neutral-900 text-sm font-medium">Cancel</button>
        </div>
      )}

      {boards.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-12 flex flex-col items-center justify-center text-center">
          <LayoutList className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Campaign Boards Yet</h3>
          <p className="text-sm text-neutral-500 mb-6 max-w-sm">Create a board to track deliverables, seeded items, posts, and deadlines.</p>
          <button onClick={handleAddBoard} className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800">
            Create First Board
          </button>
        </div>
      ) : (
      <div 
        ref={boardRef}
        className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-x-auto relative"
      >
        <div style={{ zoom: effectiveZoom }}>
          <table className="w-max text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-neutral-50/50 border-b border-neutral-200 relative">
              <th 
                className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider sticky left-0 bg-neutral-50/95 backdrop-blur-sm z-20 group relative"
                style={{ width: titleWidth }}
              >
                Deliverable / Task
                <div 
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 z-30"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setResizingTitle({ startX: e.clientX, startWidth: titleWidth });
                  }}
                />
              </th>
              {columns.map(col => (
                <th 
                  key={col.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, col.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className="px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider group relative cursor-grab active:cursor-grabbing border-l border-neutral-200/50 hover:bg-neutral-100/50 transition-colors"
                  style={{ width: col.width || 150 }}
                >
                  <div className="flex items-center gap-1.5 justify-between select-none">
                    <span className="flex items-center gap-1.5">
                      <GripVertical className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {getTypeIcon(col.type)} {col.name}
                    </span>
                    <button onClick={() => handleDeleteColumn(col.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-600 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  {/* Column Resizer Handle */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 z-10"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setResizingCol({ id: col.id, startX: e.clientX, startWidth: col.width || 150 });
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => {
              const rowHeight = task.cells?.__height || 48;
              return (
                <tr key={task.id} className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors group relative">
                  <td className="p-0 sticky left-0 bg-white group-hover:bg-neutral-50/50 transition-colors shadow-[1px_0_0_0_#e5e5e5] z-10 relative border-r border-neutral-200/50" style={{ height: rowHeight, width: titleWidth }}>
                    <div className="flex items-start w-full h-full">
                       <textarea 
                        className="w-full h-full p-3 text-sm font-semibold text-neutral-900 bg-transparent outline-none focus:ring-inset focus:ring-2 focus:ring-neutral-900 resize-none whitespace-pre-wrap"
                        value={task.title}
                        onChange={(e) => handleUpdateTaskTitle(task.id, e.target.value)}
                      />
                      <button onClick={() => handleDeleteTask(task.id)} className="p-2 opacity-0 group-hover:opacity-100 hover:text-rose-600 self-center">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Row Resizer Handle */}
                    <div 
                      className="absolute bottom-0 left-0 right-0 h-1.5 cursor-row-resize hover:bg-blue-400 active:bg-blue-600 z-10"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setResizingRow({ id: task.id, startY: e.clientY, startHeight: rowHeight });
                      }}
                    />
                  </td>
                  
                  {columns.map(col => (
                    <td key={col.id} className="p-1 border-l border-neutral-100/50" style={{ height: rowHeight, width: col.width || 150 }}>
                      <div className="w-full h-full flex items-start overflow-hidden relative">
                         {renderCell(task, col)}
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-neutral-500 text-sm">
                  No tasks in this board yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
      )}
    </div>
  );
};
