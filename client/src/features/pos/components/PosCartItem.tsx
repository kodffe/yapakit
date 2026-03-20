import { useState } from 'react';
import { Trash2, Plus, Minus, MessageSquare, X, Check } from 'lucide-react';
import useCartStore, { CartItem } from '../../../store/cartStore';

interface PosCartItemProps {
  item: CartItem;
  formatPrice: (amount: number) => string;
}

/**
 * Compact POS Cart item row with horizontal action header.
 * Layout: [Name + Price] row, then [- qty + | Note | Delete] action bar.
 */
function PosCartItem({ item, formatPrice }: PosCartItemProps) {
  const { removeItem, updateItemQuantity, updateItemNotes } = useCartStore();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.notes || '');

  const modifiersTotal = item.selectedModifiers.reduce((sum, mod) => sum + mod.extraPrice, 0);
  const unitTotal = item.basePrice + modifiersTotal;
  const lineTotal = unitTotal * item.quantity;

  const handleSaveNote = () => {
    updateItemNotes(item.cartItemId, noteText.trim());
    setIsEditingNote(false);
  };

  const handleCancelNote = () => {
    setNoteText(item.notes || '');
    setIsEditingNote(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Main row: Name + Price */}
      <div className="px-3 pt-3 pb-1">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-gray-900 text-sm truncate flex-1">{item.name}</h4>
          <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
            {formatPrice(lineTotal)}
          </span>
        </div>

        {/* Modifiers list */}
        {item.selectedModifiers.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {item.selectedModifiers.map((mod, idx) => (
              <p key={idx} className="text-xs font-medium text-gray-500 flex justify-between">
                <span>+ {mod.optionName}</span>
                {mod.extraPrice > 0 && <span>{formatPrice(mod.extraPrice)}</span>}
              </p>
            ))}
          </div>
        )}

        {/* Existing note display */}
        {item.notes && !isEditingNote && (
          <p className="text-xs font-medium text-amber-700 mt-1 italic">
            📝 {item.notes}
          </p>
        )}
      </div>

      {/* Inline note editor */}
      {isEditingNote && (
        <div className="px-3 pb-2">
          <div className="flex gap-2 items-center mt-1">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNote();
                if (e.key === 'Escape') handleCancelNote();
              }}
            />
            <button
              onClick={handleSaveNote}
              className="w-7 h-7 flex items-center justify-center bg-brand-primary text-white rounded-lg"
              aria-label="Save note"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleCancelNote}
              className="w-7 h-7 flex items-center justify-center bg-gray-200 text-gray-600 rounded-lg"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Action bar: [- qty +] [Note] [Delete] */}
      <div className="flex items-center border-t border-gray-100 bg-gray-50 px-1 py-1 gap-1">
        {/* Quantity controls */}
        <div className="flex items-center gap-0">
          <button
            onClick={() => updateItemQuantity(item.cartItemId, -1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-lg active:bg-gray-300"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="w-6 text-center font-black text-gray-900 text-sm">{item.quantity}</span>
          <button
            onClick={() => updateItemQuantity(item.cartItemId, 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-200 rounded-lg active:bg-gray-300"
            aria-label="Increase quantity"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1" />

        {/* Note button */}
        <button
          onClick={() => setIsEditingNote(!isEditingNote)}
          className={`w-8 h-8 flex items-center justify-center rounded-lg border ${
            item.notes
              ? 'text-amber-600 border-amber-200 bg-amber-50 hover:bg-amber-100'
              : 'text-gray-400 border-gray-200 hover:text-brand-primary hover:bg-gray-100 hover:border-brand-primary'
          }`}
          aria-label="Add note"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>

        {/* Delete button */}
        <button
          onClick={() => removeItem(item.cartItemId)}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-gray-200"
          aria-label="Remove item"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default PosCartItem;
