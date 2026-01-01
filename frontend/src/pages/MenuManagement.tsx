import { useState, useEffect } from 'react';
import api from '../utils/api';
import { formatCurrency } from '../utils/format';
import type { MenuItem, MenuCategory } from '../types';
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Search,
  Image,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

export default function MenuManagement() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '',
    isAvailable: true,
  });
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    displayOrder: '0',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu/items'),
      ]);
      setCategories(catRes.data);
      setItems(itemRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch =
      !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const openItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price.toString(),
        categoryId: item.category_id || '',
        isAvailable: item.is_available,
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        categoryId: '',
        isAvailable: true,
      });
    }
    setImageFile(null);
    setShowItemModal(true);
  };

  const openCategoryModal = (category?: MenuCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        displayOrder: category.display_order.toString(),
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', displayOrder: '0' });
    }
    setShowCategoryModal(true);
  };

  const saveItem = async () => {
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('categoryId', formData.categoryId);
      data.append('isAvailable', formData.isAvailable.toString());
      if (imageFile) {
        data.append('image', imageFile);
      }

      if (editingItem) {
        await api.put(`/menu/items/${editingItem.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/menu/items', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowItemModal(false);
      loadData();
    } catch (error) {
      console.error('Save item failed:', error);
      alert('Failed to save item');
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await api.delete(`/menu/items/${id}`);
      loadData();
    } catch (error) {
      console.error('Delete item failed:', error);
      alert('Failed to delete item');
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await api.patch(`/menu/items/${item.id}/availability`, {
        isAvailable: !item.is_available,
      });
      loadData();
    } catch (error) {
      console.error('Toggle availability failed:', error);
    }
  };

  const saveCategory = async () => {
    try {
      if (editingCategory) {
        await api.put(`/menu/categories/${editingCategory.id}`, {
          name: categoryFormData.name,
          displayOrder: parseInt(categoryFormData.displayOrder),
        });
      } else {
        await api.post('/menu/categories', {
          name: categoryFormData.name,
          displayOrder: parseInt(categoryFormData.displayOrder),
        });
      }
      setShowCategoryModal(false);
      loadData();
    } catch (error) {
      console.error('Save category failed:', error);
      alert('Failed to save category');
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await api.delete(`/menu/categories/${id}`);
      loadData();
    } catch (error) {
      console.error('Delete category failed:', error);
      alert('Failed to delete category');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={() => openCategoryModal()}>
            <Plus size={18} /> Category
          </button>
          <button className="btn btn-primary" onClick={() => openItemModal()}>
            <Plus size={18} /> Menu Item
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4">
          <h2 className="font-bold mb-2">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="badge badge-lg gap-2 p-3">
                <span>{cat.name}</span>
                <button
                  className="btn btn-ghost btn-xs p-0"
                  onClick={() => openCategoryModal(cat)}
                >
                  <Edit2 size={12} />
                </button>
                <button
                  className="btn btn-ghost btn-xs p-0 text-error"
                  onClick={() => deleteCategory(cat.id)}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            className="input input-bordered w-full pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="select select-bordered"
          value={selectedCategory || ''}
          onChange={(e) => setSelectedCategory(e.target.value || null)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`card bg-base-100 shadow ${!item.is_available ? 'opacity-60' : ''}`}
          >
            {item.image_url ? (
              <figure className="h-40 bg-base-200">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </figure>
            ) : (
              <figure className="h-40 bg-base-200 flex items-center justify-center">
                <Image size={48} className="text-base-content/20" />
              </figure>
            )}
            <div className="card-body p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="text-sm text-base-content/60">{item.category_name}</p>
                </div>
                <span className="text-primary font-bold">{formatCurrency(item.price)}</span>
              </div>
              {item.description && (
                <p className="text-sm text-base-content/60 line-clamp-2">
                  {item.description}
                </p>
              )}
              <div className="card-actions justify-between items-center mt-2">
                <button
                  className={`btn btn-sm ${item.is_available ? 'btn-success' : 'btn-ghost'}`}
                  onClick={() => toggleAvailability(item)}
                >
                  {item.is_available ? (
                    <>
                      <ToggleRight size={16} /> Available
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={16} /> Unavailable
                    </>
                  )}
                </button>
                <div className="flex gap-1">
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => openItemModal(item)}
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="btn btn-sm btn-ghost text-error"
                    onClick={() => deleteItem(item.id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showItemModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
            </h3>
            <div className="py-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Price (RM)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input input-bordered"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Image</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Available</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-success"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  />
                </label>
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowItemModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={saveItem}>
                <Check size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            <div className="py-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={categoryFormData.name}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, name: e.target.value })
                  }
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Display Order</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered"
                  value={categoryFormData.displayOrder}
                  onChange={(e) =>
                    setCategoryFormData({ ...categoryFormData, displayOrder: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowCategoryModal(false)}>
                <X size={18} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={saveCategory}>
                <Check size={18} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
