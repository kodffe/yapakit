import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, MapPin, Phone, Percent, DollarSign, Save, Loader2, CheckCircle2, Truck, Check, CalendarDays, Clock, CreditCard, Plus, Trash2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useRestaurantDetails, useUpdateSettings, RestaurantDetails } from '../api/settingsApi';
import ImageUpload from '../../../components/ui/ImageUpload';
import { useDisableRestaurant } from '../../restaurants/api/restaurantApi';
import useAuthStore from '../../../store/authStore';
import useHeaderStore from '../../../store/headerStore';
import Checkbox from '../../../components/ui/Checkbox';

export default function SettingsPage() {
  const { data: details, isLoading } = useRestaurantDetails();
  const updateSettings = useUpdateSettings();
  const disableMutation = useDisableRestaurant();
  const navigate = useNavigate();
  const currentRestaurantId = useAuthStore((s) => s.currentRestaurantId);

  const [formData, setFormData] = useState<RestaurantDetails>({
    name: '',
    address: '',
    phone: '',
    settings: { 
      taxRate: 0, 
      currency: 'USD', 
      enabledOrderTypes: ['dine-in', 'takeaway', 'delivery'], 
      defaultDeliveryFee: 0, 
      defaultTakeawayFee: 0, 
      logoUrl: '', 
      heroImageUrl: '',
      reservationDuration: 90,
      operatingHours: [
        { dayOfWeek: 0, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 1, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 2, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 3, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 4, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 5, openTime: '09:00', closeTime: '22:00', isClosed: false },
        { dayOfWeek: 6, openTime: '09:00', closeTime: '22:00', isClosed: false },
      ],
      paymentMethods: [
        { name: 'Cash', isExactAmountOnly: false, isActive: true },
        { name: 'Card', isExactAmountOnly: true, isActive: true },
      ],
    },
    branding: {
      palette: 'custom',
      primaryColor: '#2563EB',
      fontFamily: 'modern',
      publicLayout: 'classic-tabs',
    },
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodExact, setNewMethodExact] = useState(true);

  const setHeader = useHeaderStore((s) => s.setHeader);

  // Pre-fill form when data arrives (with safe fallbacks for older cached data)
  useEffect(() => {
    setHeader('Settings', 'Manage your restaurant configuration');
    if (details) {
      setFormData({
        name: details.name || '',
        address: details.address || '',
        phone: details.phone || '',
        branding: details.branding || { palette: 'custom', primaryColor: '#2563EB', fontFamily: 'modern', publicLayout: 'classic-tabs' },
        settings: details.settings || { taxRate: 0, currency: 'USD' },
      });
    }
  }, [details, setHeader]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'taxRate' || name === 'currency' || name === 'defaultDeliveryFee' || name === 'defaultTakeawayFee') {
      setFormData((prev: RestaurantDetails) => ({
        ...prev,
        settings: {
          ...(prev.settings || { taxRate: 0, currency: 'USD', enabledOrderTypes: ['dine-in', 'takeaway', 'delivery'], defaultDeliveryFee: 0, defaultTakeawayFee: 0 }),
          [name]: name === 'currency' ? value : (parseFloat(value) || 0),
        },
      }));
    } else if (name === 'reservationDuration') {
      setFormData((prev: RestaurantDetails) => ({
        ...prev,
        settings: {
          ...prev.settings,
          reservationDuration: parseInt(value) || 0,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleOperatingHoursChange = (dayOfWeek: number, field: string, value: string | boolean) => {
    setFormData((prev: RestaurantDetails) => {
      const updatedHours = [...(prev.settings.operatingHours || [])];
      const dayIndex = updatedHours.findIndex(h => h.dayOfWeek === dayOfWeek);
      if (dayIndex !== -1) {
        updatedHours[dayIndex] = { ...updatedHours[dayIndex], [field]: value };
      }
      return {
        ...prev,
        settings: { ...prev.settings, operatingHours: updatedHours }
      };
    });
  };

  const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const handleOrderTypeToggle = (type: 'dine-in' | 'takeaway' | 'delivery') => {
    setFormData((prev: RestaurantDetails) => {
      const currentTypes = prev.settings?.enabledOrderTypes || ['dine-in', 'takeaway', 'delivery'];
      let newTypes;
      
      if (currentTypes.includes(type)) {
        // Prevent unchecking the very last option
        if (currentTypes.length === 1) return prev;
        newTypes = currentTypes.filter((t: string) => t !== type);
      } else {
        newTypes = [...currentTypes, type];
      }

      return {
        ...prev,
        settings: {
          ...(prev.settings || { taxRate: 0, currency: 'USD', defaultDeliveryFee: 0 }),
          enabledOrderTypes: newTypes,
        }
      };
    });
  };

  const handleTogglePaymentMethod = (index: number, field: 'isActive' | 'isExactAmountOnly') => {
    setFormData((prev) => {
      const methods = [...(prev.settings.paymentMethods || [])];
      methods[index] = { ...methods[index], [field]: !methods[index][field] };
      return { ...prev, settings: { ...prev.settings, paymentMethods: methods } };
    });
  };

  const handleAddPaymentMethod = () => {
    if (!newMethodName.trim()) return;
    setFormData((prev) => {
      const methods = [...(prev.settings.paymentMethods || [])];
      methods.push({ name: newMethodName.trim(), isExactAmountOnly: newMethodExact, isActive: true });
      return { ...prev, settings: { ...prev.settings, paymentMethods: methods } };
    });
    setNewMethodName('');
    setNewMethodExact(true);
  };

  const handleDeletePaymentMethod = (index: number) => {
    setFormData((prev) => {
      const methods = [...(prev.settings.paymentMethods || [])];
      methods.splice(index, 1);
      return { ...prev, settings: { ...prev.settings, paymentMethods: methods } };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pb-16">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Current Subscription Card */}
        {details?.subscription && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  Current Subscription
                </h3>
                <p className="text-sm text-gray-500 mt-1">Review your plan and enabled features.</p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-brand-primary/10 text-brand-primary text-xs font-black uppercase tracking-wider rounded-lg">
                  {details.subscription.plan} PLAN
                </span>
                <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">
                  Status: <span className={details.subscription.status === 'active' ? 'text-green-600' : 'text-amber-600'}>{details.subscription.status}</span>
                </p>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-6 pb-6 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-900 mb-4">Included Features</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6">
                  {Object.entries(details.subscription.features).map(([key, isEnabled]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded flex justify-center items-center ${isEnabled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {isEnabled ? <Check className="w-3.5 h-3.5" /> : <div className="w-2 h-0.5 bg-gray-400 rounded" />}
                      </div>
                      <span className={`text-sm font-semibold capitalize ${isEnabled ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Expiration Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">
                    {new Date(details.subscription.expiresAt).toLocaleDateString()} 
                    {details.subscription.status === 'trial' ? ' (End of Trial)' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 bg-gray-100 text-gray-400 font-bold text-sm rounded-xl cursor-not-allowed border border-gray-200"
                >
                  Upgrade Plan (via PayPal coming soon)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* General Information Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-gray-400" />
              General Information
            </h3>
            <p className="text-sm text-gray-500 mt-1">This information will appear on receipts.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-gray-700 mb-1.5">Restaurant Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Store className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-1.5">Business Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="address"
                  id="address"
                  placeholder="123 Main St, City, Country"
                  value={formData.address}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="phone"
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding & Appearance Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-gray-400" />
              Branding & Appearance
            </h3>
            <p className="text-sm text-gray-500 mt-1">Customize your restaurant's brand identity and theme.</p>
          </div>
          <div className="p-6 space-y-8">
            {/* Logo and Hero Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUpload
                value={formData.settings?.logoUrl || ''}
                onChange={(url) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, logoUrl: url },
                  }))
                }
                label="Restaurant Logo"
              />
              <ImageUpload
                value={formData.settings?.heroImageUrl || ''}
                onChange={(url) =>
                  setFormData((prev) => ({
                    ...prev,
                    settings: { ...prev.settings, heroImageUrl: url },
                  }))
                }
                label="Hero Image"
              />
            </div>

            {/* Primary Brand Color Palette Selection */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 text-center sm:text-left">
                Primary Brand Color
              </label>
              
              {/* Predefined Palettes + Custom option */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                {[
                  { id: 'spicy-red', hex: '#DC2626', name: 'Spicy Red' },
                  { id: 'sunset-orange', hex: '#EA580C', name: 'Sunset Orange' },
                  { id: 'earthy-green', hex: '#65A30D', name: 'Earthy Green' },
                  { id: 'warm-mustard', hex: '#D97706', name: 'Warm Mustard' },
                  { id: 'coffee-brown', hex: '#78350F', name: 'Coffee Brown' },
                  { id: 'custom', hex: formData.branding.palette === 'custom' ? formData.branding.primaryColor : '#D1D5DB', name: 'Custom' }
                ].map((palette) => (
                  <button
                    key={palette.id}
                    type="button"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      branding: {
                        ...prev.branding,
                        palette: palette.id as 'spicy-red' | 'sunset-orange' | 'earthy-green' | 'warm-mustard' | 'coffee-brown' | 'custom',
                        primaryColor: palette.id === 'custom' ? prev.branding.primaryColor : palette.hex
                      }
                    }))}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-4 transition-all ${
                      formData.branding.palette === palette.id
                         ? 'border-gray-900 bg-gray-50'
                         : 'border-transparent bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded mb-2" style={{ backgroundColor: palette.hex }} />
                    <span className="text-xs font-bold text-gray-700 text-center leading-tight">
                      {palette.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Conditional 20-color safe palette for Custom */}
              {formData.branding.palette === 'custom' && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider text-center sm:text-left">Select a Safe Color</p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                    {[
                      '#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED', 
                      '#DB2777', '#0891B2', '#EA580C', '#4B5563', '#000000',
                      '#4338CA', '#BE185D', '#0369A1', '#15803D', '#854D0E',
                      '#C2410C', '#4D7C0F', '#1D4ED8', '#5B21B6', '#9F1239'
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, branding: { ...prev.branding, palette: 'custom', primaryColor: color } }))}
                        className={`w-10 h-10 rounded-full border-4 transition-all transform hover:scale-110 active:scale-95 ${
                          formData.branding.primaryColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Typography Selector */}
            <div className="pt-6 border-t border-gray-100">
               <label className="block text-sm font-bold text-gray-700 mb-4">Typography Style</label>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {(['modern', 'elegant', 'casual'] as const).map((font) => (
                   <button
                     key={font}
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, branding: { ...prev.branding, fontFamily: font } }))}
                     className={`flex flex-col items-center p-4 border-2 rounded-2xl transition-all ${
                       formData.branding.fontFamily === font 
                         ? 'border-brand-primary bg-brand-primary/10' 
                         : 'border-gray-100 bg-white hover:border-gray-200'
                     }`}
                   >
                     <span className={`text-xl font-bold mb-1 ${
                       font === 'modern' ? 'font-sans' : font === 'elegant' ? 'italic' : ''
                     } ${font === 'casual' ? 'tracking-wide' : ''}`}>
                       Aa
                     </span>
                     <span className="text-xs font-black uppercase tracking-wider text-gray-600">{font}</span>
                   </button>
                 ))}
               </div>
               <p className="mt-3 text-xs text-gray-400 text-center font-medium italic">
                 "Modern" uses Inter, "Elegant" uses Playfair Display, and "Casual" uses Nunito.
               </p>
            </div>

            {/* Menu Layout Selector */}
            <div className="pt-6 border-t border-gray-100">
               <label className="block text-sm font-bold text-gray-700 mb-2">Public Menu Layout</label>
               <p className="text-xs text-gray-400 mb-4">Choose how your QR menu looks for customers.</p>
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 {([
                   { id: 'classic-tabs' as const, name: 'Classic Tabs', desc: 'Hero image, sticky category tabs, and list items.' },
                   { id: 'visual-grid' as const, name: 'Visual Grid', desc: 'Category headers with a photo grid of items.' },
                   { id: 'minimal-list' as const, name: 'Minimal List', desc: 'Elegant text-only with centered logo.' },
                 ]).map((layout) => (
                   <button
                     key={layout.id}
                     type="button"
                     onClick={() => setFormData(prev => ({ ...prev, branding: { ...prev.branding, publicLayout: layout.id } }))}
                     className={`flex flex-col items-start p-4 rounded-2xl border-4 transition-all text-left ${
                       formData.branding.publicLayout === layout.id
                         ? 'border-brand-primary bg-gray-50'
                         : 'border-transparent bg-white hover:bg-gray-50 border border-gray-100'
                     }`}
                   >
                     <span className="text-sm font-black text-gray-900 mb-1">{layout.name}</span>
                     <span className="text-xs text-gray-500 leading-relaxed">{layout.desc}</span>
                   </button>
                 ))}
               </div>
            </div>
          </div>
        </div>

        {/* Order Configurations Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              Order Configurations
            </h3>
            <p className="text-sm text-gray-500 mt-1">Select which order types your restaurant supports.</p>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Enabled Order Types</label>
              <div className="flex flex-wrap gap-4">
                {(['dine-in', 'takeaway', 'delivery'] as const).map((type) => {
                  const isChecked = (formData.settings?.enabledOrderTypes || []).includes(type);
                  const isLastCheck = isChecked && (formData.settings?.enabledOrderTypes || []).length === 1;
                  return (
                    <label 
                      key={type} 
                      className={`flex items-center gap-2 px-4 py-2 border rounded-xl cursor-pointer transition-all ${
                        isChecked ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      } ${isLastCheck ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isChecked ? 'bg-primary-500 border-primary-500' : 'border-gray-300'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <span className="font-semibold capitalize">{type.replace('-', ' ')}</span>
                      <input 
                        type="checkbox" 
                        className="hidden" 
                        checked={isChecked}
                        onChange={() => handleOrderTypeToggle(type)}
                        disabled={isLastCheck}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Delivery Fee Input (Only visible if Delivery is enabled) */}
            {(formData.settings?.enabledOrderTypes || []).includes('delivery') && (
              <div className="pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-top-2">
                <label htmlFor="defaultDeliveryFee" className="block text-sm font-bold text-gray-700 mb-1.5">Default Delivery Fee</label>
                <div className="relative max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="defaultDeliveryFee"
                    id="defaultDeliveryFee"
                    min="0"
                    step="0.01"
                    value={formData.settings?.defaultDeliveryFee ?? 0}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">This fee is automatically appended to Delivery orders. Cashiers can override it manually.</p>
              </div>
            )}

            {/* Takeaway Fee Input (Only visible if Takeaway is enabled) */}
            {(formData.settings?.enabledOrderTypes || []).includes('takeaway') && (
              <div className="pt-6 border-t border-gray-100">
                <label htmlFor="defaultTakeawayFee" className="block text-sm font-bold text-gray-700 mb-1.5">Default Takeaway Fee</label>
                <div className="relative max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    name="defaultTakeawayFee"
                    id="defaultTakeawayFee"
                    min="0"
                    step="0.01"
                    value={formData.settings?.defaultTakeawayFee ?? 0}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">This fee is automatically appended to Takeaway orders. Waiters can override it manually.</p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Settings Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-gray-400" />
              Financial & Regional
            </h3>
            <p className="text-sm text-gray-500 mt-1">Configure how POS calculates orders and displays prices.</p>
          </div>
          <div className="p-6 space-y-6 sm:grid sm:grid-cols-2 sm:gap-6 sm:space-y-0">
            <div>
              <label htmlFor="currency" className="block text-sm font-bold text-gray-700 mb-1.5">Currency Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  id="currency"
                  name="currency"
                  value={formData.settings?.currency || 'USD'}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="taxRate" className="block text-sm font-bold text-gray-700 mb-1.5">Tax Rate (%)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Percent className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="taxRate"
                  id="taxRate"
                  min="0"
                  step="0.01"
                  value={formData.settings?.taxRate ?? 0}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-gray-400" />
              Payment Methods
            </h3>
            <p className="text-sm text-gray-500 mt-1">Configure available checkout options for Cashiers.</p>
          </div>
          <div className="p-6 space-y-6">
            {/* List of Methods */}
            <div className="space-y-3">
              {(formData.settings?.paymentMethods || []).map((method, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-sm">{method.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {method.isExactAmountOnly ? 'Requires exact amount (no change given).' : 'Allows overpayment (calculates change due).'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={method.isActive}
                      onChange={() => handleTogglePaymentMethod(index, 'isActive')}
                      label="Active"
                    />
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod(index, 'isExactAmountOnly')}
                      className="text-xs font-bold px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-100 transition-colors"
                    >
                      Toggle Config
                    </button>
                    {(method.name !== 'Cash' && method.name !== 'Card') && (
                      <button
                        type="button"
                        onClick={() => handleDeletePaymentMethod(index)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete method"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Method */}
             <div className="p-4 border border-brand-primary/20 bg-brand-primary/10 rounded-xl">
               <h4 className="text-sm font-bold text-gray-900 mb-3">Add Custom Payment Method</h4>
               <div className="flex flex-col sm:flex-row gap-4 items-end">
                 <div className="flex-1 w-full">
                   <label className="block text-xs font-bold text-gray-700 mb-1.5">Method Name (e.g., Zelle, Nequi)</label>
                   <input
                     type="text"
                     value={newMethodName}
                     onChange={(e) => setNewMethodName(e.target.value)}
                     placeholder="Enter method name"
                     className="block w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                   />
                 </div>
                 <div className="mb-2">
                   <Checkbox
                     checked={newMethodExact}
                     onChange={(e) => setNewMethodExact(e.target.checked)}
                     label="Exact Amount Only"
                   />
                 </div>
                 <button
                   type="button"
                   onClick={handleAddPaymentMethod}
                   disabled={!newMethodName.trim()}
                   className="px-4 py-2.5 bg-brand-primary text-white font-bold text-sm rounded-xl hover:brightness-90 disabled:opacity-50 transition-all flex items-center gap-2"
                 >
                   <Plus className="w-4 h-4" />
                   Add
                 </button>
               </div>
             </div>
          </div>
        </div>

        {/* Operating Hours & Reservations Card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-gray-400" />
              Operating Hours & Reservations
            </h3>
            <p className="text-sm text-gray-500 mt-1">Set when your restaurant is open and configure reservation rules.</p>
          </div>
          <div className="p-6 space-y-8">
            <div>
              <label htmlFor="reservationDuration" className="block text-sm font-bold text-gray-700 mb-1.5">Reservation Duration (minutes)</label>
              <div className="relative max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="reservationDuration"
                  id="reservationDuration"
                  min="15"
                  step="15"
                  value={formData.settings?.reservationDuration ?? 90}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-primary focus:border-transparent outline-none transition-all"
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">The default time slot length for a table reservation.</p>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Weekly Schedule</h4>
              {DAYS_OF_WEEK.map((dayLabel, index) => {
                const dayData = formData.settings?.operatingHours?.find(h => h.dayOfWeek === index) || { openTime: '09:00', closeTime: '22:00', isClosed: false };
                return (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="w-32 flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={!dayData.isClosed}
                          onChange={(e) => handleOperatingHoursChange(index, 'isClosed', !e.target.checked)}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                      <span className={`text-sm font-bold ${dayData.isClosed ? 'text-gray-400' : 'text-gray-800'}`}>
                        {dayLabel}
                      </span>
                    </div>

                    {!dayData.isClosed ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={dayData.openTime}
                          onChange={(e) => handleOperatingHoursChange(index, 'openTime', e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent block p-2 font-medium outline-none transition-all"
                        />
                        <span className="text-gray-400 font-bold">-</span>
                        <input
                          type="time"
                          value={dayData.closeTime}
                          onChange={(e) => handleOperatingHoursChange(index, 'closeTime', e.target.value)}
                          className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent block p-2 font-medium outline-none transition-all"
                        />
                      </div>
                    ) : (
                      <div className="flex-1 flex justify-end">
                        <span className="text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">Closed</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          {showSuccess && (
            <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600 animate-in fade-in slide-in-from-right-4">
              <CheckCircle2 className="w-5 h-5" />
              Settings saved!
            </span>
          )}
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="flex items-center gap-2 bg-brand-primary text-white px-6 py-3 rounded-xl font-bold hover:brightness-90 active:scale-95 transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            {updateSettings.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Save Changes
          </button>
        </div>

      </form>

      {/* ─── Danger Zone ─── */}
      <div className="max-w-3xl mx-auto mt-10 mb-8">
        <div className="bg-white rounded-2xl border-2 border-red-600 overflow-hidden">
          <div className="px-6 py-5 border-b border-red-200 bg-red-50">
            <h3 className="text-lg font-black text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-700 font-medium leading-relaxed">
              Disabling this restaurant will hide it from the POS and public menus.
              All staff members will lose access. <strong>This action cannot be undone from the UI.</strong>
            </p>
            <button
              type="button"
              disabled={disableMutation.isPending}
              onClick={() => {
                const confirmed = window.confirm(
                  'Are you sure you want to disable this restaurant? This action cannot be undone from the UI.'
                );
                if (!confirmed || !currentRestaurantId) return;

                disableMutation.mutate(currentRestaurantId, {
                  onSuccess: () => {
                    navigate('/select-restaurant', { replace: true });
                  },
                });
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:text-gray-500"
            >
              {disableMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Disabling...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  Disable Restaurant
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
