import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  loading = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1 && !loading) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages && !loading) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageSelect = (page: number) => {
    if (page !== currentPage && !loading) {
      onPageChange(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <View style={styles.container}>
      {/* Info Text */}
      <Text style={styles.infoText}>
        Showing {startItem}-{endItem} of {totalItems}
      </Text>

      {/* Pagination Controls */}
      <View style={styles.controls}>
        {/* Previous Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            (currentPage === 1 || loading) && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentPage === 1 || loading}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={currentPage === 1 || loading ? "#D1D5DB" : "#6B7280"}
          />
        </TouchableOpacity>

        {/* Page Numbers */}
        <View style={styles.pageNumbers}>
          {getPageNumbers().map((page, index) => {
            if (page === "...") {
              return (
                <View key={`ellipsis-${index}`} style={styles.ellipsis}>
                  <Text style={styles.ellipsisText}>...</Text>
                </View>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <TouchableOpacity
                key={pageNum}
                style={[
                  styles.pageButton,
                  isActive && styles.pageButtonActive,
                  loading && styles.pageButtonDisabled,
                ]}
                onPress={() => handlePageSelect(pageNum)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.pageButtonText,
                    isActive && styles.pageButtonTextActive,
                  ]}
                >
                  {pageNum}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next Button */}
        <TouchableOpacity
          style={[
            styles.navButton,
            (currentPage === totalPages || loading) && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentPage === totalPages || loading}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              currentPage === totalPages || loading ? "#D1D5DB" : "#6B7280"
            }
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  infoText: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "500",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  pageNumbers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pageButton: {
    minWidth: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  pageButtonActive: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  pageButtonDisabled: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  pageButtonTextActive: {
    color: "#FFF",
  },
  ellipsis: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  ellipsisText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "600",
  },
});
