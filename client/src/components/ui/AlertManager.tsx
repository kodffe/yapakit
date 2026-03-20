import { BellRing, Check, AlertTriangle, XCircle } from 'lucide-react';
import useAlertStore from '../../store/alertStore';

/**
 * Generic Alert Manager using flat solid colors — no gradients or glassmorphism.
 * Displays one alert at a time as a centered modal overlay.
 */
function AlertManager() {
  const { alerts, removeAlert } = useAlertStore();

  if (alerts.length === 0) return null;

  const currentAlert = alerts[0];

  const handleConfirm = () => {
    if (currentAlert.onConfirm) currentAlert.onConfirm();
    removeAlert(currentAlert.id);
  };

  const handleCancel = () => {
    if (currentAlert.onCancel) currentAlert.onCancel();
    removeAlert(currentAlert.id);
  };

  const IconForType = () => {
    switch (currentAlert.type) {
      case 'success': return <Check className="w-8 h-8 text-emerald-600" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'error': return <XCircle className="w-8 h-8 text-red-600" />;
      case 'info':
      default: return <BellRing className="w-8 h-8 text-blue-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900 bg-opacity-70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        
        <div className="p-6 text-center space-y-4">
          <div className="mx-auto bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center">
            <IconForType />
          </div>
          
          <div>
            <h3 className="text-xl font-black text-gray-900 leading-tight mb-2">
              {currentAlert.title}
            </h3>
            <p className="text-gray-600 font-medium">
              {currentAlert.message}
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-200">
          {currentAlert.cancelText && (
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {currentAlert.cancelText}
            </button>
          )}
          
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg"
          >
            {currentAlert.confirmText || 'Acknowledge'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlertManager;
