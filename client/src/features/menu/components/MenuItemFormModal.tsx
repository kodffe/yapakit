import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useCreateMenuItem, useUpdateMenuItem, MenuItem, Category, MenuItemModifier, ModifierOption } from '../api/menuApi';
import ImageUpload from '../../../components/ui/ImageUpload';
import Checkbox from '../../../components/ui/Checkbox';

interface MenuItemFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  initialItem?: MenuItem | null; // If provided, we are in Edit mode
}

function MenuItemFormModal({ isOpen, onClose, categories, initialItem }: MenuItemFormModalProps) {
  const isEditing = !!initialItem;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [region, setRegion] = useState<'featured' | 'available' | 'unavailable'>('available');
  const [isAvailable, setIsAvailable] = useState(true);
  const [trackInventory, setTrackInventory] = useState(false);
  const [stockQuantity, setStockQuantity] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  
  const [modifiers, setModifiers] = useState<MenuItemModifier[]>([]);

  const { mutate: createItem, isPending: isCreating } = useCreateMenuItem();
  const { mutate: updateItem, isPending: isUpdating } = useUpdateMenuItem();

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setName(initialItem.name);
        setDescription(initialItem.description || '');
        setPrice(initialItem.price.toString());
        setCategoryId(typeof initialItem.categoryId === 'string' ? initialItem.categoryId : initialItem.categoryId._id);
        setRegion(initialItem.region);
        setIsAvailable(initialItem.isAvailable);
        setTrackInventory(initialItem.trackInventory || false);
        setStockQuantity(initialItem.stockQuantity?.toString() || '0');
        setImageUrl(initialItem.imageUrl || '');
        setModifiers(initialItem.modifiers || []);
      } else {
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId(categories.length > 0 ? categories[0]._id : '');
        setRegion('available');
        setIsAvailable(true);
        setTrackInventory(false);
        setStockQuantity('0');
        setImageUrl('');
        setModifiers([]);
      }
    }
  }, [isOpen, initialItem, categories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    const payload = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      categoryId,
      region,
      isAvailable,
      trackInventory,
      stockQuantity: trackInventory ? parseInt(stockQuantity) || 0 : 0,
      imageUrl,
      modifiers,
    };

    if (isEditing && initialItem) {
      updateItem({ id: initialItem._id, updates: payload }, {
        onSuccess: () => {
          onClose();
        }
      });
    } else {
      createItem(payload as any, {
        onSuccess: () => {
          onClose();
        }
      });
    }
  };

  const addModifierGroup = () => {
    setModifiers([
      ...modifiers,
      {
        name: '',
        widgetType: 'checkbox',
        minChoices: 0,
        maxChoices: 1,
        options: []
      }
    ]);
  };

  const updateModifierGroup = (index: number, updates: Partial<MenuItemModifier>) => {
    const newMods = [...modifiers];
    newMods[index] = { ...newMods[index], ...updates };
    setModifiers(newMods);
  };

  const removeModifierGroup = (index: number) => {
    setModifiers(modifiers.filter((_, i) => i !== index));
  };

  const addOption = (modifierIndex: number) => {
    const newMods = [...modifiers];
    newMods[modifierIndex].options.push({ name: '', price: 0, isDefault: false });
    setModifiers(newMods);
  };

  const updateOption = (modIndex: number, optIndex: number, updates: Partial<ModifierOption>) => {
    const newMods = [...modifiers];
    newMods[modIndex].options[optIndex] = { ...newMods[modIndex].options[optIndex], ...updates };
    setModifiers(newMods);
  };

  const removeOption = (modIndex: number, optIndex: number) => {
    const newMods = [...modifiers];
    newMods[modIndex].options = newMods[modIndex].options.filter((_, i) => i !== optIndex);
    setModifiers(newMods);
  };

  if (!isOpen) return null;

  const isPending = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-3xl h-[90vh] flex flex-col rounded-3xl shadow-xl animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white z-10 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Menu Item' : 'New Menu Item'}
          </h2>
          <button 
             type="button"
             onClick={onClose}
             className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto w-full">
           <form id="menu-item-form" onSubmit={handleSubmit} className="p-6 space-y-6">
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-2">Basic Info</h3>
                   
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                     <input
                       type="text"
                       required
                       value={name}
                       onChange={(e) => setName(e.target.value)}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                       placeholder="Cheeseburger"
                     />
                   </div>

                   <div>
                     <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                     <textarea
                       value={description}
                       onChange={(e) => setDescription(e.target.value)}
                       rows={2}
                       className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                       placeholder="A delicious burger..."
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1">Price *</label>
                       <input
                         type="number"
                         required
                         min="0"
                         step="0.01"
                         value={price}
                         onChange={(e) => setPrice(e.target.value)}
                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                         placeholder="9.99"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                       <select
                         required
                         value={categoryId}
                         onChange={(e) => setCategoryId(e.target.value)}
                         className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all"
                       >
                         {categories.map((cat) => (
                           <option key={cat._id} value={cat._id}>{cat.name}</option>
                         ))}
                       </select>
                     </div>
                   </div>

                    {/* Image Upload */}
                    <ImageUpload
                      value={imageUrl}
                      onChange={setImageUrl}
                      label="Dish Photo"
                    />

                   <div className="flex flex-col gap-4 pt-2">
                     <Checkbox
                       id="isAvailable"
                       checked={isAvailable}
                       onChange={(e) => setIsAvailable(e.target.checked)}
                       label="Currently Available"
                     />
                     <Checkbox
                       id="trackInventory"
                       checked={trackInventory}
                       onChange={(e) => setTrackInventory(e.target.checked)}
                       label="Track Inventory"
                     />
                     {trackInventory && (
                       <div className="pl-6 animate-fadeIn">
                         <label className="block text-xs font-semibold text-gray-700 mb-1">Stock Quantity *</label>
                         <input
                           type="number"
                           required={trackInventory}
                           min="0"
                           value={stockQuantity}
                           onChange={(e) => setStockQuantity(e.target.value)}
                           className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-primary max-w-[120px] outline-none transition-all"
                           placeholder="0"
                         />
                       </div>
                     )}
                   </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h3 className="font-bold text-gray-900">Modifiers (Variants)</h3>
                      <button
                         type="button"
                         onClick={addModifierGroup}
                         className="text-brand-primary text-sm font-semibold flex items-center hover:brightness-90 transition-all"
                      >
                         <Plus className="w-4 h-4 mr-1" /> Add Group
                      </button>
                   </div>

                   {modifiers.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-400">
                         <p className="text-sm">No modifiers configured.</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {modifiers.map((mod, mIndex) => (
                           <div key={mIndex} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                              <div className="flex gap-2 mb-3">
                                 <input 
                                    type="text" 
                                    required
                                    placeholder="Group Name (e.g. Size)" 
                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                                    value={mod.name}
                                    onChange={(e) => updateModifierGroup(mIndex, { name: e.target.value })}
                                 />
                                 <select 
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 w-32"
                                    value={mod.widgetType}
                                    onChange={(e) => updateModifierGroup(mIndex, { widgetType: e.target.value as any })}
                                 >
                                    <option value="radio">Radio</option>
                                    <option value="checkbox">Checkbox</option>
                                 </select>
                                 <button 
                                    type="button"
                                    onClick={() => removeModifierGroup(mIndex)}
                                    className="bg-white border border-gray-200 p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </div>
                              <div className="flex gap-4 mb-3 text-xs text-gray-500">
                                 <label className="flex items-center gap-2">
                                    Min Choices:
                                    <input type="number" min="0" value={mod.minChoices} onChange={(e) => updateModifierGroup(mIndex, { minChoices: parseInt(e.target.value) || 0 })} className="w-12 px-1 py-0.5 border rounded" />
                                 </label>
                                 <label className="flex items-center gap-2">
                                    Max Choices:
                                    <input type="number" min="1" value={mod.maxChoices} onChange={(e) => updateModifierGroup(mIndex, { maxChoices: parseInt(e.target.value) || 1 })} className="w-12 px-1 py-0.5 border rounded" />
                                 </label>
                              </div>

                              <div className="space-y-2">
                                 {mod.options.map((opt, oIndex) => (
                                   <div key={oIndex} className="flex items-center gap-2">
                                      <input 
                                         type="text"
                                         required
                                         placeholder="Option (e.g. Large)"
                                         className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded shadow-sm"
                                         value={opt.name}
                                         onChange={(e) => updateOption(mIndex, oIndex, { name: e.target.value })}
                                      />
                                      <div className="relative w-20">
                                         <span className="absolute left-2 top-1 text-gray-400 text-sm">$</span>
                                         <input 
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-5 pr-2 py-1 text-sm border border-gray-300 rounded shadow-sm"
                                            value={opt.price}
                                            onChange={(e) => updateOption(mIndex, oIndex, { price: parseFloat(e.target.value) || 0 })}
                                         />
                                      </div>
                                      <button 
                                         type="button"
                                         onClick={() => removeOption(mIndex, oIndex)}
                                         className="text-red-400 hover:text-red-600"
                                      >
                                         <X className="w-4 h-4" />
                                      </button>
                                   </div>
                                 ))}
                                 <button 
                                    type="button"
                                    onClick={() => addOption(mIndex)}
                                    className="text-xs font-semibold text-gray-500 mt-2 hover:text-primary-600 flex items-center"
                                 >
                                    <Plus className="w-3 h-3 mr-1" /> Add Option
                                 </button>
                              </div>
                           </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

           </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end rounded-b-3xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-gray-600 font-semibold hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="menu-item-form"
            disabled={isPending}
            className="px-8 py-2 bg-brand-primary text-white font-bold rounded-xl hover:brightness-90 transition-all disabled:opacity-50 flex items-center shadow-sm"
          >
            {isPending ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Item')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MenuItemFormModal;
