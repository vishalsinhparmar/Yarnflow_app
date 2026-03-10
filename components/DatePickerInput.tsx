import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

interface DatePickerInputProps {
  label: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function DatePickerInput({
  label,
  value,
  onChange,
  error,
  required = false,
  minimumDate,
  maximumDate,
  placeholder = "Select date",
}: DatePickerInputProps) {
  const [showPicker, setShowPicker] = useState(false);

  // Parse initial date or use current date
  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const initialDate = parseDate(value);
  const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
  const [selectedDay, setSelectedDay] = useState(initialDate.getDate());

  // Update selections when value changes externally
  useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
    }
  }, [value]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate year options (10 years back, 5 years forward)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 16 }, (_, i) => currentYear - 10 + i);

  // Generate day options based on selected month/year
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Validate date against min/max
  const isDateValid = (year: number, month: number, day: number) => {
    const date = new Date(year, month, day);
    if (minimumDate && date < minimumDate) return false;
    if (maximumDate && date > maximumDate) return false;
    return true;
  };

  const handleConfirm = () => {
    // Ensure day is valid for the selected month
    const maxDay = getDaysInMonth(selectedYear, selectedMonth);
    const finalDay = Math.min(selectedDay, maxDay);

    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(finalDay).padStart(2, "0")}`;
    onChange(dateStr);
    setShowPicker(false);
  };

  const handleCancel = () => {
    // Reset to current value
    const d = parseDate(value);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setShowPicker(false);
  };

  const handleOpenPicker = () => {
    // Reset selections to current value when opening
    const d = parseDate(value);
    setSelectedYear(d.getFullYear());
    setSelectedMonth(d.getMonth());
    setSelectedDay(d.getDate());
    setShowPicker(true);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>

      <TouchableOpacity
        style={[styles.inputButton, error && styles.inputError]}
        onPress={handleOpenPicker}
      >
        <View style={styles.inputContent}>
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <Text style={[styles.inputText, !value && styles.placeholderText]}>
            {value ? formatDate(value) : placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#6B7280" />
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <Modal
        visible={showPicker}
        transparent
        animationType="slide"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={handleCancel}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={handleCancel}
                style={styles.headerButton}
              >
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity
                onPress={handleConfirm}
                style={styles.headerButton}
              >
                <Text style={styles.confirmButton}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Selected Date Preview */}
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>
                {selectedDay} {MONTHS[selectedMonth]} {selectedYear}
              </Text>
            </View>

            {/* Date Picker Columns */}
            <View style={styles.pickerContainer}>
              {/* Day Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnHeader}>Day</Text>
                <ScrollView
                  style={styles.scrollColumn}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.pickerItem,
                        selectedDay === day && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedDay(day)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedDay === day && styles.pickerItemTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Month Column */}
              <View style={[styles.pickerColumn, styles.monthColumn]}>
                <Text style={styles.columnHeader}>Month</Text>
                <ScrollView
                  style={styles.scrollColumn}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {MONTHS.map((month, index) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.pickerItem,
                        selectedMonth === index && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedMonth(index)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedMonth === index &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Year Column */}
              <View style={styles.pickerColumn}>
                <Text style={styles.columnHeader}>Year</Text>
                <ScrollView
                  style={styles.scrollColumn}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.scrollContent}
                >
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.pickerItem,
                        selectedYear === year && styles.pickerItemSelected,
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text
                        style={[
                          styles.pickerItemText,
                          selectedYear === year &&
                            styles.pickerItemTextSelected,
                        ]}
                      >
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    minHeight: 50,
  },
  inputContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  inputText: {
    fontSize: 14,
    color: "#111827",
  },
  placeholderText: {
    color: "#9CA3AF",
  },
  inputError: {
    borderColor: "#EF4444",
  },
  errorText: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  cancelButton: {
    fontSize: 16,
    color: "#6B7280",
  },
  confirmButton: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "600",
  },
  previewContainer: {
    paddingVertical: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  previewText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  pickerContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 8,
    height: 250,
  },
  pickerColumn: {
    flex: 1,
  },
  monthColumn: {
    flex: 1.5,
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  scrollColumn: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    marginVertical: 2,
    borderRadius: 8,
    alignItems: "center",
  },
  pickerItemSelected: {
    backgroundColor: "#10B981",
  },
  pickerItemText: {
    fontSize: 15,
    color: "#374151",
  },
  pickerItemTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
});
