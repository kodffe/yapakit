import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  view: 'grid' | 'list';
  onChange: (view: 'grid' | 'list') => void;
}

function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-md transition-colors ${
          view === 'grid' 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="Grid View"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`p-1.5 rounded-md transition-colors ${
          view === 'list' 
            ? 'bg-white text-primary-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
        aria-label="List View"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

export default ViewToggle;
