import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed } from 'lucide-react';
import { usePublicMenu, PublicMenuItem, PublicCategory } from '../api/publicApi';
import ThemeProvider from '../../../components/layout/ThemeProvider';
import MenuItemDetailModal from '../components/MenuItemDetailModal';

/**
 * Public read-only QR Menu page.
 * Accessible at /p/:slug/menu — no auth required.
 * Renders one of 3 layouts based on branding.publicLayout.
 * Flat solid colors only — NO gradients, NO shadows.
 */
function PublicMenuPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data, isLoading, isError } = usePublicMenu(slug);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<PublicMenuItem | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <UtensilsCrossed className="w-16 h-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Menu Not Available</h1>
        <p className="text-gray-500">We couldn't load the menu for this restaurant.</p>
      </div>
    );
  }

  const { restaurantName, currency, categories, items, branding } = data;
  const layout = branding?.publicLayout || 'classic-tabs';

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(amount);

  // Filter items by selected category
  const filteredItems = selectedCategory
    ? items.filter((item: PublicMenuItem) => item.categoryId === selectedCategory)
    : items;

  const isOutOfStock = (item: PublicMenuItem) =>
    item.trackInventory && (item.stockQuantity === undefined || item.stockQuantity <= 0);

  // ─── Layout: Classic Tabs ─────────────────────────────────────────
  const renderClassicTabs = () => (
    <>
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            to={`/p/${slug}`}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-gray-900">{restaurantName}</h1>
            <p className="text-xs text-gray-500 font-medium">Menu</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === null
                  ? 'bg-brand-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.map((cat: PublicCategory) => (
              <button
                key={String(cat._id)}
                onClick={() => setSelectedCategory(String(cat._id))}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === String(cat._id)
                    ? 'bg-brand-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items - List */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-3">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No items in this category.</p>
          </div>
        ) : (
          filteredItems.map((item: PublicMenuItem) => {
            const outOfStock = isOutOfStock(item);
            return (
              <button
                key={item._id}
                type="button"
                onClick={() => !outOfStock && setSelectedItem(item)}
                className={`w-full bg-white rounded-xl border border-gray-200 p-4 flex gap-4 text-left transition-colors hover:bg-gray-50 ${outOfStock ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {item.imageUrl && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">{item.name}</h3>
                    {outOfStock ? (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase rounded-sm tracking-wider whitespace-nowrap">
                        Sold Out
                      </span>
                    ) : (
                      <span className="text-sm font-black text-brand-primary whitespace-nowrap">
                        {formatPrice(item.price)}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 font-medium">{item.description}</p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );

  // ─── Layout: Visual Grid ──────────────────────────────────────────
  const renderVisualGrid = () => {
    // Group items by category
    const categoryMap = new Map<string, PublicCategory>();
    categories.forEach((cat) => categoryMap.set(String(cat._id), cat));

    // Group items by categoryId
    const itemsByCategory = new Map<string, PublicMenuItem[]>();
    items.forEach((item) => {
      const catId = String(item.categoryId) || 'uncategorized';
      const existing = itemsByCategory.get(catId) || [];
      existing.push(item);
      itemsByCategory.set(catId, existing);
    });

    return (
      <>
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              to={`/p/${slug}`}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div>
              <h1 className="text-lg font-black text-gray-900">{restaurantName}</h1>
              <p className="text-xs text-gray-500 font-medium">Menu</p>
            </div>
          </div>
        </div>

        {/* Category Sections */}
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-10">
          {categories.map((cat) => {
            const catItems = itemsByCategory.get(String(cat._id)) || [];
            if (catItems.length === 0) return null;
            return (
              <section key={String(cat._id)}>
                <h2 className="text-xl font-black text-gray-900 mb-4 border-b-2 border-gray-200 pb-2">
                  {cat.name}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {catItems.map((item) => {
                    const outOfStock = isOutOfStock(item);
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => !outOfStock && setSelectedItem(item)}
                        className={`bg-white rounded-xl border border-gray-200 overflow-hidden text-left transition-colors hover:bg-gray-50 ${outOfStock ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {item.imageUrl ? (
                          <div className="w-full h-32 sm:h-40 bg-gray-100">
                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-full h-32 sm:h-40 bg-gray-100 flex items-center justify-center">
                            <UtensilsCrossed className="w-10 h-10 text-gray-300" />
                          </div>
                        )}
                        <div className="p-3">
                          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{item.name}</h3>
                          {outOfStock ? (
                            <span className="text-xs font-bold text-red-600 uppercase mt-1 block">Sold Out</span>
                          ) : (
                            <span className="text-sm font-black text-brand-primary mt-1 block">
                              {formatPrice(item.price)}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </>
    );
  };

  // ─── Layout: Minimal List ─────────────────────────────────────────
  const renderMinimalList = () => {
    // Group items by categoryId
    const itemsByCategory = new Map<string, PublicMenuItem[]>();
    items.forEach((item) => {
      const catId = String(item.categoryId) || 'uncategorized';
      const existing = itemsByCategory.get(catId) || [];
      existing.push(item);
      itemsByCategory.set(catId, existing);
    });

    return (
      <>
        {/* Elegant header with centered logo */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-xl mx-auto px-6 py-8 text-center">
            <Link
              to={`/p/${slug}`}
              className="absolute left-4 top-4 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{restaurantName}</h1>
            <p className="text-xs text-gray-400 mt-1 font-medium uppercase tracking-widest">Menu</p>
          </div>
        </div>

        {/* Category Sections */}
        <div className="max-w-xl mx-auto px-6 py-8 space-y-10">
          {categories.map((cat) => {
            const catItems = itemsByCategory.get(String(cat._id)) || [];
            if (catItems.length === 0) return null;
            return (
              <section key={String(cat._id)}>
                <h2 className="text-base font-black text-gray-900 uppercase tracking-wider mb-4 text-center border-b border-gray-200 pb-2">
                  {cat.name}
                </h2>
                <div className="space-y-3">
                  {catItems.map((item) => {
                    const outOfStock = isOutOfStock(item);
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => !outOfStock && setSelectedItem(item)}
                        className={`w-full flex items-baseline gap-2 text-left transition-colors py-1 ${outOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-brand-primary'}`}
                      >
                        <span className="text-sm font-bold text-gray-900 shrink-0">{item.name}</span>
                        <span className="flex-1 border-b border-dotted border-gray-300 relative top-[-3px]" />
                        {outOfStock ? (
                          <span className="text-xs font-bold text-red-600 uppercase shrink-0">Sold Out</span>
                        ) : (
                          <span className="text-sm font-black text-brand-primary shrink-0">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </>
    );
  };

  return (
    <ThemeProvider branding={branding}>
      <div className="min-h-screen bg-gray-50 relative">
        {layout === 'visual-grid' && renderVisualGrid()}
        {layout === 'minimal-list' && renderMinimalList()}
        {layout === 'classic-tabs' && renderClassicTabs()}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-bold text-gray-500">Yapakit</span>
          </p>
        </div>

        {/* Item Detail Modal */}
        <MenuItemDetailModal
          isOpen={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
          item={selectedItem}
          formatPrice={formatPrice}
        />
      </div>
    </ThemeProvider>
  );
}

export default PublicMenuPage;
