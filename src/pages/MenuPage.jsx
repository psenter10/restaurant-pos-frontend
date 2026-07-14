import React, { useState } from 'react';
import { useMenu } from '../context/MenuContext.jsx';
import ItemFormModal from '../components/ItemFormModal.jsx';
import ItemVariantsInfoModal from '../components/ItemVariantsInfoModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import StatRow from '../components/StatRow.jsx';
import IconTextButton from '../components/IconTextButton.jsx';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye } from '../components/icons.jsx';

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
  const [infoItem, setInfoItem] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', item }

  const filtered = search.trim()
    ? items.filter((i) => i.name.toLowerCase().includes(search.trim().toLowerCase()))
    : items;
  const availableCount = items.filter((i) => i.available !== false).length;

  function handleSave(data) {
    if (modalItem) {
      updateItem(modalItem.id, data);
      setModalItem(null);
    } else {
      addItem(data);
      setShowAddModal(false);
    }
  }

  function handleToggleAvailable(item) {
    if (item.available === false) {
      toggleAvailability(item.id); // re-activating needs no confirmation
    } else {
      setConfirmAction({ type: 'deactivate', item });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') removeItem(confirmAction.item.id);
    else toggleAvailability(confirmAction.item.id);
    setConfirmAction(null);
  }

  return (
    <div>
      <StatRow
        stats={[
          { label: 'Total Items', value: items.length },
          { label: 'Available', value: availableCount, tone: 'text-sage' },
          { label: 'Unavailable', value: items.length - availableCount, tone: 'text-rust' },
        ]}
      />

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
          const hasExtras = item.variants?.length > 0 || item.addons?.length > 0;
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
                  {hasExtras && (
                    <button
                      onClick={() => setInfoItem(item)}
                      className="flex items-center gap-1 text-[11px] text-navy font-medium mt-1.5 bg-navy/5 hover:bg-navy/10 rounded-full px-2 py-0.5"
                    >
                      <IconEye className="w-3 h-3" />
                      {item.variants?.length ? `${item.variants.length} variation${item.variants.length > 1 ? 's' : ''}` : ''}
                      {item.variants?.length && item.addons?.length ? ' · ' : ''}
                      {item.addons?.length ? `${item.addons.length} addon${item.addons.length > 1 ? 's' : ''}` : ''}
                    </button>
                  )}
                </div>
                <ToggleSwitch checked={!unavailable} onChange={() => handleToggleAvailable(item)} />
              </div>

              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-line/60">
                <IconTextButton icon={IconEdit} tone="navy" onClick={() => setModalItem(item)}>
                  Edit
                </IconTextButton>
                <IconTextButton
                  icon={IconTrash}
                  tone="rust"
                  onClick={() => setConfirmAction({ type: 'delete', item })}
                >
                  Delete
                </IconTextButton>
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

      {infoItem && <ItemVariantsInfoModal item={infoItem} onClose={() => setInfoItem(null)} />}

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete' ? 'Delete item?' : 'Mark item unavailable?'}
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.item.name}" will be permanently removed from the menu.`
              : `"${confirmAction.item.name}" will be hidden from the order screen until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : 'Mark Unavailable'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}

function CategoriesTab() {
  const {
    categories,
    items,
    addCategory,
    renameCategory,
    deleteCategory,
    isCategoryAvailable,
    toggleCategoryAvailability,
  } = useMenu();
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', name }

  const availableCount = categories.filter((c) => isCategoryAvailable(c)).length;

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

  function handleToggleAvailable(name) {
    if (!isCategoryAvailable(name)) {
      toggleCategoryAvailability(name);
    } else {
      setConfirmAction({ type: 'deactivate', name });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') deleteCategory(confirmAction.name);
    else toggleCategoryAvailability(confirmAction.name);
    setConfirmAction(null);
  }

  return (
    <div>
      <StatRow
        stats={[
          { label: 'Total Categories', value: categories.length },
          { label: 'Available', value: availableCount, tone: 'text-sage' },
          { label: 'Unavailable', value: categories.length - availableCount, tone: 'text-rust' },
        ]}
      />

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
          const available = isCategoryAvailable(cat);
          return (
            <div key={cat} className={`ticket-card p-3 ${available ? 'bg-white' : 'bg-line/20'}`}>
              <div className="flex items-center justify-between gap-2">
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
                  <span className={`text-sm font-medium truncate ${available ? '' : 'text-ink-soft'}`}>{cat}</span>
                )}
                <ToggleSwitch checked={available} onChange={() => handleToggleAvailable(cat)} />
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-line/60">
                <span className="text-xs text-ink-soft font-mono">{count} item{count === 1 ? '' : 's'}</span>
                <div className="flex items-center gap-2">
                  <IconTextButton icon={IconEdit} tone="navy" onClick={() => startEdit(cat)}>
                    Edit
                  </IconTextButton>
                  <IconTextButton
                    icon={IconTrash}
                    tone="rust"
                    onClick={() => setConfirmAction({ type: 'delete', name: cat })}
                  >
                    Delete
                  </IconTextButton>
                </div>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && <p className="text-sm text-ink-soft">No categories yet.</p>}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete' ? 'Delete category?' : 'Mark category unavailable?'}
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.name}" and all its items will be permanently removed.`
              : `"${confirmAction.name}" will be hidden until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : 'Mark Unavailable'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}

function GroupsTab() {
  const {
    groups,
    categories,
    addGroup,
    renameGroup,
    deleteGroup,
    toggleGroupAvailability,
    addCategoryToGroup,
    removeCategoryFromGroup,
  } = useMenu();
  const [newGroup, setNewGroup] = useState('');
  const [editingGroup, setEditingGroup] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate', name }

  const availableCount = groups.filter((g) => g.available !== false).length;

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

  function handleToggleAvailable(group) {
    if (group.available === false) {
      toggleGroupAvailability(group.name);
    } else {
      setConfirmAction({ type: 'deactivate', name: group.name });
    }
  }

  function runConfirmedAction() {
    if (!confirmAction) return;
    if (confirmAction.type === 'delete') deleteGroup(confirmAction.name);
    else toggleGroupAvailability(confirmAction.name);
    setConfirmAction(null);
  }

  return (
    <div>
      <StatRow
        stats={[
          { label: 'Total Groups', value: groups.length },
          { label: 'Available', value: availableCount, tone: 'text-sage' },
          { label: 'Unavailable', value: groups.length - availableCount, tone: 'text-rust' },
        ]}
      />

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
          const available = group.available !== false;
          return (
            <div key={group.name} className={`ticket-card p-4 ${available ? 'bg-white' : 'bg-line/20'}`}>
              <div className="flex items-center justify-between mb-3 gap-2">
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
                  <span className={`font-display font-semibold ${available ? '' : 'text-ink-soft'}`}>{group.name}</span>
                )}
                <ToggleSwitch checked={available} onChange={() => handleToggleAvailable(group)} />
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
                  className="border border-line rounded-md px-2.5 py-1.5 text-xs outline-none bg-white mb-3"
                >
                  <option value="">+ Add category to this group</option>
                  {unassigned.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-line/60">
                <IconTextButton icon={IconEdit} tone="navy" onClick={() => startEdit(group.name)}>
                  Edit
                </IconTextButton>
                <IconTextButton
                  icon={IconTrash}
                  tone="rust"
                  onClick={() => setConfirmAction({ type: 'delete', name: group.name })}
                >
                  Delete
                </IconTextButton>
              </div>
            </div>
          );
        })}
        {groups.length === 0 && <p className="text-sm text-ink-soft">No menu groups yet.</p>}
      </div>

      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'delete' ? 'Delete group?' : 'Mark group unavailable?'}
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.name}" will be permanently removed. Its categories and items are unaffected.`
              : `"${confirmAction.name}" will be hidden until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : 'Mark Unavailable'}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
