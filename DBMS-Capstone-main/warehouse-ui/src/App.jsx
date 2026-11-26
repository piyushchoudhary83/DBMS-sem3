import { useState } from 'react';
import Overview from './components/Overview';
import Products from './components/Products';
import StockMovement from './components/StockMovement';
import History from './components/History';

const VIEWS = [
  { id: 'overview', label: 'Overview', Component: Overview },
  { id: 'products', label: 'Products', Component: Products },
  { id: 'stock', label: 'Stock In/Out', Component: StockMovement },
  { id: 'history', label: 'History', Component: History },
];

export default function App() {
  const [view, setView] = useState('overview');
  const active = VIEWS.find((v) => v.id === view) || VIEWS[0];

  return (
    <div className="flex flex-col sm:flex-row h-screen w-full overflow-hidden bg-[#f4f5f7] text-[#111827] font-sans">
      {/* Sidebar (desktop) / Top bar (narrow screens) */}
      <aside className="flex flex-col sm:w-56 shrink-0 border-b sm:border-b-0 sm:border-r border-gray-300 bg-white">
        {/* Title header with left padding */}
        <div className="flex h-12 items-center justify-between sm:justify-start border-b border-gray-200 pl-4 pr-3">
          <span className="font-bold text-sm tracking-tight text-gray-900 leading-tight">
            Inventory Management System
          </span>
          <span className="sm:hidden font-mono text-[11px] text-gray-500">
            port 4000
          </span>
        </div>

        {/* Short navigation links with left padding */}
        <nav className="flex sm:flex-col overflow-x-auto sm:overflow-visible flex-1 py-1">
          {VIEWS.map((v) => {
            const isSelected = view === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setView(v.id)}
                className={`flex items-center pl-4 pr-3 py-2 text-left text-sm whitespace-nowrap transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-800 font-semibold border-b-2 sm:border-b-0 sm:border-l-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-b-2 sm:border-b-0 sm:border-l-2 border-transparent'
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </nav>

        {/* Small API status text at the bottom (desktop) */}
        <div className="hidden sm:block border-t border-gray-200 pl-4 pr-3 py-2 text-xs font-mono text-gray-500">
          API: port 4000
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Simple top bar with view name on desktop */}
        <header className="hidden sm:flex h-12 shrink-0 items-center justify-between border-b border-gray-300 bg-white px-4">
          <h1 className="text-xs font-semibold uppercase tracking-wider text-gray-700">
            {active.label}
          </h1>
        </header>

        {/* Full-width content with tight spacing */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4">
          <active.Component />
        </main>
      </div>
    </div>
  );
}
