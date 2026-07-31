import React, { useEffect, useState } from 'react';
import { useMenu } from '../context/MenuContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import ItemFormModal from '../components/ItemFormModal.jsx';
import ItemVariantsInfoModal from '../components/ItemVariantsInfoModal.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import ToggleSwitch from '../components/ToggleSwitch.jsx';
import Spinner from '../components/Spinner.jsx';
import SubmitButton from '../components/SubmitButton.jsx';
import StatRow from '../components/StatRow.jsx';
import IconTextButton from '../components/IconTextButton.jsx';
import { IconPlus, IconTrash, IconSearch, IconEdit, IconEye, IconStar } from '../components/icons.jsx';

const TABS = ['Items', 'Categories', 'Groups'];

export default function MenuPage() {
  const [tab, setTab] = useState('Items');
  const { refreshMenu } = useMenu();

  // MenuContext is mounted once for the whole app session (POS order screen
  // needs it too), so without this its one-time initial fetch would go stale
  // across navigating away and back to this page — refetch every time it
  // mounts. Placed here (not in each tab) so switching tabs doesn't refetch.
  useEffect(() => {
    refreshMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const { items, categories, addItem, updateItem, removeItem, toggleAvailability, toggleFavourite } = useMenu();
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');
  const [modalItem, setModalItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [infoItem, setInfoItem] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate' | 'edit', item, data? }
  const [confirming, setConfirming] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [favouritingId, setFavouritingId] = useState(null);

  const filtered = search.trim()
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          i.shortCode?.includes(search.trim())
      )
    : items;
  const availableCount = items.filter((i) => i.available !== false).length;

  async function handleSave(data) {
    if (modalItem) {
      // editing an existing item — confirm before calling the API
      setConfirmAction({ type: 'edit', item: modalItem, data });
      setModalItem(null);
      return;
    }
    try {
      await addItem(data);
      showSuccess('Item added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not save the item. Please try again.'));
    }
  }

  async function handleToggleAvailable(item) {
    if (item.available === false) {
      // re-activating needs no confirmation
      setTogglingId(item.id);
      try {
        await toggleAvailability(item.id);
        showSuccess('Item marked available.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the item. Please try again.'));
      } finally {
        setTogglingId(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate', item });
    }
  }

  async function handleToggleFavourite(item) {
    setFavouritingId(item.id);
    try {
      await toggleFavourite(item.id);
      showSuccess(item.isFavourite ? 'Removed from favourites.' : 'Added to favourites.');
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update favourite status. Please try again.'));
    } finally {
      setFavouritingId(null);
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete') {
        await removeItem(confirmAction.item.id);
        showSuccess('Item deleted.');
      } else if (confirmAction.type === 'edit') {
        await updateItem(confirmAction.item.id, confirmAction.data);
        showSuccess('Item updated.');
      } else {
        await toggleAvailability(confirmAction.item.id);
        showSuccess('Item marked unavailable.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the item. Please try again.'));
    }
    setConfirming(false);
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

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
          <IconSearch className="w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items or code"
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
                    {item.shortCode && `#${item.shortCode} · `}
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
                <ToggleSwitch
                  checked={!unavailable}
                  onChange={() => handleToggleAvailable(item)}
                  loading={togglingId === item.id}
                />
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
                <button
                  onClick={() => handleToggleFavourite(item)}
                  disabled={favouritingId === item.id}
                  title={item.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                  aria-label={item.isFavourite ? 'Remove from Favourites' : 'Add to Favourites'}
                  className={`ml-auto w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors disabled:opacity-60 ${
                    item.isFavourite
                      ? 'bg-amber text-white'
                      : 'bg-white border border-line text-ink-soft hover:bg-line/40'
                  }`}
                >
                  {favouritingId === item.id ? (
                    <Spinner className="w-3.5 h-3.5 border-[1.5px]" tone={item.isFavourite ? 'border-t-white' : 'border-t-ink-soft'} />
                  ) : (
                    <IconStar className="w-4 h-4" />
                  )}
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

      {infoItem && <ItemVariantsInfoModal item={infoItem} onClose={() => setInfoItem(null)} />}

      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'delete'
              ? 'Delete item?'
              : confirmAction.type === 'edit'
              ? 'Save changes?'
              : 'Mark item unavailable?'
          }
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.item.name}" will be permanently removed from the menu.`
              : confirmAction.type === 'edit'
              ? `Save changes to "${confirmAction.item.name}"?`
              : `"${confirmAction.item.name}" will be hidden from the order screen until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'edit' ? 'Save Changes' : 'Mark Unavailable'}
          danger={confirmAction.type === 'delete'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}

function AddCategoryModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a category name.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(name);
    } catch {
      // parent already showed a toast with the reason; keep the modal open to retry
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[380px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Add Category</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Category Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Desserts"
            className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${error ? 'border-rust' : 'border-line'}`}
          />
          {error && <p className="text-xs text-rust mt-1">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Add Category</SubmitButton>
        </div>
      </form>
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
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'delete' | 'deactivate' | 'rename', name, newName? }
  const [confirming, setConfirming] = useState(false);
  const [togglingName, setTogglingName] = useState(null);

  const availableCount = categories.filter((c) => isCategoryAvailable(c)).length;
  const filtered = search.trim()
    ? categories.filter((c) => c.toLowerCase().includes(search.trim().toLowerCase()))
    : categories;

  async function handleAddCategory(name) {
    try {
      await addCategory(name);
      showSuccess('Category added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the category. Please try again.'));
      throw err;
    }
  }

  function startEdit(cat) {
    setEditingCategory(cat);
    setEditValue(cat);
  }

  function commitEdit() {
    if (!editingCategory) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      showError('Enter a category name.');
      return;
    }
    if (trimmed !== editingCategory) {
      setConfirmAction({ type: 'rename', name: editingCategory, newName: trimmed });
    }
    setEditingCategory(null);
  }

  async function handleToggleAvailable(name) {
    if (!isCategoryAvailable(name)) {
      setTogglingName(name);
      try {
        await toggleCategoryAvailability(name);
        showSuccess('Category marked available.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the category. Please try again.'));
      } finally {
        setTogglingName(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate', name });
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete') {
        await deleteCategory(confirmAction.name);
        showSuccess('Category deleted.');
      } else if (confirmAction.type === 'rename') {
        await renameCategory(confirmAction.name, confirmAction.newName);
        showSuccess('Category renamed.');
      } else {
        await toggleCategoryAvailability(confirmAction.name);
        showSuccess('Category marked unavailable.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the category. Please try again.'));
    }
    setConfirming(false);
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

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
          <IconSearch className="w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories"
            className="outline-none bg-transparent text-sm w-full"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 whitespace-nowrap"
        >
          <IconPlus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((cat) => {
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
                <ToggleSwitch
                  checked={available}
                  onChange={() => handleToggleAvailable(cat)}
                  loading={togglingName === cat}
                />
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
        {filtered.length === 0 && <p className="text-sm text-ink-soft">No categories match.</p>}
      </div>

      {showAddModal && (
        <AddCategoryModal onClose={() => setShowAddModal(false)} onSave={handleAddCategory} />
      )}

      {confirmAction && (
        <ConfirmModal
          title={
            confirmAction.type === 'delete'
              ? 'Delete category?'
              : confirmAction.type === 'rename'
              ? 'Rename category?'
              : 'Mark category unavailable?'
          }
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.name}" and all its items will be permanently removed.`
              : confirmAction.type === 'rename'
              ? `Rename "${confirmAction.name}" to "${confirmAction.newName}"?`
              : `"${confirmAction.name}" will be hidden until you turn it back on.`
          }
          confirmLabel={confirmAction.type === 'delete' ? 'Delete' : confirmAction.type === 'rename' ? 'Rename' : 'Mark Unavailable'}
          danger={confirmAction.type === 'delete'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}

function AddGroupModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Enter a group name.');
      return;
    }
    setSubmitting(true);
    try {
      await onSave(name);
    } catch {
      // parent already showed a toast with the reason; keep the modal open to retry
    }
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center z-50" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-md w-[380px] max-w-[92vw]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h3 className="font-display font-semibold text-lg">Add Group</h3>
          <button type="button" onClick={onClose} className="text-ink-soft hover:text-ink text-xl leading-none">
            ×
          </button>
        </div>
        <div className="px-5 py-4">
          <label className="block text-xs font-medium text-ink-soft mb-1.5">Group Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="e.g. Desserts"
            className={`w-full border rounded-md px-3 py-2 text-sm outline-none ${error ? 'border-rust' : 'border-line'}`}
          />
          {error && <p className="text-xs text-rust mt-1">{error}</p>}
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary text-sm disabled:opacity-50">
            Cancel
          </button>
          <SubmitButton submitting={submitting}>Add Group</SubmitButton>
        </div>
      </form>
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
  const { showSuccess, showError } = useToast();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editValue, setEditValue] = useState('');
  // { type: 'delete' | 'deactivate' | 'rename' | 'remove-category', name, newName?, categoryName? }
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [togglingName, setTogglingName] = useState(null);

  const availableCount = groups.filter((g) => g.available !== false).length;
  const filtered = search.trim()
    ? groups.filter((g) => g.name.toLowerCase().includes(search.trim().toLowerCase()))
    : groups;

  async function handleAddGroup(name) {
    try {
      await addGroup(name);
      showSuccess('Group added.');
      setShowAddModal(false);
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the group. Please try again.'));
      throw err;
    }
  }

  function startEdit(group) {
    setEditingGroup(group);
    setEditValue(group);
  }

  function commitEdit() {
    if (!editingGroup) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      showError('Enter a group name.');
      return;
    }
    if (trimmed !== editingGroup) {
      setConfirmAction({ type: 'rename', name: editingGroup, newName: trimmed });
    }
    setEditingGroup(null);
  }

  async function handleToggleAvailable(group) {
    if (group.available === false) {
      setTogglingName(group.name);
      try {
        await toggleGroupAvailability(group.name);
        showSuccess('Group marked available.');
      } catch (err) {
        showError(apiErrorMessage(err, 'Could not update the group. Please try again.'));
      } finally {
        setTogglingName(null);
      }
    } else {
      setConfirmAction({ type: 'deactivate', name: group.name });
    }
  }

  function handleRemoveCategoryFromGroup(groupName, categoryName) {
    setConfirmAction({ type: 'remove-category', name: groupName, categoryName });
  }

  async function runConfirmedAction() {
    if (!confirmAction) return;
    setConfirming(true);
    try {
      if (confirmAction.type === 'delete') {
        await deleteGroup(confirmAction.name);
        showSuccess('Group deleted.');
      } else if (confirmAction.type === 'rename') {
        await renameGroup(confirmAction.name, confirmAction.newName);
        showSuccess('Group renamed.');
      } else if (confirmAction.type === 'remove-category') {
        await removeCategoryFromGroup(confirmAction.name, confirmAction.categoryName);
        showSuccess('Category removed from group.');
      } else {
        await toggleGroupAvailability(confirmAction.name);
        showSuccess('Group marked unavailable.');
      }
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not update the group. Please try again.'));
    }
    setConfirming(false);
    setConfirmAction(null);
  }

  async function handleAddCategoryToGroup(groupName, categoryName) {
    try {
      await addCategoryToGroup(groupName, categoryName);
      showSuccess('Category added to group.');
    } catch (err) {
      showError(apiErrorMessage(err, 'Could not add the category to this group.'));
    }
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

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 border border-line rounded-md px-3 py-2 flex-1 max-w-sm bg-white">
          <IconSearch className="w-4 h-4 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search groups"
            className="outline-none bg-transparent text-sm w-full"
          />
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-rust text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-rust/90 whitespace-nowrap"
        >
          <IconPlus className="w-4 h-4" /> Add Group
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((group) => {
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
                <ToggleSwitch
                  checked={available}
                  onChange={() => handleToggleAvailable(group)}
                  loading={togglingName === group.name}
                />
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
                      onClick={() => handleRemoveCategoryFromGroup(group.name, cat)}
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
                  onChange={(e) => e.target.value && handleAddCategoryToGroup(group.name, e.target.value)}
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
        {filtered.length === 0 && <p className="text-sm text-ink-soft">No menu groups match.</p>}
      </div>

      {showAddModal && (
        <AddGroupModal onClose={() => setShowAddModal(false)} onSave={handleAddGroup} />
      )}

      {confirmAction && (
        <ConfirmModal
          title={
            {
              delete: 'Delete group?',
              rename: 'Rename group?',
              'remove-category': 'Remove category from group?',
              deactivate: 'Mark group unavailable?',
            }[confirmAction.type]
          }
          message={
            confirmAction.type === 'delete'
              ? `"${confirmAction.name}" will be permanently removed. Its categories and items are unaffected.`
              : confirmAction.type === 'rename'
              ? `Rename "${confirmAction.name}" to "${confirmAction.newName}"?`
              : confirmAction.type === 'remove-category'
              ? `Remove "${confirmAction.categoryName}" from "${confirmAction.name}"?`
              : `"${confirmAction.name}" will be hidden until you turn it back on.`
          }
          confirmLabel={
            {
              delete: 'Delete',
              rename: 'Rename',
              'remove-category': 'Remove',
              deactivate: 'Mark Unavailable',
            }[confirmAction.type]
          }
          danger={confirmAction.type === 'delete'}
          confirming={confirming}
          onCancel={() => setConfirmAction(null)}
          onConfirm={runConfirmedAction}
        />
      )}
    </div>
  );
}
