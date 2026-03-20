import { ReactNode, useMemo } from 'react';

export type BrandFont = 'modern' | 'elegant' | 'casual';

interface ThemeProviderProps {
  children: ReactNode;
  branding?: {
    primaryColor: string;
    fontFamily: BrandFont;
  };
}

/**
 * Maps the predefined font choice to actual CSS font stacks.
 */
const FONT_STACKS: Record<BrandFont, string> = {
  modern: "'Inter', sans-serif",
  elegant: "'Playfair Display', serif",
  casual: "'Nunito', sans-serif",
};

/**
 * ThemeProvider: Injects dynamic branding via CSS variables.
 * Wraps children in a div that sets --brand-primary and --brand-font.
 * All children should use Tailwind classes 'bg-brand-primary' or 'font-brand'.
 */
const ThemeProvider = ({ children, branding }: ThemeProviderProps) => {
  // Default values if branding is missing
  const primaryColor = branding?.primaryColor || '#2563EB';
  const fontChoice = branding?.fontFamily || 'modern';

  const mappedFont = useMemo(() => FONT_STACKS[fontChoice] || FONT_STACKS.modern, [fontChoice]);

  // We cast to React.CSSProperties to allow custom variables
  const style = {
    '--brand-primary': primaryColor,
    '--brand-font': mappedFont,
  } as React.CSSProperties;

  return (
    <div style={style} className="font-brand h-full contents">
      {children}
    </div>
  );
};

export default ThemeProvider;
