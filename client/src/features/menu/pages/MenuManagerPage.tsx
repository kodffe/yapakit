import { useState, useMemo } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import CategoryList from '../components/CategoryList';
import MenuItemFormModal from '../components/MenuItemFormModal';
import MenuItemSortable from '../components/MenuItemSortable';
import ViewToggle from '../../../components/ui/ViewToggle';
import { useMenuItems, useCategories, useReorderMenuItems, MenuItem } from '../api/menuApi';
import useHeaderStore from '../../../store/headerStore';
import { useEffect } from 'react';

function MenuManagerPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null | 'new'>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: menuItems, isLoading, isError } = useMenuItems();
  const { data: categories } = useCategories();
  const { mutate: reorderItems } = useReorderMenuItems();
  
  const setHeader = useHeaderStore((s) => s.setHeader);

  useEffect(() => {
    setHeader('Menu Manager', 'Organize categories and items for your digital menu.');
  }, [setHeader]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    let items = menuItems;
    
    if (selectedCategoryId) {
      items = items.filter(item => {
        const cid = typeof item.categoryId === 'string' ? item.categoryId : item.categoryId?._id;
        return cid === selectedCategoryId;
      });
    }
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(
        item => item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q))
      );
    }
    
    return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [menuItems, selectedCategoryId, searchQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = filteredItems.findIndex((item) => item._id === active.id);
      const newIndex = filteredItems.findIndex((item) => item._id === over?.id);

      const reorderedArray = arrayMove(filteredItems, oldIndex, newIndex);

      // Map the new absolute display orders
      const updates = reorderedArray.map((item, index) => ({
        _id: item._id,
        displayOrder: index,
      }));

      reorderItems(updates);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 min-h-0 h-[calc(100vh-10rem)]">
      
      {/* View Sidebar (Categories) */}
      <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
        <CategoryList 
           selectedCategoryId={selectedCategoryId} 
           onSelectCategory={setSelectedCategoryId} 
        />
      </div>

      {/* Main Content (Menu Items) */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
             <div className="relative w-full sm:max-w-xs">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text" 
                 placeholder="Search items..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none transition-all"
               />
             </div>
             <ViewToggle view={viewMode} onChange={setViewMode} />
          </div>
          
          <button 
             onClick={() => setEditingItem('new')}
             className="w-full sm:w-auto flex items-center justify-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:brightness-90 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
           {isLoading ? (
             <div className="flex justify-center items-center h-full">
               <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
             </div>
           ) : isError ? (
             <div className="text-center py-10 text-red-500">
               Failed to load menu items.
             </div>
           ) : filteredItems.length > 0 ? (
             <DndContext 
                 sensors={sensors}
                 collisionDetection={closestCenter}
                 onDragEnd={handleDragEnd}
             >
                <SortableContext 
                   items={filteredItems.map(i => i._id)}
                   strategy={viewMode === 'grid' ? rectSortingStrategy : verticalListSortingStrategy}
                >
                   <div className={
                      viewMode === 'grid' 
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20"
                        : "flex flex-col gap-3 pb-20"
                   }>
                     {filteredItems.map(item => {
                       let catColor: string | undefined;
                       const cid = item.categoryId;
                       if (typeof cid === 'string') {
                         catColor = categories?.find(c => c._id === cid)?.color;
                       } else {
                         catColor = cid?.color || categories?.find(c => c._id === cid?._id)?.color;
                       }

                       return (
                         <MenuItemSortable 
                           key={item._id} 
                           item={item} 
                           view={viewMode}
                           onEdit={setEditingItem} 
                           categoryColor={catColor}
                         />
                       );
                     })}
                   </div>
                </SortableContext>
             </DndContext>
           ) : (
             <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">No items found</h3>
                <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                   Try adjusting your category filter, changing your search terms, or adding a new item.
                </p>
             </div>
           )}
        </div>
      </div>

      <MenuItemFormModal 
        isOpen={editingItem !== null} 
        onClose={() => setEditingItem(null)} 
        categories={categories || []}
        initialItem={editingItem !== 'new' && editingItem ? editingItem : undefined}
      />
    </div>
  );
}

export default MenuManagerPage;
