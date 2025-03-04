import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, Share } from "react-native";
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, collection, query, orderBy, limit, onSnapshot, Timestamp, where, startAfter } from '@react-native-firebase/firestore';
import { getAuth } from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from "../navigationTypes";
import LinearGradient from "react-native-linear-gradient";
import DateTimePicker from '@react-native-community/datetimepicker';

interface EVData {
  id: string;
  speed: number;
  voltage: number;
  current: number;
  errorCode: number;
  errorMessages: string[];
  throttle: number;
  controllerTemp: number;
  motorTemp: number;
  controllerStatus: number;
  switchSignals: {
    boost: boolean;
    footswitch: boolean;
    forward: boolean;
    backward: boolean;
    brake: boolean;
    hallC: boolean;
    hallB: boolean;
    hallA: boolean;
  };
  timestamp: any; // Firestore timestamp
}

const HistoryScreen = () => {
  const [evData, setEvData] = useState<EVData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastVisible, setLastVisible] = useState<any>(null); // Track the last document for pagination
  const [hasMore, setHasMore] = useState<boolean>(true); // Track if there’s more data to load
  const [startDate, setStartDate] = useState<Date | null>(null); // Start date for filtering
  const [endDate, setEndDate] = useState<Date | null>(null); // End date for filtering
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false); // Control start date picker visibility
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false); // Control end date picker visibility
  const [filterOption, setFilterOption] = useState<string>("All Time"); // Predefined filter option

  // Initialize Firebase modular instances
  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, "History">>();

  // Apply predefined filter to set date range
  const applyPredefinedFilter = (option: string) => {
    setFilterOption(option);
    setStartDate(null);
    setEndDate(null);
    setEvData([]); // Reset data to apply new filter

    const now = new Date();
    switch (option) {
      case "Last 7 Days":
        setStartDate(new Date(now.setDate(now.getDate() - 7)));
        break;
      case "Last 30 Days":
        setStartDate(new Date(now.setDate(now.getDate() - 30)));
        break;
      case "All Time":
        setStartDate(null);
        setEndDate(null);
        break;
      default:
        setStartDate(null);
        setEndDate(null);
    }
  };

  // Fetch data with optional date filter, predefined filter, and pagination using real-time listener
  const fetchData = useCallback((startAfterDoc: any = null) => {
    if (!user) {
      setLoading(false);
      return () => {}; // Return empty unsubscribe function if no user
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const evDataCollection = collection(userDocRef, 'ev_data');

    // Build query constraints
    let constraints = [
      orderBy('timestamp', 'desc'),
      limit(20),
    ];

    if (startAfterDoc) {
      constraints.push(startAfter(startAfterDoc));
    }

    if (startDate) {
      constraints.push(where('timestamp', '>=', Timestamp.fromDate(startDate)));
    }

    if (endDate) {
      constraints.push(where('timestamp', '<=', Timestamp.fromDate(endDate)));
    }

    const q = query(evDataCollection, ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const newData: EVData[] = [];
        querySnapshot.forEach((docSnapshot) => {
          newData.push({ id: docSnapshot.id, ...docSnapshot.data() } as EVData);
        });

        setEvData(newData); // Update data with real-time changes
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null); // Update last visible document
        setHasMore(querySnapshot.docs.length === 20); // Check if we’ve hit the limit (more data exists)
        setLoading(false); // Stop loading once data is fetched
      },
      (error) => {
        console.error('Error fetching data: ', error);
        Alert.alert('Error', 'Failed to load historical data. Please check your internet connection.');
        setLoading(false); // Stop loading on error
      }
    );

    return unsubscribe; // Return unsubscribe function for cleanup
  }, [user, startDate, endDate, db]);

  useEffect(() => {
    const unsubscribe = fetchData(); // Initial data fetch with real-time listener

    // Clean up the listener when the component unmounts or filters change
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
      setEvData([]); // Reset data on unmount
    };
  }, [fetchData]); // Re-run when filters change

  // Load more data when user scrolls to the end (manually trigger fetch for next page)
  const loadMore = () => {
    if (!loading && hasMore && lastVisible) {
      fetchData(lastVisible);
    }
  };

  // Handle date picker changes
  const onStartDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      setFilterOption("Custom"); // Switch to custom filter when manually selecting dates
      setEvData([]); // Reset data to apply new filter
    }
  };

  const onEndDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
      setFilterOption("Custom"); // Switch to custom filter when manually selecting dates
      setEvData([]); // Reset data to apply new filter
    }
  };

  // Export data as CSV and share
  const exportAndShareData = async () => {
    if (evData.length === 0) {
      Alert.alert('No Data', 'There is no data to export.');
      return;
    }

    // Generate CSV content
    const headers = 'Timestamp,Speed (RPM),Voltage (V),Current (A),Controller Temp (°C),Motor Temp (°C),Throttle,Controller Status,Boost\n';
    const rows = evData.map(item => 
      `${item.timestamp?.toDate().toLocaleString()},${item.speed},${item.voltage},${item.current},${item.controllerTemp},${item.motorTemp},${item.throttle},${item.controllerStatus},${item.switchSignals.boost ? 'ON' : 'OFF'}`
    ).join('\n');
    const csvContent = headers + rows;

    try {
      const result = await Share.share({
        message: `EV Data Export:\n${csvContent}`,
        title: 'Share EV Data',
      });
      if (result.action === Share.sharedAction) {
        console.log('Data shared successfully');
      } else if (result.action === Share.dismissedAction) {
        console.log('Share cancelled');
      }
    } catch (error) {
      console.error('Error sharing data: ', error);
      Alert.alert('Error', 'Failed to share data. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: EVData }) => (
    <View style={styles.item}>
      <Text style={styles.label}>Speed: {item.speed ?? "N/A"} RPM</Text>
      <Text style={styles.label}>Voltage: {item.voltage ?? "N/A"} V</Text>
      <Text style={styles.label}>Current: {item.current ?? "N/A"} A</Text>
      <Text style={styles.label}>Timestamp: {item.timestamp?.toDate().toLocaleString()}</Text>
      <Text style={styles.label}>Controller Temp: {item.controllerTemp ?? "N/A"} °C</Text>
      <Text style={styles.label}>Motor Temp: {item.motorTemp ?? "N/A"} °C</Text>
      <Text style={styles.label}>Throttle: {item.throttle ?? "N/A"}</Text>
      <Text style={styles.label}>Controller Status: {item.controllerStatus ?? "N/A"}</Text>
      <Text style={styles.label}>Boost: {item.switchSignals?.boost ? "ON" : "OFF"}</Text>
    </View>
  );

  if (loading && evData.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <LinearGradient colors={["#2C5364", "#203A43", "#0F2027"]} style={styles.container}>
      <Text style={styles.title}>Historical EV Data</Text>

      {/* Predefined Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filterOption === "Last 7 Days" && styles.activeFilter]}
          onPress={() => applyPredefinedFilter("Last 7 Days")}
        >
          <Text style={[styles.filterButtonText, filterOption === "Last 7 Days" && styles.activeFilterText]}>Last 7 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterOption === "Last 30 Days" && styles.activeFilter]}
          onPress={() => applyPredefinedFilter("Last 30 Days")}
        >
          <Text style={[styles.filterButtonText, filterOption === "Last 30 Days" && styles.activeFilterText]}>Last 30 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterOption === "All Time" && styles.activeFilter]}
          onPress={() => applyPredefinedFilter("All Time")}
        >
          <Text style={[styles.filterButtonText, filterOption === "All Time" && styles.activeFilterText]}>All Time</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Date Filter Inputs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
          <Text style={styles.dateButtonText}>
            Start Date: {startDate ? startDate.toLocaleDateString() : "Select Start"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
          <Text style={styles.dateButtonText}>
            End Date: {endDate ? endDate.toLocaleDateString() : "Select End"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Export/Share Button */}
      <TouchableOpacity style={[styles.button, styles.exportButton]} onPress={exportAndShareData}>
        <Text style={styles.buttonText}>Export/Share Data</Text>
      </TouchableOpacity>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
          minimumDate={startDate || undefined} // Ensure end date is not before start date
        />
      )}

      {evData.length > 0 ? (
        <FlatList
          data={evData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          style={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5} // Load more when 50% of the list is visible
          ListFooterComponent={
            loading && evData.length > 0 ? (
              <ActivityIndicator size="small" color="#4CAF50" style={{ padding: 16 }} />
            ) : null
          }
        />
      ) : (
        <Text style={styles.noData}>No data available for the selected period.</Text>
      )}

      {/* Footer Navigation */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Home")}>
          <Text style={styles.footerText}>🏠 Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("Dashboard")}>
          <Text style={styles.footerText}>📊 Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerButton} onPress={() => navigation.navigate("History")}>
          <Text style={styles.footerText}>📜 History</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingBottom: 60,
    paddingTop: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Match gradient background
  },
  title: {
    fontSize: 30,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap', // Allow wrapping if buttons don’t fit on one line
    width: '100%',
    paddingHorizontal: 16,
  },
  filterButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    marginBottom: 8,
    width: '30%', // Adjust width to fit three buttons horizontally
    elevation: 5, // Enhanced shadow for Android
  },
  activeFilter: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    fontSize: 14,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "bold",
  },
  activeFilterText: {
    color: "#fff", // Ensure text is visible on active (green) background
  },
  dateButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4CAF50",
    width: '48%',
    elevation: 5, // Enhanced shadow for Android
  },
  dateButtonText: {
    fontSize: 16,
    color: "#4CAF50",
    textAlign: "center",
    fontWeight: "bold",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: "#4CAF50", // Match other buttons in HomeScreen
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  list: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  item: {
    backgroundColor: "#fff",
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    elevation: 5, // Enhanced shadow for Android
    width: '90%',
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginVertical: 2,
  },
  noData: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 10,
    backgroundColor: "#1E1E1E",
  },
  footerButton: {
    padding: 10,
  },
  footerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default HistoryScreen;