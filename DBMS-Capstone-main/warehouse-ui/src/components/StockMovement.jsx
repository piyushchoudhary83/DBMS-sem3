import { useState } from 'react';
import { getProducts, postStockMovement } from '../services/apiService';
import { useApi } from '../hooks/useApi';
import { Panel, Spinner, ErrorLine } from './ui';

export default function StockMovement() {
  const { data: products, error: prodError, loading: prodLoading, refetch } = useApi(getProducts);

  const [selectedProductId, setSelectedProductId] = useState('');
  const [type, setType] = useState('IN'); // 'IN' | 'OUT'
  const [quantity, setQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Derive active product ID without triggering cascading renders in effects
  const activeProductId =
    selectedProductId || (products && products.length > 0 ? String(products[0].id) : '');

  const selectedProduct = products?.find((p) => String(p.id) === String(activeProductId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const pId = parseInt(activeProductId, 10);
    const qty = parseInt(quantity, 10);

    if (!Number.isInteger(pId) || pId <= 0) {
      setErrorMsg('Please select a valid product');
      return;
    }

    if (!['IN', 'OUT'].includes(type)) {
      setErrorMsg('Movement type must be IN or OUT');
      return;
    }

    if (!Number.isInteger(qty) || qty <= 0) {
      setErrorMsg('Quantity must be an integer greater than 0');
      return;
    }

    setSubmitting(true);
    try {
      const updatedProduct = await postStockMovement({
        product_id: pId,
        type,
        quantity: qty,
      });

      setSuccessMsg(
        `Successfully logged ${type} of ${qty} units for "${updatedProduct.name}". New quantity: ${updatedProduct.quantity} units.`
      );
      setQuantity('1');
      refetch();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  const parsedQty = parseInt(quantity, 10) || 0;
  const projectedQty = selectedProduct
    ? type === 'IN'
      ? selectedProduct.quantity + parsedQty
      : selectedProduct.quantity - parsedQty
    : null;

  return (
    <div className="space-y-3 max-w-2xl">
      {prodError && <ErrorLine error={prodError} onRetry={refetch} />}

      <Panel
        title="Stock In / Stock Out"
        right={prodLoading && <Spinner size="xs" />}
        bodyClassName="p-4 space-y-4"
      >
        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
          {successMsg && (
            <div className="border border-green-300 bg-green-50 p-2.5 text-xs text-green-900 rounded-[2px]">
              ✓ {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="border border-red-300 bg-red-50 p-2.5 text-xs text-red-900 rounded-[2px]">
              ✕ {errorMsg}
            </div>
          )}

          {/* Product Select */}
          <div>
            <label htmlFor="product-select" className="block text-xs font-medium text-gray-700 mb-1">
              Select Product *
            </label>
            <select
              id="product-select"
              value={activeProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={submitting || prodLoading || !products?.length}
              className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 rounded-[2px] focus:outline-none focus:border-blue-700"
            >
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} — {p.name} ({p.category || 'Category ' + p.category_id}) · Stock: {p.quantity}
                </option>
              ))}
              {!products?.length && <option value="">No products available</option>}
            </select>
          </div>

          {/* Movement Type */}
          <div>
            <span className="block text-xs font-medium text-gray-700 mb-1">
              Movement Type *
            </span>
            <div className="flex items-center gap-4 text-xs font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="IN"
                  checked={type === 'IN'}
                  onChange={() => setType('IN')}
                  className="text-blue-700 focus:ring-0"
                />
                <span className="text-green-800 font-semibold">Stock IN (Receive)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="OUT"
                  checked={type === 'OUT'}
                  onChange={() => setType('OUT')}
                  className="text-blue-700 focus:ring-0"
                />
                <span className="text-blue-800 font-semibold">Stock OUT (Dispatch)</span>
              </label>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label htmlFor="quantity-input" className="block text-xs font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              id="quantity-input"
              type="number"
              min="1"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              disabled={submitting}
              className="w-40 border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-sm text-gray-900 rounded-[2px] focus:outline-none focus:border-blue-700"
            />
          </div>

          {/* Summary / Calculation Box */}
          {selectedProduct && (
            <div className="border border-gray-200 bg-gray-50 p-3 rounded-[2px] text-xs text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Current On-Hand Stock:</span>
                <span className="font-mono font-medium text-gray-900">{selectedProduct.quantity} units</span>
              </div>
              <div className="flex justify-between">
                <span>Adjustment ({type}):</span>
                <span className="font-mono font-medium text-gray-900">
                  {type === 'IN' ? `+${parsedQty}` : `-${parsedQty}`} units
                </span>
              </div>
              <div className="border-t border-gray-200 pt-1 flex justify-between font-semibold">
                <span>Projected New Balance:</span>
                <span
                  className={`font-mono ${
                    projectedQty !== null && projectedQty < 0
                      ? 'text-red-700'
                      : projectedQty !== null && projectedQty <= selectedProduct.reorder_level
                      ? 'text-amber-700'
                      : 'text-gray-900'
                  }`}
                >
                  {projectedQty} units
                </span>
              </div>
              {projectedQty !== null && projectedQty < 0 && (
                <div className="text-red-700 font-semibold mt-1">
                  ⚠️ Cannot reduce stock below zero.
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={submitting || !products?.length || (projectedQty !== null && projectedQty < 0)}
              className="border border-blue-700 bg-blue-700 hover:bg-blue-800 text-white px-4 py-1.5 text-xs font-medium rounded-[2px] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Processing…' : 'Submit Movement'}
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
}
