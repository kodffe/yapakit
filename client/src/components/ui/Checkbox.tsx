import React, { ReactNode } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
  description?: ReactNode;
}

/**
 * Global UI Checkbox component.
 * Ensures consistent sizing, border radius, and dynamic brand coloring (`text-brand-primary`).
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className = '', ...props }, ref) => {
    return (
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="flex items-center h-5">
          <input
            {...props}
            type="checkbox"
            ref={ref}
            className={`w-5 h-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors cursor-pointer ${className}`}
          />
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{label}</span>}
            {description && <span className="text-xs text-gray-500 font-medium">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
