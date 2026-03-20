import { useState, useEffect } from 'react';
import { X, Plus, Minus, Info } from 'lucide-react';
import { MenuItem, MenuItemModifier, ModifierOption } from '../../menu/api/menuApi';
import { SelectedModifier, CartItem } from '../../../store/cartStore';

interface ModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onAddToCart: (item: Omit<CartItem, 'cartItemId'>) => void;
}

function ModifierModal({ isOpen, onClose, menuItem, onAddToCart }: ModifierModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen && menuItem && menuItem.modifiers) {
      const initialSelection: Record<string, string[]> = {};
      menuItem.modifiers.forEach((mod) => {
        initialSelection[mod.name] = mod.options
          .filter((opt) => opt.isDefault)
          .map((opt) => opt.name);
      });
      setSelectedOptions(initialSelection);
      setQuantity(1);
      setNotes('');
    }
  }, [isOpen, menuItem]);

  if (!isOpen || !menuItem) return null;

  const handleOptionToggle = (modifierName: string, optionName: string, widgetType: string, maxChoices: number) => {
    setSelectedOptions((prev) => {
      const currentSelection = prev[modifierName] || [];
      const isSelected = currentSelection.includes(optionName);

      if (widgetType === 'radio' || maxChoices === 1) {
        // Single choice overrides
        return { ...prev, [modifierName]: [optionName] };
      }

      if (isSelected) {
        // Remove selection
        return { ...prev, [modifierName]: currentSelection.filter((o) => o !== optionName) };
      }

      // Add selection if under maxChoices limit
      if (maxChoices === 0 || currentSelection.length < maxChoices) {
        return { ...prev, [modifierName]: [...currentSelection, optionName] };
      }

      return prev; // Reached limit, do nothing
    });
  };

  // Calculate dynamic total price
  let modifiersTotal = 0;
  const flatSelectedModifiers: SelectedModifier[] = [];

  if (menuItem.modifiers) {
    menuItem.modifiers.forEach((mod) => {
      const selections = selectedOptions[mod.name] || [];
      selections.forEach((selName) => {
        const opt = mod.options.find((o) => o.name === selName);
        if (opt) {
          modifiersTotal += opt.price || 0;
          flatSelectedModifiers.push({
            modifierName: mod.name,
            optionName: opt.name,
            extraPrice: opt.price || 0,
          });
        }
      });
    });
  }

  const finalUnitPrice = menuItem.price + modifiersTotal;
  const totalItemPrice = finalUnitPrice * quantity;

  // Validation
  let isValid = true;
  if (menuItem.modifiers) {
    for (const mod of menuItem.modifiers) {
      const selectedCount = (selectedOptions[mod.name] || []).length;
      if (mod.minChoices && selectedCount < mod.minChoices) {
        isValid = false;
        break;
      }
    }
  }

  const handleAddToCart = () => {
    if (!isValid) return;
    onAddToCart({
      menuItemId: menuItem._id,
      name: menuItem.name,
      basePrice: menuItem.price,
      quantity,
      selectedModifiers: flatSelectedModifiers,
      notes: notes.trim() !== '' ? notes.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-0 sm:pb-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full sm:max-w-xl h-auto max-h-[90vh] sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp sm:animate-fadeIn">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-2xl font-black text-gray-900">{menuItem.name}</h2>
            <p className="text-gray-500 font-medium">${menuItem.price.toFixed(2)} base price</p>
          </div>
          <button 
             onClick={onClose}
             className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modifiers Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-gray-50">
          
          {menuItem.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{menuItem.description}</p>
          )}

          {menuItem.modifiers?.map((modifier: MenuItemModifier) => {
            const currentSelection = selectedOptions[modifier.name] || [];
            const isRadio = modifier.widgetType === 'radio' || modifier.maxChoices === 1;
            const requiredBadge = modifier.minChoices > 0 ? (
               <span className="text-[10px] uppercase font-bold tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">Required</span>
            ) : null;
            
            return (
              <div key={modifier.name} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                   <div>
                      <h3 className="font-bold text-gray-900 flex items-center">{modifier.name} {requiredBadge}</h3>
                      <p className="text-xs text-gray-500 font-medium mt-1">
                         {modifier.minChoices > 0 ? `Choose at least ${modifier.minChoices}` : 'Optional'}
                         {modifier.maxChoices > 1 ? ` (Max ${modifier.maxChoices})` : ''}
                      </p>
                   </div>
                </div>

                <div className="space-y-3">
                  {modifier.options.map((option: ModifierOption) => {
                    const isSelected = currentSelection.includes(option.name);
                    const isDisabled = !isSelected && !isRadio && modifier.maxChoices > 1 && currentSelection.length >= modifier.maxChoices;

                    return (
                      <label 
                        key={option.name} 
                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary-500 bg-primary-50' 
                            : isDisabled ? 'border-gray-100 opacity-50 cursor-not-allowed' : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                        onClick={(e) => {
                           if (isDisabled) e.preventDefault();
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type={isRadio ? 'radio' : 'checkbox'}
                            name={modifier.name}
                            checked={isSelected}
                            onChange={() => handleOptionToggle(modifier.name, option.name, modifier.widgetType, modifier.maxChoices)}
                            className={`w-5 h-5 text-primary-600 border-gray-300 focus:ring-primary-500 ${isRadio ? 'rounded-full' : 'rounded'}`}
                            disabled={isDisabled}
                          />
                          <span className={`font-semibold ${isSelected ? 'text-primary-900' : 'text-gray-700'}`}>
                            {option.name}
                          </span>
                        </div>
                        {option.price > 0 && (
                          <span className={`text-sm font-bold ${isSelected ? 'text-primary-700' : 'text-gray-500'}`}>
                            +${option.price.toFixed(2)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notes Section */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
             <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-400" />
                Special Instructions
             </h3>
             <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Allergy to peanuts, extra napkins..."
                className="w-full border-gray-300 rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm py-3"
                rows={2}
             />
          </div>

        </div>

        {/* Footer actions */}
        <div className="px-6 py-5 border-t border-gray-100 bg-white z-10 flex flex-col sm:flex-row items-center gap-4">
          
          {/* Quantity Selector */}
          <div className="flex items-center bg-gray-100 rounded-2xl p-1 w-full sm:w-auto">
            <button 
               onClick={() => setQuantity(q => Math.max(1, q - 1))}
               className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            <span className="w-12 text-center font-black text-lg text-gray-900">{quantity}</span>
            <button 
               onClick={() => setQuantity(q => q + 1)}
               className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!isValid}
            className="flex-1 w-full bg-primary-600 text-white font-bold text-lg py-4 rounded-2xl hover:bg-primary-700 transition-colors disabled:opacity-50 flex justify-between items-center px-6 shadow-xl shadow-primary-600/20"
          >
            <span>Add to Order</span>
            <span>${totalItemPrice.toFixed(2)}</span>
          </button>
        </div>
        
      </div>
    </div>
  );
}

export default ModifierModal;
