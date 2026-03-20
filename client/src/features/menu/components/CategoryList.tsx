import { useState } from 'react';
import { Plus, Loader2, MoreVertical, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, useReorderCategories, Category } from '../api/menuApi';

interface CategoryListProps {
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#0ea5e9', '#6366f1', '#a855f7', '#ec4899', '#64748b'
];

function CategoryList({ selectedCategoryId, onSelectCategory }: CategoryListProps) {
  const { data: categories, isLoading, isError } = useCategories();
  
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0]);
  const [isAdding, setIsAdding] = useState(false);

  // Edit / Menu State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await createMutation.mutateAsync({ 
        name: newCategoryName,
        color: newCategoryColor,
        displayOrder: categories ? categories.length : 0
      });
      setNewCategoryName('');
      setNewCategoryColor(PRESET_COLORS[0]);
      setIsAdding(false);
    } catch (err) {
      console.error('Failed to create category', err);
    }
  };

  const startEdit = (cat: Category) => {
    setEditingCategoryId(cat._id);
    setEditName(cat.name);
    setEditColor(cat.color || PRESET_COLORS[0]);
    setOpenMenuId(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateMutation.mutateAsync({ id, updates: { name: editName, color: editColor } });
      setEditingCategoryId(null);
    } catch (err) {
      console.error('Failed to update category', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this category? Any items under this category will also be deleted or rendered orphaned.')) {
      try {
        await deleteMutation.mutateAsync(id);
        if (selectedCategoryId === id) onSelectCategory(null);
      } catch (err) {
        console.error('Failed to delete category', err);
      }
    }
    setOpenMenuId(null);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    if (!categories) return;
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= categories.length) return;

    const newIds = categories.map(c => c._id);
    const temp = newIds[index];
    newIds[index] = newIds[newIdx];
    newIds[newIdx] = temp;
    reorderMutation.mutate(newIds);
    setOpenMenuId(null);
  };

  if (isLoading) return <div className="text-gray-500 text-sm py-4">Loading categories...</div>;
  if (isError) return <div className="text-red-500 text-sm py-4">Error loading categories.</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <h2 className="font-semibold text-gray-900 mb-4">Categories</h2>

      <div className="space-y-1 mb-4">
        {/* 'All' option */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            selectedCategoryId === null
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Items
        </button>

        {/* Existing Categories */}
        {categories?.map((category: Category, index: number) => {
          if (editingCategoryId === category._id) {
            return (
              <div key={category._id} className="p-2 bg-gray-50 rounded-lg border border-gray-200 space-y-2 mb-1">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-sm flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary-500 py-1"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color} type="button" onClick={() => setEditColor(color)}
                      className={`w-4 h-4 rounded-full ${editColor === color ? 'ring-2 ring-primary-500 scale-110' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex gap-1 justify-end mt-1">
                  <button onClick={() => setEditingCategoryId(null)} className="p-1 px-2 text-xs text-gray-500 hover:bg-gray-200 rounded">Cancel</button>
                  <button onClick={() => handleSaveEdit(category._id)} className="p-1 px-2 text-xs bg-primary-600 text-white rounded hover:bg-primary-700">Save</button>
                </div>
              </div>
            );
          }

          return (
            <div 
               key={category._id}
               className={`w-full relative group px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  selectedCategoryId === category._id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <button
                onClick={() => onSelectCategory(category._id)}
                className="flex-1 text-left flex items-center gap-2 overflow-hidden text-ellipsis"
              >
                <span 
                  className="w-3 h-3 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: category.color || '#e5e7eb' }} 
                />
                <span className="truncate">{category.name}</span>
              </button>
              
              <button 
                onClick={() => setOpenMenuId(openMenuId === category._id ? null : category._id)} 
                className={`text-gray-400 hover:text-gray-700 transition-opacity ${openMenuId === category._id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                <MoreVertical className="w-4 h-4 cursor-pointer" />
              </button>

              {/* Context Menu */}
              {openMenuId === category._id && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                  <div className="absolute right-8 top-8 w-36 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                    <button onClick={() => startEdit(category)} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                       <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    {index > 0 && (
                      <button onClick={() => moveCategory(index, 'up')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                         <ChevronUp className="w-3.5 h-3.5" /> Move Up
                      </button>
                    )}
                    {index < categories.length - 1 && (
                      <button onClick={() => moveCategory(index, 'down')} className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                         <ChevronDown className="w-3.5 h-3.5" /> Move Down
                      </button>
                    )}
                    <button onClick={() => handleDelete(category._id)} className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
                       <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Category Form */}
      {isAdding ? (
        <form onSubmit={handleAddCategory} className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
          <input
            type="text"
            autoFocus
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Category name"
            className="w-full text-sm flex-1 border-gray-300 rounded-lg shadow-sm focus:border-primary-500 py-1"
            disabled={createMutation.isPending}
          />
          
          <div className="flex flex-wrap gap-1.5 pb-1">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setNewCategoryColor(color)}
                className={`w-5 h-5 rounded-full outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-400 ${newCategoryColor === color ? 'ring-2 ring-offset-1 ring-primary-500 scale-110' : ''}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !newCategoryName.trim()}
              className="flex-1 bg-primary-600 text-white text-xs font-medium py-1.5 rounded-lg hover:bg-primary-700 disabled:opacity-50 flex justify-center items-center"
            >
              {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewCategoryName('');
                setNewCategoryColor(PRESET_COLORS[0]);
              }}
              className="flex-1 bg-white border border-gray-300 text-gray-700 text-xs font-medium py-1.5 rounded-lg hover:bg-gray-50"
              disabled={createMutation.isPending}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 border border-primary-200 border-dashed rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Category
        </button>
      )}
    </div>
  );
}

export default CategoryList;
