import { getHistory } from '../services/apiService';
import { useApi } from '../hooks/useApi';
import { Panel, Spinner, ErrorLine, EmptyState } from './ui';
import { fmtNumber, fmtTime } from '../utils/formatters';

export default function History() {
  const { data: history, error, loading, refetch } = useApi(getHistory);

  return (
    <div className="space-y-3">
      {error && <ErrorLine error={error} onRetry={refetch} />}

      <Panel
        title="Stock Movement History"
        right={
          <div className="flex items-center gap-2">
            {loading && <Spinner size="xs" />}
            <span className="font-mono text-xs text-gray-600">
              {fmtNumber(history?.length ?? 0)} records
            </span>
            <button
              onClick={refetch}
              disabled={loading}
              className="border border-gray-300 bg-white hover:bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700 rounded-[2px] font-medium transition-colors"
            >
              Refresh
            </button>
          </div>
        }
        bodyClassName="p-0 overflow-x-auto"
      >
        <table className="w-full text-left text-sm border-collapse min-w-[560px]">
          <thead className="bg-gray-100 border-b border-gray-300 text-xs font-semibold uppercase tracking-wider text-gray-700 sticky top-0">
            <tr>
              <th className="py-2.5 px-3">Movement ID</th>
              <th className="py-2.5 px-3">Product Name</th>
              <th className="py-2.5 px-3">Type</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3 text-right">Recorded Timestamp</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 text-sm ${loading ? 'opacity-50' : ''}`}>
            {history?.map((m) => {
              const isIn = m.type === 'IN';

              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono font-medium text-gray-900">
                    #{m.id}
                  </td>
                  <td className="py-2 px-3 font-medium text-gray-900">
                    {m.product}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`font-semibold text-xs ${
                        isIn ? 'text-green-800' : 'text-blue-800'
                      }`}
                    >
                      {m.type === 'IN' ? 'Stock IN' : 'Stock OUT'}
                    </span>
                  </td>
                  <td
                    className={`py-2 px-3 text-right font-mono font-semibold ${
                      isIn ? 'text-green-700' : 'text-blue-700'
                    }`}
                  >
                    {isIn ? `+${m.quantity}` : `-${m.quantity}`}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-xs text-gray-500">
                    {fmtTime(m.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && history && history.length === 0 && (
          <EmptyState
            title="No movement history"
            description="Stock movements logged through Stock In/Out will appear here in reverse chronological order."
          />
        )}
      </Panel>
    </div>
  );
}
