import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2 } from 'lucide-react';
import { MenuItem } from '../api/menuApi';

interface MenuItemSortableProps {
  item: MenuItem;
  view: 'grid' | 'list';
  onEdit: (item: MenuItem) => void;
  categoryColor?: string;
}

function MenuItemSortable({ item, view, onEdit, categoryColor }: MenuItemSortableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  if (view === 'list') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center gap-4 p-3 bg-white border rounded-xl shadow-sm group transition-colors ${
          isDragging ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div
          {...attributes}
          {...listeners}
          className="p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl text-gray-300">🍔</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 truncate">{item.name}</h3>
          <p className="text-sm text-gray-500 font-medium">${item.price.toFixed(2)}</p>
        </div>
        
        <div className="hidden sm:block">
           <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
             item.isAvailable 
               ? 'bg-emerald-100 text-emerald-700' 
               : 'bg-red-100 text-red-700'
           }`}>
             {item.isAvailable ? 'Available' : 'Unavailable'}
           </span>
        </div>
        
        <div className="w-3 h-3 rounded-full hidden sm:block" style={{ backgroundColor: categoryColor || '#9ca3af' }} title="Category Color" />

        <button
          onClick={() => onEdit(item)}
          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors ml-2"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Grid View
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col bg-white border rounded-2xl shadow-sm overflow-hidden group transition-all ${
        isDragging ? 'border-primary-500 ring-2 ring-primary-200 scale-105' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="h-8 bg-gray-50 border-b border-gray-100 flex items-center justify-center cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="h-32 bg-gray-100 rounded-xl mb-4 flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl text-gray-300">🍔</span>
          )}
        </div>

        <div className="flex-1">
          <div className="flex justify-between items-start gap-2">
             <h3 className="font-bold text-gray-900 leading-tight line-clamp-2">{item.name}</h3>
             <button
                onClick={() => onEdit(item)}
                className="p-1 -mr-1 text-primary-600 hover:bg-primary-50 rounded-md transition-colors flex-shrink-0"
             >
                <Edit2 className="w-4 h-4" />
             </button>
          </div>
          <p className="text-gray-500 text-sm font-medium mt-1">${item.price.toFixed(2)}</p>
        </div>
        
        <div className="mt-3 flex items-center justify-between">
           <div className="flex items-center gap-2">
             <span className="w-3 h-3 rounded-full" style={{ backgroundColor: categoryColor || '#9ca3af' }} title="Category Color" />
             {!item.isAvailable && <span className="text-[10px] font-bold text-red-500 uppercase">Unavailable</span>}
           </div>
           {item.modifiers && item.modifiers.length > 0 && (
             <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Customizable
             </span>
           )}
        </div>
      </div>
    </div>
  );
}

export default MenuItemSortable;
