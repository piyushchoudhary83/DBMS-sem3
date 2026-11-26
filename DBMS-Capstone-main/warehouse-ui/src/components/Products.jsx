import { useState } from 'react';
import {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  CATEGORIES,
  CATEGORY_MAP,
} from '../services/apiService';
import { useApi } from '../hooks/useApi';
import { Panel, Spinner, ErrorLine, EmptyState, Modal } from './ui';
import { fmtNumber, fmtPrice } from '../utils/formatters';

const INITIAL_FORM = {
  name: '',
  category_id: 1,
  price: '',
  reorder_level: 10,
};

export default function Products() {
  const { data: products, error, loading, refetch } = useApi(getProducts);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const openAddModal = () => {
    setEditingId(null);
    setForm(INITIAL_FORM);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (p) => {
    // Find category ID from category name if needed
    let catId = p.category_id;
    if (!catId && p.category) {
      const found = CATEGORIES.find((c) => c.name.toLowerCase() === p.category.toLowerCase());
      catId = found ? found.id : 1;
    }

    setEditingId(p.id);
    setForm({
      name: p.name || '',
      category_id: catId || 1,
      price: p.price !== undefined ? String(p.price) : '',
      reorder_level: p.reorder_level !== undefined ? p.reorder_level : 10,
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = form.name.trim();
    if (!trimmedName) {
      setFormError('Product name is required');
      return;
    }

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Price must be a valid non-negative number');
      return;
    }

    const catId = parseInt(form.category_id, 10);
    if (!Number.isInteger(catId) || catId <= 0) {
      setFormError('Category is required');
      return;
    }

    const reorderNum = parseInt(form.reorder_level, 10);
    if (!Number.isInteger(reorderNum) || reorderNum < 0) {
      setFormError('Reorder level must be a non-negative integer');
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await updateProduct(editingId, {
          name: trimmedName,
          category_id: catId,
          price: priceNum,
          reorder_level: reorderNum,
        });
      } else {
        await addProduct({
          name: trimmedName,
          category_id: catId,
          price: priceNum,
          reorder_level: reorderNum,
        });
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (p) => {
    setActionError(null);
    const confirmed = window.confirm(
      `Are you sure you want to delete product "${p.name}" (ID #${p.id})?`
    );
    if (!confirmed) return;

    try {
      await deleteProduct(p.id);
      refetch();
    } catch (err) {
      setActionError(err.message || 'Could not delete product');
    }
  };

  return (
    <div className="space-y-3">
      {actionError && (
        <ErrorLine
          error={{ message: actionError }}
          onRetry={() => setActionError(null)}
        />
      )}

      {error && <ErrorLine error={error} onRetry={refetch} />}

      <Panel
        title="Products Catalog"
        right={
          <div className="flex items-center gap-2">
            {loading && <Spinner size="xs" />}
            <span className="font-mono text-xs text-gray-600">
              {fmtNumber(products?.length ?? 0)} items
            </span>
            <button
              onClick={openAddModal}
              className="border border-blue-700 bg-blue-700 text-white hover:bg-blue-800 px-2.5 py-0.5 text-xs font-medium rounded-[2px] transition-colors"
            >
              + Add Product
            </button>
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
        <table className="w-full text-left text-sm border-collapse min-w-[640px]">
          <thead className="bg-gray-100 border-b border-gray-300 text-xs font-semibold uppercase tracking-wider text-gray-700">
            <tr>
              <th className="py-2.5 px-3">ID</th>
              <th className="py-2.5 px-3">Product Name</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Price</th>
              <th className="py-2.5 px-3 text-right">Quantity</th>
              <th className="py-2.5 px-3 text-right">Reorder Level</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-gray-200 text-sm ${loading ? 'opacity-50' : ''}`}>
            {products?.map((p) => {
              const isLow = Number(p.quantity) <= Number(p.reorder_level);
              const categoryName = p.category || CATEGORY_MAP[p.category_id] || '—';

              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-2 px-3 font-mono font-medium text-gray-900">
                    #{p.id}
                  </td>
                  <td className="py-2 px-3 font-medium text-gray-900">
                    {p.name}
                  </td>
                  <td className="py-2 px-3 text-gray-700">
                    {categoryName}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-900">
                    ₹{fmtPrice(p.price)}
                  </td>
                  <td className={`py-2 px-3 text-right font-mono ${isLow ? 'text-red-700 font-semibold' : 'text-gray-900'}`}>
                    {p.quantity}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-gray-600">
                    {p.reorder_level}
                  </td>
                  <td className="py-2 px-3 text-right space-x-1.5">
                    <button
                      onClick={() => openEditModal(p)}
                      className="border border-gray-300 bg-white hover:bg-gray-100 px-2 py-0.5 text-xs text-gray-700 rounded-[2px] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="border border-red-300 bg-white hover:bg-red-50 text-red-700 px-2 py-0.5 text-xs rounded-[2px] transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && products && products.length === 0 && (
          <EmptyState
            title="No products found"
            description="Add a new product to populate your inventory."
          />
        )}
      </Panel>

      {/* Add / Edit Product Modal */}
      <Modal
        title={editingId ? `Edit Product #${editingId}` : 'Add Product'}
        isOpen={modalOpen}
        onClose={closeModal}
      >
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {formError && (
            <div className="border border-red-300 bg-red-50 p-2 text-xs text-red-800 rounded-[2px]">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Wireless Mouse"
              className="w-full border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 rounded-[2px] focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 rounded-[2px] focus:outline-none focus:border-blue-700"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
                className="w-full border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-sm text-gray-900 rounded-[2px] focus:outline-none focus:border-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Reorder Level *
            </label>
            <input
              type="number"
              step="1"
              min="0"
              required
              value={form.reorder_level}
              onChange={(e) => setForm({ ...form, reorder_level: e.target.value })}
              placeholder="10"
              className="w-full border border-gray-300 bg-white px-2.5 py-1.5 font-mono text-sm text-gray-900 rounded-[2px] focus:outline-none focus:border-blue-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              disabled={submitting}
              className="border border-gray-300 bg-white hover:bg-gray-100 px-3 py-1.5 text-xs text-gray-700 rounded-[2px] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="border border-blue-700 bg-blue-700 hover:bg-blue-800 text-white px-3.5 py-1.5 text-xs font-medium rounded-[2px] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : editingId ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
