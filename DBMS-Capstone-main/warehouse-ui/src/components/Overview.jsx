import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getProducts,
  getLowStockProducts,
  getHistory,
  CATEGORY_MAP,
} from '../services/apiService';
import { useApi } from '../hooks/useApi';
import { Panel, Spinner, ErrorLine, EmptyState } from './ui';
import {
  fmtDateDayMonth,
  fmtNumber,
  fmtPrice,
  build30DayHistory,
} from '../utils/formatters';

function PlainTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="border border-gray-300 bg-white p-2.5 text-xs">
      <div className="font-mono text-gray-600 mb-1">
        Date: {fmtDateDayMonth(label)} ({label})
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center justify-between gap-4 text-gray-800 text-xs">
          <span className="font-medium" style={{ color: entry.dataKey === 'unitsIn' ? '#047857' : '#1d4ed8' }}>
            {entry.name}:
          </span>
          <span className="font-mono font-semibold">{fmtNumber(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const {
    data: products,
    error: productsError,
    loading: productsLoading,
    refetch: refetchProducts,
  } = useApi(getProducts);

  const {
    data: lowStock,
    error: lowStockError,
    loading: lowStockLoading,
    refetch: refetchLowStock,
  } = useApi(getLowStockProducts);

  const {
    data: history,
    error: historyError,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useApi(getHistory);

  // Group real movement history into 30 consecutive local days
  const chartData = build30DayHistory(history);

  const totalProducts = products ? products.length : 0;
  const totalUnits = products
    ? products.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0)
    : 0;
  const lowStockCount = lowStock ? lowStock.length : 0;

  const totalUnitsIn30d = chartData.reduce((sum, day) => sum + day.unitsIn, 0);
  const totalUnitsOut30d = chartData.reduce((sum, day) => sum + day.unitsOut, 0);

  const handleRefresh = () => {
    refetchProducts();
    refetchLowStock();
    refetchHistory();
  };

  const loading = productsLoading || lowStockLoading || historyLoading;

  return (
    <div className="space-y-3">
      {/* 1. Slim stats row */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-5 border border-gray-300 bg-white px-3.5 py-2 text-sm rounded-[3px]">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Total Products:</span>
          <span className="font-semibold text-gray-900">
            {productsLoading && !products ? '—' : fmtNumber(totalProducts)}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Total Units:</span>
          <span className="font-semibold text-gray-900">
            {productsLoading && !products ? '—' : fmtNumber(totalUnits)}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Low-Stock Count:</span>
          <span className={`font-semibold ${lowStockCount > 0 ? 'text-red-700' : 'text-gray-900'}`}>
            {lowStockLoading && !lowStock ? '—' : fmtNumber(lowStockCount)}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Units In (30d):</span>
          <span className="font-semibold text-gray-900">
            {historyLoading && !history ? '—' : fmtNumber(totalUnitsIn30d)}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-300 hidden sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 font-medium">Units Out (30d):</span>
          <span className="font-semibold text-gray-900">
            {historyLoading && !history ? '—' : fmtNumber(totalUnitsOut30d)}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {loading && <Spinner size="xs" />}
          <button
            onClick={handleRefresh}
            className="border border-gray-300 bg-white hover:bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 rounded-[2px] font-medium transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {productsError && <ErrorLine error={productsError} onRetry={refetchProducts} />}
      {historyError && <ErrorLine error={historyError} onRetry={refetchHistory} />}

      {/* 2. Chart panel "Stock Movement (30 Days)", about 300px tall */}
      <Panel
        title="Stock Movement (30 Days)"
        right={historyLoading && <Spinner size="xs" />}
        className="overflow-hidden"
      >
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData}
              margin={{ top: 8, right: 12, bottom: 4, left: -10 }}
            >
              <CartesianGrid stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="date"
                interval={4}
                tickFormatter={fmtDateDayMonth}
                tick={{ fontSize: 12, fill: '#475569' }}
                stroke="#cbd5e1"
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#475569' }}
                stroke="#cbd5e1"
                tickLine={false}
              />
              <Tooltip content={<PlainTooltip />} isAnimationActive={false} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '6px', fontSize: '12px' }}
                formatter={(value) => <span className="text-gray-700">{value}</span>}
              />
              <Bar
                dataKey="unitsIn"
                name="Units In"
                fill="#a7f3d0"
                stroke="#6ee7b7"
                strokeWidth={1}
                maxBarSize={8}
                radius={0}
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="unitsOut"
                name="Units Out"
                stroke="#1d4ed8"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {lowStockError && <ErrorLine error={lowStockError} onRetry={refetchLowStock} />}

      {/* 3. The low-stock products table below */}
      <Panel
        title={`Low-Stock Products (${lowStockCount})`}
        right={lowStockLoading && <Spinner size="xs" />}
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-sm border-collapse min-w-[640px]">
          <thead className="bg-gray-100 border-b border-gray-300 text-xs font-semibold uppercase tracking-wider text-gray-700">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Product Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3 text-right">Reorder Level</th>
              <th className="py-2.5 px-3 text-right">Short by</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {lowStock?.map((item) => {
              const shortBy = Math.max(0, Number(item.reorder_level) - Number(item.quantity));
              const isZero = Number(item.quantity) === 0;
              const categoryName = CATEGORY_MAP[item.category_id] || item.category || '—';

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono font-medium text-gray-900">
                    #{item.id}
                  </td>
                  <td className="py-2 px-3 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {categoryName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-900">
                    ₹{fmtPrice(item.price)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${isZero ? 'text-red-700 font-bold' : 'text-red-700 font-semibold'}`}>
                    {item.quantity}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600">
                    {item.reorder_level}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-red-700 font-semibold">
                    {shortBy}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!lowStockLoading && lowStock && lowStock.length === 0 && (
          <EmptyState
            title="All stock levels healthy"
            description="No products are currently at or below their reorder level."
          />
        )}
      </Panel>
    </div>
  );
}
