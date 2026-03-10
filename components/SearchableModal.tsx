import { BORDER_RADIUS, COLORS, SPACING } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface SearchableModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: any[];
  selectedValue: string;
  onSelect: (value: string, item: any) => void;
  getLabel: (item: any) => string;
  getValue: (item: any) => string;
  getSubtitle?: (item: any) => string | undefined;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
}

export default function SearchableModal({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
  getLabel,
  getValue,
  getSubtitle,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No options found',
  loading = false,
  onSearch,
}: SearchableModalProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Reset search when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setSearchTerm('');
    }
  }, [visible]);

  // Debounced server-side search
  useEffect(() => {
    if (!visible || !onSearch) return;
    const timer = setTimeout(() => {
      onSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, visible]);

  // Client-side filter (used when no onSearch provided, or as additional filter)
  const filteredOptions = useMemo(() => {
    if (!searchTerm || onSearch) return options;
    const term = searchTerm.toLowerCase();
    return options.filter((item) => {
      const label = getLabel(item);
      const subtitle = getSubtitle?.(item);
      return (
        (label && label.toLowerCase().includes(term)) ||
        (subtitle && subtitle.toLowerCase().includes(term))
      );
    });
  }, [options, searchTerm, onSearch, getLabel, getSubtitle]);

  const renderItem = useCallback(
    ({ item }: { item: any }) => {
      const value = getValue(item);
      const label = getLabel(item);
      const subtitle = getSubtitle?.(item);
      const isSelected = value === selectedValue;

      return (
        <TouchableOpacity
          style={[styles.optionItem, isSelected && styles.selectedOption]}
          onPress={() => {
            onSelect(value, item);
            onClose();
          }}
          activeOpacity={0.6}
        >
          <View style={styles.optionContent}>
            <Text
              style={[styles.optionLabel, isSelected && styles.selectedLabel]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text style={styles.optionSubtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [selectedValue, getValue, getLabel, getSubtitle, onSelect, onClose],
  );

  const renderEmpty = () => {
    if (loading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search-outline" size={40} color={COLORS.gray300} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.gray600} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons
                name="search"
                size={18}
                color={COLORS.gray400}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.gray400}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchTerm('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Loading */}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          )}

          {/* Options List */}
          <FlatList
            data={filteredOptions}
            renderItem={renderItem}
            keyExtractor={(item) => getValue(item)}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={
              filteredOptions.length === 0 ? styles.emptyListContent : undefined
            }
          />

          {/* Results Count */}
          {filteredOptions.length > 0 && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {filteredOptions.length}{' '}
                {filteredOptions.length === 1 ? 'result' : 'results'}
                {searchTerm ? ` for "${searchTerm}"` : ''}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '80%',
    minHeight: '40%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.gray900,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  searchContainer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.sm,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.gray900,
  },
  clearButton: {
    padding: SPACING.xs,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.gray500,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  selectedOption: {
    backgroundColor: COLORS.primaryLight,
  },
  optionContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  optionLabel: {
    fontSize: 15,
    color: COLORS.gray900,
    fontWeight: '500',
  },
  selectedLabel: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  optionSubtitle: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray400,
    marginTop: SPACING.sm,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray200,
    backgroundColor: COLORS.gray50,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});
