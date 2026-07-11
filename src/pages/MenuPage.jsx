import React, { useState } from 'react';
import { useMenu } from '../context/MenuContext.jsx';
import ItemFormModal from '../components/ItemFormModal.jsx';
import { IconPlus, IconTrash, IconSearch } from '../components/icons.jsx';

const TABS = ['Items', 'Categories', 'Groups'];

export default function MenuPage() {
  const [tab, setTab] = useState('Items');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl font-semibold">Menu Management</h1>
      </div>

      <div className="flex items-center gap-1 border-b border-line mb-6">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-navy text-navy' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Items' && <ItemsTab />}
      {tab === 'Categories' && <CategoriesTab />}
      {tab === 'Groups' && <GroupsTab />}
    </div>
  );
}

function ItemsTab() {
  const { items, categories, addItem, updateItem, removeItem, toggleAvailability } = useMenu();
  const [search, setSearch] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : items;

  function handleSave(data) {
    if (modalItem) {
      updateItem(modalItem.id, data);
      setModalItem(null);
    } else {
      addItem(data);
      setShowAddModal(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
          <IconSearch className="w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items"
            className="outline-none bg-transparent text-sm w-full"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          disabled={categories.length === 0}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 disabled:opacity-40"
        >
          <IconPlus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-ink-soft mb-4">
          Add a category first (see the Categories tab) before adding menu items.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((item) => {
          const unavailable = item.available === false;
          return (
            <div
              key={item.id}
              className={`ticket-card p-3 ${unavailable ? 'bg-line/20' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${item.veg === false ? 'bg-amber' : 'bg-sage'}`}
                    />
                    <span className={`font-medium text-sm truncate ${unavailable ? 'text-ink-soft' : ''}`}>
                      {item.name}
                    </span>
                  </div>
                  <div className="text-xs text-ink-soft font-mono mt-1">
                    {item.category} · ₹{Number(item.price).toFixed(2)}
                  </div>
                  {item.variants?.length > 0 && (
                    <div className="text-[11px] text-ink-soft mt-1">
                      {item.variants.length} variation{item.variants.length > 1 ? 's' : ''}
                      {item.addons?.length ? `, ${item.addons.length} addons` : ''}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-rust hover:text-rust/80 shrink-0"
                  aria-label={`Delete ${item.name}`}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/60">
                <label className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={!unavailable}
                    onChange={() => toggleAvailability(item.id)}
                  />
                  {unavailable ? 'Unavailable' : 'Available'}
                </label>
                <button
                  onClick={() => setModalItem(item)}
                  className="text-navy text-xs font-medium hover:underline"
                >
                  Edit
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-ink-soft">No menu items match.</p>
        )}
      </div>

      {(showAddModal || modalItem) && (
        <ItemFormModal
          item={modalItem}
          categories={categories}
          onCancel={() => {
            setModalItem(null);
            setShowAddModal(false);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function CategoriesTab() {
  const { categories, items, addCategory, renameCategory, deleteCategory } = useMenu();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newCategory.trim()) return;
    addCategory(newCategory);
    setNewCategory('');
  }

  function startEdit(cat) {
    setEditingCategory(cat);
    setEditValue(cat);
  }

  function commitEdit() {
    if (editingCategory && editValue.trim() && editValue.trim() !== editingCategory) {
      renameCategory(editingCategory, editValue.trim());
    }
    setEditingCategory(null);
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4 max-w-lg">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((cat) => {
          const count = items.filter((i) => i.category === cat).length;
          return (
            <div key={cat} className="ticket-card bg-white p-3 flex items-center justify-between">
              {editingCategory === cat ? (
                <input
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                  className="flex-1 border border-line rounded-md px-2 py-1 text-sm outline-none mr-2"
                />
              ) : (
                <button onClick={() => startEdit(cat)} className="text-sm font-medium text-left hover:underline truncate">
                  {cat}
                </button>
              )}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-ink-soft font-mono">{count} item{count === 1 ? '' : 's'}</span>
                <button
                  onClick={() => deleteCategory(cat)}
                  className="text-rust hover:text-rust/80"
                  aria-label={`Delete ${cat}`}
                  title="Deletes this category and its items"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-sm text-ink-soft">No categories yet.</p>}
      </div>
    </div>
  );
}

function GroupsTab() {
  const { groups, categories, addGroup, renameGroup, deleteGroup, addCategoryToGroup, removeCategoryFromGroup } =
    useMenu();
  const [newGroup, setNewGroup] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editValue, setEditValue] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newGroup.trim()) return;
    addGroup(newGroup);
    setNewGroup('');
  }

  function startEdit(group) {
    setEditingGroup(group);
    setEditValue(group);
  }

  function commitEdit() {
    if (editingGroup && editValue.trim() && editValue.trim() !== editingGroup) {
      renameGroup(editingGroup, editValue.trim());
    }
    setEditingGroup(null);
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-4 max-w-lg">
        <input
          value={newGroup}
          onChange={(e) => setNewGroup(e.target.value)}
          placeholder="New menu group name (e.g. Desserts)"
          className="flex-1 border border-line rounded-md px-3 py-2 text-sm outline-none"
        />
        <button type="submit" className="bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90">
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {groups.map((group) => {
          const unassigned = categories.filter((c) => !group.categories.includes(c));
          return (
            <div key={group.name} className="ticket-card bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                {editingGroup === group.name ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={(e) => e.key === 'Enter' && commitEdit()}
                    className="border border-line rounded-md px-2 py-1 text-sm font-semibold outline-none"
                  />
                ) : (
                  <button
                    onClick={() => startEdit(group.name)}
                    className="font-display font-semibold hover:underline"
                  >
                    {group.name}
                  </button>
                )}
                <button
                  onClick={() => deleteGroup(group.name)}
                  className="text-rust hover:text-rust/80"
                  aria-label={`Delete ${group.name}`}
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-3">
                {group.categories.length === 0 && (
                  <span className="text-xs text-ink-soft">No categories assigned yet.</span>
                )}
                {group.categories.map((cat) => (
                  <span
                    key={cat}
                    className="flex items-center gap-1.5 bg-sage-light text-ink text-xs font-medium px-2.5 py-1 rounded-full"
                  >
                    {cat}
                    <button
                      onClick={() => removeCategoryFromGroup(group.name, cat)}
                      className="text-ink-soft hover:text-rust"
                      aria-label={`Remove ${cat} from ${group.name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              {unassigned.length > 0 && (
                <select
                  value=""
                  onChange={(e) => e.target.value && addCategoryToGroup(group.name, e.target.value)}
                  className="border border-line rounded-md px-2.5 py-1.5 text-xs outline-none bg-white"
                >
                  <option value="">+ Add category to this group</option>
                  {unassigned.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          );
        })}
        {groups.length === 0 && <p className="text-sm text-ink-soft">No menu groups yet.</p>}
      </div>
    </div>
  );
}
