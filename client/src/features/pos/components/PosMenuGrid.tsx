import { useState, useMemo } from 'react';
import { useCategories, useMenuItems, MenuItem } from '../../menu/api/menuApi';
import { Loader2, Search, Plus } from 'lucide-react';
import ModifierModal from './ModifierModal';
import useCartStore, { CartItem } from '../../../store/cartStore';

function PosMenuGrid() {
  const { data: categories, isLoading: isCategoriesLoading } = useCategories();
  const { data: menuItems, isLoading: isItemsLoading } = useMenuItems();
  const addItem = useCartStore(state => state.addItem);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItemForModal, setSelectedItemForModal] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    let items = menuItems.filter(item => item.isAvailable); // POS only shows available items
    
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
    
    // Sort by displayOrder
    return items.sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [menuItems, selectedCategoryId, searchQuery]);

  const handleItemClick = (item: MenuItem) => {
    if (item.modifiers && item.modifiers.length > 0) {
      setSelectedItemForModal(item);
    } else {
      addItem({
        menuItemId: item._id,
        name: item.name,
        basePrice: item.price,
        quantity: 1,
        selectedModifiers: [],
      });
    }
  };

  if (isCategoriesLoading || isItemsLoading) {
    return (
      <div className="flex-1 flex justify-center items-center bg-gray-50 h-full w-full">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-white overflow-hidden relative">
      
      {/* Mobile Categories (Horizontal) */}
      <div className="lg:hidden bg-gray-50 border-b border-gray-200 p-3 flex-shrink-0 z-10 shadow-sm flex items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
              selectedCategoryId === null
                ? 'bg-brand-primary text-white border-transparent shadow-md'
                : 'bg-white text-gray-700 border-gray-200 active:bg-gray-100'
            }`}
          >
            All Items
          </button>
          
          {categories?.map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategoryId(cat._id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                selectedCategoryId === cat._id
                  ? 'bg-brand-primary text-white border-transparent shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 active:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Categories Sidebar (250px) */}
      <div className="hidden lg:flex flex-col w-[250px] bg-gray-50 border-r border-gray-200 flex-shrink-0 relative z-10 h-full overflow-y-auto">
         <div className="p-5 border-b border-gray-200 bg-white sticky top-0 z-10">
           <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Categories</h2>
         </div>
         <div className="flex flex-col p-3 gap-1.5">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all border ${
                selectedCategoryId === null
                  ? 'bg-brand-primary text-white border-transparent shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              All Items
            </button>
            {categories?.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategoryId(cat._id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl text-sm font-bold transition-all border ${
                  selectedCategoryId === cat._id
                    ? 'bg-brand-primary text-white border-transparent shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
         </div>
      </div>

      {/* Main List Area (Center) */}
      <div className="flex-1 flex flex-col min-w-0 h-full bg-white relative">
        {/* Search Bar */}
        <div className="p-3 border-b border-gray-100 bg-white sticky top-0 z-10 flex-shrink-0 shadow-sm">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-100 border-2 border-transparent rounded-xl font-bold text-gray-900 placeholder:text-gray-400 focus:border-brand-primary focus:bg-white outline-none transition-colors"
            />
          </div>
        </div>

        {/* Dense Tabular List */}
        <div className="flex-1 overflow-y-auto w-full p-2 lg:p-4">
          {filteredItems.length > 0 ? (
            <div className="flex flex-col rounded-2xl overflow-hidden border border-gray-200">
              {filteredItems.map((item, index) => {
                const isEven = index % 2 === 0;
                const isOutofStock = item.trackInventory && (item.stockQuantity === undefined || item.stockQuantity <= 0);
                return (
                  <div
                    key={item._id}
                    className={`flex items-center justify-between p-3 lg:p-4 border-b border-gray-200 last:border-0 ${
                      isEven ? 'bg-white' : 'bg-gray-50'
                    } ${isOutofStock ? 'opacity-70' : ''}`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-black text-gray-900 text-base md:text-lg leading-tight truncate">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs md:text-sm font-medium text-gray-500 mt-0.5 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Price and Badges */}
                      <div className="flex items-center gap-3 mt-1.5">
                        {isOutofStock ? (
                           <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase rounded-sm tracking-wider">
                              Sold Out
                           </span>
                        ) : (
                         <span className="font-black text-brand-primary text-base font-mono">
                           ${item.price.toFixed(2)}
                         </span>
                        )}
                        {item.modifiers && item.modifiers.length > 0 && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md border border-orange-200">
                             Customize
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Add Button */}
                    <button
                      onClick={() => handleItemClick(item)}
                      disabled={isOutofStock}
                      className={`flex-shrink-0 font-black px-4 lg:px-6 py-3 lg:py-4 rounded-xl flex items-center justify-center gap-1.5 text-sm lg:text-base border transition-all ${
                         isOutofStock 
                            ? 'bg-gray-200 text-gray-500 border-gray-300 cursor-not-allowed'
                            : 'bg-brand-primary text-white shadow-lg active:scale-95 transition-all border-transparent'
                      }`}
                    >
                      <Plus className="w-5 h-5 hidden sm:block" />
                      ADD
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-gray-400">
              <Search className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-xl font-black uppercase tracking-wider text-gray-400">No items found</p>
            </div>
          )}
        </div>
      </div>

      <ModifierModal 
        isOpen={!!selectedItemForModal}
        onClose={() => setSelectedItemForModal(null)}
        menuItem={selectedItemForModal}
        onAddToCart={(cartItemData: Omit<CartItem, 'cartItemId'>) => {
          addItem(cartItemData);
          setSelectedItemForModal(null);
        }}
      />
    </div>
  );
}

export default PosMenuGrid;
