import { useState } from 'react';
import { X, UserPlus, FileText } from 'lucide-react';
import useCartStore, { CartCustomer } from '../../../store/cartStore';
import Checkbox from '../../../components/ui/Checkbox';

interface CustomerDataModalProps {
  onClose: () => void;
}

/**
 * Modal to capture customer data for order association and invoicing.
 * Features a "Request Invoice" toggle that expands additional fields.
 */
function CustomerDataModal({ onClose }: CustomerDataModalProps) {
  const { customer, setCustomer } = useCartStore();

  const [form, setForm] = useState<CartCustomer>({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
    taxId: customer?.taxId || '',
    requestsInvoice: customer?.requestsInvoice || false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    setCustomer(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-brand-primary" />
            <h3 className="text-lg font-bold text-gray-900">Customer Info</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="customer-name\" className="block text-sm font-semibold text-gray-700 mb-1">
              Name *
            </label>
            <input
              id="customer-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Customer name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="customer-phone" className="block text-sm font-semibold text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="customer-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="Phone number"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
            />
          </div>

          {/* Request Invoice Toggle */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <Checkbox
              name="requestsInvoice"
              checked={form.requestsInvoice}
              onChange={handleChange}
              label={
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-700">Request Invoice (Factura)</span>
                </div>
              }
            />
          </div>

          {/* Expanded Invoice Fields */}
          {form.requestsInvoice && (
            <div className="space-y-4 border-l-4 border-brand-primary pl-4">
              <div>
                <label htmlFor="customer-taxId" className="block text-sm font-semibold text-gray-700 mb-1">
                  Tax ID / RUC / CI
                </label>
                <input
                  id="customer-taxId"
                  name="taxId"
                  type="text"
                  value={form.taxId}
                  onChange={handleChange}
                  placeholder="Tax identification number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                />
              </div>
              <div>
                <label htmlFor="customer-address" className="block text-sm font-semibold text-gray-700 mb-1">
                  Address
                </label>
                <input
                  id="customer-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Billing address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                />
              </div>
              <div>
                <label htmlFor="customer-email" className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="customer-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="customer@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={!form.name.trim()}
            className="w-full py-3 bg-brand-primary text-white font-bold rounded-xl active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
          >
            Save Customer
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomerDataModal;
