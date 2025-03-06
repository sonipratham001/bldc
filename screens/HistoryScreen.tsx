import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { getApp } from '@react-native-firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  where,
  startAfter,
} from '@react-native-firebase/firestore';
import { getAuth, signOut } from '@react-native-firebase/auth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes'; // Adjust path as needed
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import SideMenu from './SideMenu'; // Import the new SideMenu component (adjust path)

interface EVData {
  id: string;
  speed: number;
  voltage: number;
  current: number;
  controllerTemp: number;
  motorTemp: number;
  throttle: number;
  errorCode: number | null;
  errorMessages: string[] | null;
  controllerStatus: string | null;
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
  timestamp: Timestamp;
}

const HistoryScreen = () => {
  const [evData, setEvData] = useState<EVData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState<boolean>(false);
  const [showEndPicker, setShowEndPicker] = useState<boolean>(false);
  const [filterOption, setFilterOption] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const app = getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);
  const user = auth.currentUser;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'History'>>();

  const applyFilter = (days: number | null) => {
    const now = new Date();
    setFilterOption(days ? `Last ${days} Day${days > 1 ? 's' : ''}` : 'All Time');
    setStartDate(days ? new Date(now.setDate(now.getDate() - days)) : null);
    setEndDate(days ? new Date() : null);
    setEvData([]);
  };

  const fetchData = useCallback(
    (startAfterDoc: any = null) => {
      if (!user || (!startDate && !endDate)) {
        setLoading(false);
        return () => {};
      }

      setLoading(true);
      const constraints = [
        orderBy('timestamp', 'desc'),
        limit(20),
        ...(startDate ? [where('timestamp', '>=', Timestamp.fromDate(startDate))] : []),
        ...(endDate ? [where('timestamp', '<=', Timestamp.fromDate(endDate))] : []),
        ...(startAfterDoc ? [startAfter(startAfterDoc)] : []),
      ];

      const q = query(collection(db, 'users', user.uid, 'ev_data'), ...constraints);

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const newData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          } as EVData));
          setEvData((prev) => (startAfterDoc ? [...prev, ...newData] : newData));
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === 20);
          setLoading(false);
        },
        (error) => {
          console.error('Error fetching data:', error);
          Alert.alert('Error', 'Failed to load data. Please try again.');
          setLoading(false);
        }
      );

      return unsubscribe;
    },
    [user, startDate, endDate, db]
  );

  useEffect(() => {
    const unsubscribe = fetchData();
    return () => unsubscribe();
  }, [fetchData]);

  const loadMore = () => {
    if (!loading && hasMore && lastVisible) {
      fetchData(lastVisible);
    }
  };

  const exportData = async () => {
    if (evData.length === 0) {
      Alert.alert('No Data', 'There is no data to export.');
      return;
    }

    const headers =
      'Timestamp,Speed (RPM),Voltage (V),Current (A),Controller Temp (°C),Motor Temp (°C),Throttle,Controller Status,Boost\n';
    const rows = evData
      .map(
        (item) =>
          `${item.timestamp?.toDate().toLocaleString()},${item.speed},${item.voltage},${
            item.current
          },${item.controllerTemp},${item.motorTemp},${item.throttle},${item.controllerStatus},${
            item.switchSignals.boost ? 'ON' : 'OFF'
          }`
      )
      .join('\n');
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

  // Removed handleLogout and handleSubscribe since they’re now in SideMenu

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const renderItem = ({ item }: { item: EVData }) => (
    <View style={styles.card}>
      <Text style={styles.cardTime}>{item.timestamp.toDate().toLocaleString()}</Text>
      <View style={styles.cardRow}>
        <MetricItem label="Speed" value={`${item.speed} RPM`} />
        <MetricItem label="Voltage" value={`${item.voltage} V`} />
      </View>
      <View style={styles.cardRow}>
        <MetricItem label="Current" value={`${item.current} A`} />
        <MetricItem label="Controller Temp" value={`${item.controllerTemp}°C`} />
      </View>
      <View style={styles.cardRow}>
        <MetricItem label="Motor Temp" value={`${item.motorTemp}°C`} />
        <MetricItem label="Throttle" value={`${((item.throttle / 255) * 5).toFixed(2)} V`} />
      </View>
      {item.errorCode && (
        <View style={styles.cardRow}>
          <Text style={styles.metricValue}>Error Code: {item.errorCode}</Text>
          {item.errorMessages &&
            item.errorMessages.map((msg, index) => (
              <Text key={index} style={styles.metricValue}>
                Error: {msg}
              </Text>
            ))}
        </View>
      )}
      {item.controllerStatus && (
        <View style={styles.cardRow}>
          <Text style={styles.metricValue}>Controller Status: {item.controllerStatus}</Text>
        </View>
      )}
      <View style={styles.boostIndicator}>
        <Text style={[styles.boostText, item.switchSignals.boost && styles.boostActive]}>
          Boost: {item.switchSignals.boost ? 'ON' : 'OFF'}
        </Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>
          Footswitch: {item.switchSignals.footswitch ? 'ON' : 'OFF'}
        </Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>
          Forward: {item.switchSignals.forward ? 'ON' : 'OFF'}
        </Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>
          Backward: {item.switchSignals.backward ? 'ON' : 'OFF'}
        </Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>Brake: {item.switchSignals.brake ? 'ON' : 'OFF'}</Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>Hall C: {item.switchSignals.hallC ? 'ON' : 'OFF'}</Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>Hall B: {item.switchSignals.hallB ? 'ON' : 'OFF'}</Text>
      </View>
      <View style={styles.boostIndicator}>
        <Text style={styles.boostText}>Hall A: {item.switchSignals.hallA ? 'ON' : 'OFF'}</Text>
      </View>
    </View>
  );

  const MetricItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.metricContainer}>
      <View style={styles.metricTexts}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#2C5364', '#203A43', '#0F2027']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu} activeOpacity={0.7}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>📜 Historical Data</Text>
      </View>

      <FlatList
        data={evData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <>
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={[styles.filterButton, filterOption === 'Last 1 Day' && styles.activeFilter]}
                onPress={() => applyFilter(1)}
              >
                <Text style={styles.filterButtonText}>24 Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterOption === 'Last 7 Days' && styles.activeFilter]}
                onPress={() => applyFilter(7)}
              >
                <Text style={styles.filterButtonText}>7 Days</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterButton, filterOption === 'All Time' && styles.activeFilter]}
                onPress={() => applyFilter(null)}
              >
                <Text style={styles.filterButtonText}>All Time</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.dateContainer}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Text style={{ fontSize: 18, color: '#fff' }}>📅</Text>
                <Text style={styles.dateButtonText}>
                  {startDate ? startDate.toLocaleDateString() : 'Start Date'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
                <Text style={{ fontSize: 18, color: '#fff' }}>📅</Text>
                <Text style={styles.dateButtonText}>
                  {endDate ? endDate.toLocaleDateString() : 'End Date'}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.exportButton} onPress={exportData}>
              <Text style={{ fontSize: 20, color: '#fff', marginRight: 8 }}>⬇️</Text>
              <Text style={styles.exportButtonText}>Export Data</Text>
            </TouchableOpacity>
          </>
        }
        ListFooterComponent={loading ? <ActivityIndicator color="#4CAF50" /> : null}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 50, color: '#4CAF50', textAlign: 'center' }}>⏳</Text>
            <Text style={styles.emptyText}>No data found for selected period</Text>
            <Text style={styles.emptySubText}>Adjust filters or check your connection</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {showStartPicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="spinner"
          onChange={(_, date) => {
            setShowStartPicker(false);
            date && setStartDate(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="spinner"
          minimumDate={startDate || undefined}
          onChange={(_, date) => {
            setShowEndPicker(false);
            date && setEndDate(date);
          }}
        />
      )}

      {/* Replace inline menu with SideMenu component */}
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </LinearGradient>
  );
};

// Styles remain unchanged (removed sideMenu-related styles since they’re in SideMenu.tsx)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 10,
    paddingLeft: 0,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    textAlign: 'center',
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
    marginRight: 18,
    marginLeft: 58,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
  },
  dateButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
  },
  cardTime: {
    color: '#888',
    fontSize: 12,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  metricContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricTexts: {
    flex: 1,
  },
  metricLabel: {
    color: '#888',
    fontSize: 12,
  },
  metricValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  boostIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2c3e50',
  },
  boostText: {
    color: '#666',
    fontWeight: '500',
  },
  boostActive: {
    color: '#4CAF50',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
  emptySubText: {
    color: '#888',
    fontSize: 14,
  },
  exportButton: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    marginVertical: 20,
  },
  exportButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuButton: {
    padding: 0,
    marginLeft: -7,
    marginBottom: 18,
  },
  menuIcon: {
    fontSize: 30,
    color: '#fff',
    paddingLeft: 0,
    marginLeft: 0,
  },
});

export default HistoryScreen;