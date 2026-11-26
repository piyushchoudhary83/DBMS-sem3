const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(status, message, details = null) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the backend server at ' + BASE_URL);
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    // Backend returns { error: '...' } or { message: '...' }
    const message =
      body?.error ||
      body?.message ||
      (res.status ? `HTTP ${res.status}: ${res.statusText}` : 'Request failed');
    throw new ApiError(res.status, message, body);
  }

  return body;
}

export const CATEGORIES = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Stationery' },
  { id: 3, name: 'Grocery' },
];

export const CATEGORY_MAP = {
  1: 'Electronics',
  2: 'Stationery',
  3: 'Grocery',
};

// GET /products
export const getProducts = () => request('/products');

// GET /products/low-stock
export const getLowStockProducts = () => request('/products/low-stock');

// POST /products { name, category_id, price, reorder_level }
export const addProduct = ({ name, category_id, price, reorder_level }) =>
  request('/products', {
    method: 'POST',
    body: JSON.stringify({
      name: String(name).trim(),
      category_id: Number(category_id),
      price: Number(price),
      reorder_level: Number(reorder_level),
    }),
  });

// PUT /products/:id { name, category_id, price, reorder_level }
export const updateProduct = (id, { name, category_id, price, reorder_level }) =>
  request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      name: String(name).trim(),
      category_id: Number(category_id),
      price: Number(price),
      reorder_level: Number(reorder_level),
    }),
  });

// DELETE /products/:id
export const deleteProduct = (id) =>
  request(`/products/${id}`, {
    method: 'DELETE',
  });

// POST /stock { product_id, type, quantity }
export const postStockMovement = ({ product_id, type, quantity }) =>
  request('/stock', {
    method: 'POST',
    body: JSON.stringify({
      product_id: Number(product_id),
      type: String(type).toUpperCase(),
      quantity: Number(quantity),
    }),
  });

// GET /history
export const getHistory = () => request('/history');
