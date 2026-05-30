import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  Dimensions,
  Animated
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChronosLauncher from '../modules/chronos-launcher';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ onSwipeRight, onSwipeLeft }) {
  const [time, setTime] = useState(new Date());
  const [apps, setApps] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [search, setSearch] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const searchInputRef = useRef(null);

  // Gesture Tracker for swiping
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    // Start clock interval
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Load installed apps natively
    loadApps();

    return () => clearInterval(timer);
  }, []);

  const loadApps = async () => {
    try {
      const list = await ChronosLauncher.getInstalledApps();
      setApps(list);
      setFilteredApps(list);
    } catch (e) {
      console.log('Failed to load apps:', e);
    }
  };

  const handleSearch = (text) => {
    setSearch(text);
    if (text.trim() === '') {
      setFilteredApps(apps);
    } else {
      const filtered = apps.filter((app) =>
        app.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredApps(filtered);
    }
  };

  const launchApp = async (packageName) => {
    try {
      const success = await ChronosLauncher.launchApp(packageName);
      if (success) {
        closeDrawer();
      }
    } catch (e) {
      console.log('Failed to launch:', e);
    }
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 150);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setSearch('');
    setFilteredApps(apps);
  };

  // Swiping Router logic
  const onTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
    touchStartY.current = e.nativeEvent.pageY;
  };

  const onTouchEnd = (e) => {
    const diffX = e.nativeEvent.pageX - touchStartX.current;
    const diffY = e.nativeEvent.pageY - touchStartY.current;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      // Horizontal swipe
      if (diffX < -60) {
        onSwipeLeft();
      } else if (diffX > 60) {
        onSwipeRight();
      }
    } else {
      // Vertical swipe
      if (diffY < -60) {
        openDrawer();
      } else if (diffY > 60 && isDrawerOpen) {
        closeDrawer();
      }
    }
  };

  // Calculate clock hand rotations
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourRotation = ((hours % 12) * 30 + minutes * 0.5).toString() + 'deg';
  const minuteRotation = (minutes * 6).toString() + 'deg';
  const secondRotation = (seconds * 6).toString() + 'deg';

  const formatFuzzyTime = () => {
    const hr = hours % 12 === 0 ? 12 : hours % 12;
    const min = minutes < 10 ? `0${minutes}` : minutes;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec'
    ];

    const dayName = days[time.getDay() === 0 ? 6 : time.getDay() - 1];
    const monthName = months[time.getMonth()];
    const date = time.getDate();

    return `${hr}:${min} ${ampm}\n${dayName}, ${monthName} ${date}`;
  };

  return (
    <View
      style={styles.container}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Top Header info */}
        <View style={styles.header}>
          <Text style={styles.developerText}>CHRONOS BY VARSHAN</Text>
          <View style={styles.focusBadge}>
            <View style={styles.focusDot} />
            <Text style={styles.focusText}>FOCUS ACTIVE</Text>
          </View>
        </View>

        {/* Central Neumorphic Analog Clock */}
        <View style={styles.clockContainer}>
          <View style={styles.outerDial}>
            {/* Hour ticks */}
            {[...Array(12).keys()].map((i) => {
              const rotation = `${i * 30}deg`;
              return (
                <View
                  key={i}
                  style={[styles.tickMark, { transform: [{ rotate: rotation }] }]}
                />
              );
            })}

            {/* Hour Hand */}
            <View
              style={[
                styles.hand,
                styles.hourHand,
                { transform: [{ rotate: hourRotation }] }
              ]}
            />

            {/* Minute Hand */}
            <View
              style={[
                styles.hand,
                styles.minuteHand,
                { transform: [{ rotate: minuteRotation }] }
              ]}
            />

            {/* Second Hand */}
            <View
              style={[
                styles.hand,
                styles.secondHand,
                { transform: [{ rotate: secondRotation }] }
              ]}
            />

            {/* Center Cap */}
            <View style={styles.centerCapOuter} />
            <View style={styles.centerCapInner} />
          </View>

          {/* Fuzzy Text Time */}
          <Text style={styles.fuzzyTime}>{formatFuzzyTime()}</Text>
        </View>

        {/* Bottom Shortcuts and Swipe Prompts */}
        <View style={styles.bottomArea}>
          <View style={styles.shortcutsRow}>
            <TouchableOpacity style={styles.shortcutBtn}>
              <MaterialCommunityIcons
                name="phone-outline"
                size={22}
                color="#8E8E93"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutBtn}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={22}
                color="#8E8E93"
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shortcutBtn}>
              <MaterialCommunityIcons
                name="camera-outline"
                size={22}
                color="#8E8E93"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.promptsRow}>
            <MaterialCommunityIcons name="chevron-left" size={16} color="#333" />
            <Text style={styles.promptText}>
              SWIPE LEFT FOR LOFI • SWIPE UP FOR APPS • SWIPE RIGHT FOR ROUTINE
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color="#333" />
          </View>
        </View>
      </SafeAreaView>

      {/* Fuzzy search app drawer modal */}
      <Modal
        visible={isDrawerOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDrawer}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeDrawer}
        >
          <View
            style={styles.drawerContainer}
            onStartShouldSetResponder={() => true}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <View style={styles.grabHandle} />

            {/* Search Input Bar */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#444"
                style={{ marginRight: 10 }}
              />
              <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Search apps..."
                placeholderTextColor="#444"
                value={search}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
                selectionColor="#555"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <MaterialCommunityIcons name="close" size={18} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            {/* Apps list */}
            <FlatList
              data={filteredApps}
              keyExtractor={(item) => item.packageName}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.appRow}
                  onPress={() => launchApp(item.packageName)}
                >
                  <View style={styles.appIconPlaceholder}>
                    <Text style={styles.appLetter}>
                      {item.name.substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{item.name}</Text>
                    <Text style={styles.appPkg} numberOfLines={1}>
                      {item.packageName}
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={14}
                    color="#2C2C2E"
                  />
                </TouchableOpacity>
              )}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No apps found</Text>
                </View>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  developerText: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.25)',
  },
  focusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  focusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00FF66',
    marginRight: 6,
  },
  focusText: {
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.3)',
  },
  clockContainer: {
    alignItems: 'center',
    marginVertical: 40,
  },
  outerDial: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    position: 'relative',
  },
  tickMark: {
    position: 'absolute',
    width: 2,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: 10,
    transformOrigin: '50% 110px', // Center pivot
  },
  hand: {
    position: 'absolute',
    bottom: '50%',
    left: '50%',
    borderRadius: 4,
  },
  hourHand: {
    width: 4,
    height: 60,
    backgroundColor: '#D1D1D6',
    marginLeft: -2,
    transformOrigin: '50% 100%',
  },
  minuteHand: {
    width: 2.5,
    height: 80,
    backgroundColor: '#8E8E93',
    marginLeft: -1.25,
    transformOrigin: '50% 100%',
  },
  secondHand: {
    width: 1.2,
    height: 90,
    backgroundColor: '#FF453A', // Carbon red second hand
    marginLeft: -0.6,
    transformOrigin: '50% 100%',
  },
  centerCapOuter: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#0F0F11',
  },
  centerCapInner: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FF453A',
  },
  fuzzyTime: {
    marginTop: 36,
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '300',
    textAlign: 'center',
    letterSpacing: 1,
    lineHeight: 26,
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  shortcutsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  shortcutBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#141416',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  promptsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  promptText: {
    fontSize: 8,
    letterSpacing: 1,
    color: 'rgba(255,255,255,0.15)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  drawerContainer: {
    height: height * 0.75,
    backgroundColor: '#141416',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  grabHandle: {
    width: 48,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1B1B1E',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.01)',
  },
  appIconPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.01)',
  },
  appLetter: {
    color: 'rgba(255,255,255,0.5)',
    fontWeight: 'bold',
    fontSize: 18,
  },
  appInfo: {
    flex: 1,
    marginLeft: 16,
  },
  appName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
  },
  appPkg: {
    color: 'rgba(255,255,255,0.22)',
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 14,
  },
});
