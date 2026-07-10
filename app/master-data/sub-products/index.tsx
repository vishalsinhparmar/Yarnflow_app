import { useToast } from '@/components/ui/Toast';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { categoryAPI, productAPI, subProductAPI } from '../../../services/masterDataAPI';

interface Category { _id: string; categoryName: string; }
interface Product { _id: string; productName: string; category: any; }
interface SubProduct { _id: string; name: string; }

// ─── Add Sub-Product Modal ────────────────────────────────────────────────────
function AddSubProductModal({
  categories,
  allProducts,
  preCategory = '',
  preProduct = '',
  onClose,
  onAdded,
}: {
  categories: Category[];
  allProducts: Product[];
  preCategory?: string;
  preProduct?: string;
  onClose: () => void;
  onAdded: (productId: string) => void;
}) {
  const toast = useToast();
  const [modalCategory, setModalCategory] = useState(preCategory);
  const [modalProduct, setModalProduct] = useState(preProduct);
  const [nameInput, setNameInput] = useState('');
  const [saving, setSaving] = useState(false);

  const modalProducts = modalCategory
    ? allProducts.filter(p => (p.category?._id || p.category) === modalCategory)
    : allProducts;

  const canAdd = !!modalProduct && nameInput.trim().length > 0 && !saving;
  const selectedProductObj = allProducts.find(p => p._id === modalProduct);

  const handleAdd = async (andClose = false) => {
    const name = nameInput.trim();
    if (!modalProduct || !name) return;
    setSaving(true);
    try {
      const res = await subProductAPI.bulkAdd(modalProduct, [name]);
      if (res?.success) {
        toast.showToast('success', 'Added', `"${name}" added successfully`);
        onAdded(modalProduct);
        setNameInput('');
        if (andClose) onClose();
      }
    } catch (e: any) {
      toast.showToast('error', 'Failed', e.message || 'Could not add sub-product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <View style={styles.modalIconWrap}>
                <Ionicons name="git-branch" size={20} color="#0D9488" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Add Sub-Product</Text>
                <Text style={styles.modalSubtitle}>Select product and enter a size or variant</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            {/* Step 1 — Category */}
            <Text style={styles.stepLabel}>
              <Ionicons name="folder-open-outline" size={13} color="#0D9488" />{'  '}Step 1 — Select Category
            </Text>
            <View style={styles.pickerWrap}>
              <Ionicons name="folder-open-outline" size={16} color="#9CA3AF" style={styles.pickerIcon} />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                <TouchableOpacity
                  style={[styles.chip, !modalCategory && styles.chipActive]}
                  onPress={() => { setModalCategory(''); setModalProduct(''); }}
                >
                  <Text style={[styles.chipText, !modalCategory && styles.chipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map(c => (
                  <TouchableOpacity
                    key={c._id}
                    style={[styles.chip, modalCategory === c._id && styles.chipActive]}
                    onPress={() => { setModalCategory(c._id); setModalProduct(''); }}
                  >
                    <Text style={[styles.chipText, modalCategory === c._id && styles.chipTextActive]}>{c.categoryName}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Step 2 — Product */}
            <Text style={[styles.stepLabel, { marginTop: 16 }]}>
              <Ionicons name="cube-outline" size={13} color="#0D9488" />{'  '}Step 2 — Select Product
            </Text>
            {modalProducts.length === 0 ? (
              <View style={styles.noProductsWrap}>
                <Ionicons name="alert-circle-outline" size={16} color="#F59E0B" />
                <Text style={styles.noProductsText}>No products found in this category</Text>
              </View>
            ) : (
              <View style={styles.productList}>
                {modalProducts.map(p => (
                  <TouchableOpacity
                    key={p._id}
                    style={[styles.productOption, modalProduct === p._id && styles.productOptionActive]}
                    onPress={() => setModalProduct(p._id)}
                  >
                    <Ionicons
                      name={modalProduct === p._id ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={modalProduct === p._id ? '#0D9488' : '#9CA3AF'}
                    />
                    <Text style={[styles.productOptionText, modalProduct === p._id && styles.productOptionTextActive]}>
                      {p.productName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Step 3 — Name */}
            <Text style={[styles.stepLabel, { marginTop: 16 }]}>
              <Ionicons name="pricetag-outline" size={13} color="#0D9488" />{'  '}Step 3 — Sub-Product Name / Size
            </Text>
            <TextInput
              style={[styles.nameInput, !modalProduct && styles.nameInputDisabled]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder={modalProduct ? 'e.g. 3, 6, 8, 14, 22 inch...' : '— Select product first —'}
              placeholderTextColor="#9CA3AF"
              editable={!!modalProduct}
              returnKeyType="done"
              onSubmitEditing={() => canAdd && handleAdd(true)}
            />
            {selectedProductObj && (
              <Text style={styles.addingToText}>
                Adding to: <Text style={styles.addingToProduct}>{selectedProductObj.productName}</Text>
              </Text>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAddAnother, !canAdd && styles.btnDisabled]}
              onPress={() => handleAdd(false)}
              disabled={!canAdd}
            >
              {saving ? <ActivityIndicator size="small" color="#0D9488" /> : <Ionicons name="add" size={16} color="#0D9488" />}
              <Text style={styles.btnAddAnotherText}>Add & Another</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnAddClose, !canAdd && styles.btnDisabled]}
              onPress={() => handleAdd(true)}
              disabled={!canAdd}
            >
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="checkmark" size={16} color="#FFF" />}
              <Text style={styles.btnAddCloseText}>Add & Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function SubProductsScreen() {
  const toast = useToast();

  const [categories, setCategories] = useState<Category[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [subProducts, setSubProducts] = useState<SubProduct[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [modalPreset, setModalPreset] = useState({ category: '', product: '' });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load categories + all products on mount ───────────────────────
  useEffect(() => {
    Promise.all([
      categoryAPI.getAll(),
      productAPI.getAll({ limit: 500 }),
    ]).then(([catRes, prodRes]) => {
      if (catRes?.success) setCategories(catRes.data || []);
      if (prodRes?.success) setAllProducts(prodRes.data || []);
    }).finally(() => setInitialLoading(false));
  }, []);

  // ── Derived: products visible based on category filter ────────────
  const filteredProducts = selectedCategory
    ? allProducts.filter(p => (p.category?._id || p.category) === selectedCategory)
    : allProducts;

  // Reset product if it no longer belongs to newly selected category
  useEffect(() => {
    if (selectedProduct && selectedCategory) {
      const still = allProducts.find(
        p => p._id === selectedProduct && (p.category?._id || p.category) === selectedCategory
      );
      if (!still) setSelectedProduct('');
    }
  }, [selectedCategory]);

  // ── Load sub-products when product selected ───────────────────────
  const loadSubProducts = useCallback(async (productId: string) => {
    if (!productId) { setSubProducts([]); return; }
    setLoading(true);
    try {
      const res = await subProductAPI.getAll(productId);
      if (res?.success) setSubProducts(res.data || []);
    } catch (e) {
      console.error('SubProducts load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubProducts(selectedProduct);
  }, [selectedProduct]);

  useFocusEffect(
    useCallback(() => {
      if (selectedProduct) loadSubProducts(selectedProduct);
    }, [selectedProduct])
  );

  // ── Filtered sub-products for search ─────────────────────────────
  const visibleSubProducts = subProducts.filter(sp =>
    !search || sp.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedProductObj = allProducts.find(p => p._id === selectedProduct);
  const selectedCategoryObj = categories.find(c => c._id === selectedCategory);

  // ── Add modal helpers ────────────────────────────────────────────
  const openAddModal = (withPreset = false) => {
    if (withPreset && selectedProduct && selectedProductObj) {
      const catId = selectedProductObj.category?._id || selectedProductObj.category || '';
      setModalPreset({ category: catId, product: selectedProduct });
    } else {
      setModalPreset({ category: '', product: '' });
    }
    setShowAddModal(true);
  };

  const handleModalAdded = (productId: string) => {
    if (productId === selectedProduct) loadSubProducts(selectedProduct);
    productAPI.getAll({ limit: 500 }).then(res => {
      if (res?.success) setAllProducts(res.data || []);
    });
  };

  // ── Edit ─────────────────────────────────────────────────────────
  const saveEdit = async () => {
    const name = editingName.trim();
    if (!name || !editingId) return;
    setSaving(true);
    try {
      const res = await subProductAPI.update(editingId, { name });
      if (res?.success) {
        setSubProducts(prev => prev.map(sp => sp._id === editingId ? { ...sp, name } : sp));
        setEditingId(null);
        toast.showToast('success', 'Updated', `Sub-product updated to "${name}"`);
      }
    } catch (e: any) {
      toast.showToast('error', 'Failed', e.message || 'Could not update');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────
  const confirmDelete = async (id: string) => {
    setSaving(true);
    try {
      const res = await subProductAPI.delete(id);
      if (res?.success) {
        setSubProducts(prev => prev.filter(sp => sp._id !== id));
        setDeletingId(null);
        toast.showToast('success', 'Deleted', 'Sub-product removed');
      }
    } catch (e: any) {
      toast.showToast('error', 'Failed', e.message || 'Could not delete');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add Modal */}
      {showAddModal && (
        <AddSubProductModal
          categories={categories}
          allProducts={allProducts}
          preCategory={modalPreset.category}
          preProduct={modalPreset.product}
          onClose={() => setShowAddModal(false)}
          onAdded={handleModalAdded}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="git-branch" size={22} color="#0D9488" />
          <Text style={styles.headerTitle}>Sub-Product Management</Text>
        </View>
        <Text style={styles.headerSub}>Filter by category and product to view or edit</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openAddModal(false)}>
          <Ionicons name="add" size={18} color="#FFF" />
          <Text style={styles.addBtnText}>Add Sub-Product</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filtersCard}>
        <Text style={styles.filtersLabel}>FILTER & VIEW</Text>

        {/* Category chips */}
        <Text style={styles.filterTitle}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedCategory && styles.chipActive]}
            onPress={() => { setSelectedCategory(''); setSelectedProduct(''); }}
          >
            <Text style={[styles.chipText, !selectedCategory && styles.chipTextActive]}>All</Text>
          </TouchableOpacity>
          {categories.map(c => (
            <TouchableOpacity
              key={c._id}
              style={[styles.chip, selectedCategory === c._id && styles.chipActive]}
              onPress={() => setSelectedCategory(c._id)}
            >
              <Text style={[styles.chipText, selectedCategory === c._id && styles.chipTextActive]}>{c.categoryName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Product selector */}
        <Text style={[styles.filterTitle, { marginTop: 10 }]}>Product</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          <TouchableOpacity
            style={[styles.chip, !selectedProduct && styles.chipActive]}
            onPress={() => setSelectedProduct('')}
          >
            <Text style={[styles.chipText, !selectedProduct && styles.chipTextActive]}>— Select Product —</Text>
          </TouchableOpacity>
          {filteredProducts.map(p => (
            <TouchableOpacity
              key={p._id}
              style={[styles.chip, selectedProduct === p._id && styles.chipActive]}
              onPress={() => setSelectedProduct(p._id)}
            >
              <Text style={[styles.chipText, selectedProduct === p._id && styles.chipTextActive]}>{p.productName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search bar */}
        {selectedProduct ? (
          <View style={styles.searchWrap}>
            <Ionicons name="search" size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search sub-products by name..."
              placeholderTextColor="#9CA3AF"
              returnKeyType="search"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={styles.contentCard}>
        {/* Content header */}
        <View style={styles.contentHeader}>
          {selectedProductObj ? (
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="git-branch" size={16} color="#0D9488" />
                <Text style={styles.contentTitle}>{selectedProductObj.productName}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{subProducts.length} sub-product{subProducts.length !== 1 ? 's' : ''}</Text>
                </View>
              </View>
              <Text style={styles.contentSub}>
                {selectedCategoryObj?.categoryName || selectedProductObj?.category?.categoryName || 'No category'}
              </Text>
            </View>
          ) : (
            <Text style={styles.contentPlaceholder}>Select a product above to view its sub-products</Text>
          )}
          {selectedProduct ? (
            <TouchableOpacity style={styles.quickAddBtn} onPress={() => openAddModal(true)}>
              <Ionicons name="add" size={14} color="#0D9488" />
              <Text style={styles.quickAddBtnText}>Add</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Sub-product list */}
        {!selectedProduct ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="git-branch-outline" size={36} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>No product selected</Text>
            <Text style={styles.emptySub}>Choose a category and product from the filters above</Text>
            <TouchableOpacity style={styles.emptyAddBtn} onPress={() => openAddModal(false)}>
              <Ionicons name="add" size={16} color="#FFF" />
              <Text style={styles.emptyAddBtnText}>Add a Sub-Product now</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#0D9488" />
            <Text style={styles.loadingText}>Loading sub-products...</Text>
          </View>
        ) : visibleSubProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="git-branch-outline" size={36} color="#D1D5DB" />
            </View>
            <Text style={styles.emptyTitle}>
              {search ? 'No matches found' : `No sub-products for "${selectedProductObj?.productName}"`}
            </Text>
            <Text style={styles.emptySub}>
              {search ? 'Try a different search term' : 'Tap the button below to add the first one'}
            </Text>
            {!search && (
              <TouchableOpacity style={styles.emptyAddBtn} onPress={() => openAddModal(true)}>
                <Ionicons name="add" size={16} color="#FFF" />
                <Text style={styles.emptyAddBtnText}>Add Sub-Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={visibleSubProducts}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => (
              <View style={styles.row}>
                <Text style={styles.rowNum}>{index + 1}</Text>

                {/* Name — inline editable */}
                {editingId === item._id ? (
                  <View style={styles.editRow}>
                    <TextInput
                      autoFocus
                      style={styles.editInput}
                      value={editingName}
                      onChangeText={setEditingName}
                      onSubmitEditing={saveEdit}
                      returnKeyType="done"
                    />
                    <TouchableOpacity onPress={saveEdit} disabled={saving} style={styles.editAction}>
                      <Ionicons name="checkmark" size={18} color="#0D9488" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setEditingId(null)} style={styles.editAction}>
                      <Ionicons name="close" size={18} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.nameChip}>
                    <Ionicons name="pricetag" size={12} color="#0D9488" />
                    <Text style={styles.nameChipText}>{item.name}</Text>
                  </View>
                )}

                {/* Actions */}
                {deletingId === item._id ? (
                  <View style={styles.deleteConfirmRow}>
                    <Ionicons name="alert-circle" size={14} color="#EF4444" />
                    <Text style={styles.deleteConfirmText}>Delete?</Text>
                    <TouchableOpacity
                      style={styles.deleteYesBtn}
                      onPress={() => confirmDelete(item._id)}
                      disabled={saving}
                    >
                      <Text style={styles.deleteYesText}>Yes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteNoBtn}
                      onPress={() => setDeletingId(null)}
                    >
                      <Text style={styles.deleteNoText}>No</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => { setEditingId(item._id); setEditingName(item.name); }}
                    >
                      <Ionicons name="pencil" size={13} color="#0D9488" />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.delBtn}
                      onPress={() => setDeletingId(item._id)}
                    >
                      <Ionicons name="trash" size={13} color="#EF4444" />
                      <Text style={styles.delBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
            ListFooterComponent={
              selectedProduct && !loading && subProducts.length > 0 ? (
                <View style={styles.listFooter}>
                  <Text style={styles.listFooterText}>
                    Showing {visibleSubProducts.length} of {subProducts.length} sub-product{subProducts.length !== 1 ? 's' : ''}
                    {search ? ` · filtered by "${search}"` : ''}
                  </Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </View>
  );
}

const TEAL = '#0D9488';
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: '#6B7280', fontSize: 14 },
  loadingWrap: { paddingVertical: 40, alignItems: 'center' },

  // Header
  header: {
    backgroundColor: '#FFF',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginBottom: 12 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: TEAL, paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 8, alignSelf: 'flex-start',
  },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Filters
  filtersCard: {
    backgroundColor: '#FFF',
    margin: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  filtersLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 1, marginBottom: 10 },
  filterTitle: { fontSize: 12, fontWeight: '600', color: '#374151', marginBottom: 6 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB', marginRight: 8,
  },
  chipActive: { backgroundColor: TEAL, borderColor: TEAL },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1,
    borderColor: '#E5E7EB', paddingHorizontal: 10, marginTop: 10,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: '#111827' },

  // Content
  contentCard: {
    flex: 1, backgroundColor: '#FFF',
    marginHorizontal: 12, marginBottom: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  contentHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  contentTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  contentSub: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  contentPlaceholder: { fontSize: 13, color: '#9CA3AF' },
  countBadge: { backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 11, color: TEAL, fontWeight: '600' },
  quickAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4', borderRadius: 8,
  },
  quickAddBtnText: { fontSize: 13, color: TEAL, fontWeight: '600' },

  // Rows
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    gap: 10,
  },
  rowNum: { fontSize: 13, color: '#9CA3AF', width: 22 },
  nameChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#99F6E4',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start',
  },
  nameChipText: { fontSize: 14, fontWeight: '700', color: '#134E4A' },
  editRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  editInput: {
    flex: 1, borderWidth: 1, borderColor: TEAL, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, color: '#111827',
  },
  editAction: { padding: 4 },
  actionRow: { flexDirection: 'row', gap: 6 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#F0FDFA', borderRadius: 6,
  },
  editBtnText: { fontSize: 12, color: TEAL, fontWeight: '600' },
  delBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: '#FEF2F2', borderRadius: 6,
  },
  delBtnText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  deleteConfirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteConfirmText: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  deleteYesBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#EF4444', borderRadius: 6 },
  deleteYesText: { fontSize: 12, color: '#FFF', fontWeight: '700' },
  deleteNoBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#E5E7EB', borderRadius: 6 },
  deleteNoText: { fontSize: 12, color: '#374151', fontWeight: '600' },

  // List footer
  listFooter: { padding: 12, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  listFooterText: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginBottom: 18 },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: TEAL, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8 },
  emptyAddBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center' },
  modalTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  modalSubtitle: { fontSize: 12, color: '#6B7280' },
  modalCloseBtn: { padding: 6 },
  modalBody: { paddingHorizontal: 20, paddingVertical: 16 },
  stepLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  pickerWrap: { flexDirection: 'row', alignItems: 'center' },
  pickerIcon: { marginRight: 6 },
  chipScroll: { flexDirection: 'row' },
  noProductsWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 },
  noProductsText: { fontSize: 13, color: '#F59E0B' },
  productList: { gap: 6 },
  productOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB',
  },
  productOptionActive: { borderColor: TEAL, backgroundColor: '#F0FDFA' },
  productOptionText: { fontSize: 14, color: '#374151', flex: 1 },
  productOptionTextActive: { color: TEAL, fontWeight: '600' },
  nameInput: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
    backgroundColor: '#FFF',
  },
  nameInputDisabled: { backgroundColor: '#F9FAFB', color: '#9CA3AF' },
  addingToText: { fontSize: 12, color: '#6B7280', marginTop: 6 },
  addingToProduct: { fontWeight: '600', color: TEAL },
  modalFooter: {
    flexDirection: 'row', gap: 8, padding: 16,
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  btnCancel: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#FFF',
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  btnAddAnother: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8,
    borderWidth: 1, borderColor: '#99F6E4', backgroundColor: '#F0FDFA',
  },
  btnAddAnotherText: { fontSize: 13, color: TEAL, fontWeight: '600' },
  btnAddClose: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 8, backgroundColor: TEAL,
  },
  btnAddCloseText: { fontSize: 13, color: '#FFF', fontWeight: '700' },
  btnDisabled: { opacity: 0.4 },
});
