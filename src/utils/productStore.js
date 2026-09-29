import { PRODUCTS as DEFAULT_PRODUCTS } from '../mockData';

export const getProducts = () => {
  try {
    const saved = localStorage.getItem('vmart_products_catalog');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error("Error reading products:", e);
  }
  return DEFAULT_PRODUCTS;
};

export const saveProducts = (products) => {
  try {
    localStorage.setItem('vmart_products_catalog', JSON.stringify(products));
    window.dispatchEvent(new Event('vmart_products_updated'));
  } catch (e) {
    console.error("Error saving products:", e);
  }
};

export const addProduct = (productData) => {
  const products = getProducts();
  const newProduct = {
    id: `p${Date.now()}`,
    name: productData.name,
    category: productData.category || 'Accessories',
    description: productData.description || 'Premium tech product in eKart store.',
    price: parseFloat(productData.price) || 99.99,
    image: productData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    stock: parseInt(productData.stock) || 50,
    rating: parseFloat(productData.rating) || 4.8,
    specifications: productData.specifications || { Warranty: '1 Year', Origin: 'Official' }
  };
  const updated = [newProduct, ...products];
  saveProducts(updated);
  return newProduct;
};

export const updateProduct = (productId, updates) => {
  const products = getProducts();
  const updated = products.map(p => p.id === productId ? { 
    ...p, 
    ...updates,
    price: updates.price !== undefined ? parseFloat(updates.price) : p.price,
    stock: updates.stock !== undefined ? parseInt(updates.stock) : p.stock
  } : p);
  saveProducts(updated);
  return updated.find(p => p.id === productId);
};

export const deleteProduct = (productId) => {
  const products = getProducts();
  const updated = products.filter(p => p.id !== productId);
  saveProducts(updated);
  return updated;
};
