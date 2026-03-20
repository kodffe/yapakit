import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { X, Printer } from 'lucide-react';
import ReceiptTicket from './ReceiptTicket';
import { Order } from '../../orders/api/orderApi';

interface ReprintModalProps {
  order: Order;
  onClose: () => void;
}

export default function ReprintModal({ order, onClose }: ReprintModalProps) {
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Receipt_${order.orderNumber}`,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-70">
      <div className="bg-white border border-gray-200 shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <h2 className="text-lg font-black text-gray-900 uppercase">
            Re-print Receipt
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 flex flex-col items-center">
          <h3 className="text-xl font-black mb-1">Order #{order.orderNumber}</h3>
          <p className="text-sm font-bold text-gray-500 mb-6">{order.tableName || order.orderType}</p>

          <button
            onClick={() => handlePrint()}
            className="w-full py-4 px-6 bg-brand-primary transition-all hover:brightness-90 active:scale-95 text-white font-bold transition-colors flex items-center justify-center gap-3 text-lg rounded-none"
          >
            <Printer className="w-6 h-6" />
            Print Receipt Copy
          </button>
        </div>

        {/* Hidden Print Container */}
        <div className="hidden">
          <ReceiptTicket ref={componentRef} order={order} />
        </div>
      </div>
    </div>
  );
}
