import TableSelector from '../features/pos/components/TableSelector';

/**
 * Main POS Dashboard page.
 * Renders a welcome header and the Table Selector for the waiter flow.
 */
function PosDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Floor Plan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Select a table to start a new order.
        </p>
      </div>

      {/* Table Selector */}
      <TableSelector />
    </div>
  );
}

export default PosDashboard;
