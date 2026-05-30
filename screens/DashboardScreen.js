import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Dimensions,
  SafeAreaView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';

const { width } = Dimensions.get('window');

// Open/init database asynchronously
let dbInstance = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('chronos_launcher.db');
  
  // Setup tables
  await dbInstance.execAsync(`
    CREATE TABLE IF NOT EXISTS habits(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      isCompleted INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      category TEXT DEFAULT 'General'
    );
    CREATE TABLE IF NOT EXISTS focus_sessions(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      durationMinutes INTEGER NOT NULL,
      audioType TEXT NOT NULL
    );
  `);

  // Insert default items if empty
  const habitsCount = await dbInstance.getFirstAsync('SELECT COUNT(*) as count FROM habits');
  if (habitsCount.count === 0) {
    await dbInstance.runAsync("INSERT INTO habits (title, isCompleted, streak, category) VALUES (?, ?, ?, ?)", [
      'Morning Deep Work Block (90m)', 0, 4, 'Focus'
    ]);
    await dbInstance.runAsync("INSERT INTO habits (title, isCompleted, streak, category) VALUES (?, ?, ?, ?)", [
      'Hydrate & Move (10m)', 1, 12, 'Health'
    ]);
    await dbInstance.runAsync("INSERT INTO habits (title, isCompleted, streak, category) VALUES (?, ?, ?, ?)", [
      'Review Chronos Routine', 0, 2, 'Setup'
    ]);
    await dbInstance.runAsync("INSERT INTO habits (title, isCompleted, streak, category) VALUES (?, ?, ?, ?)", [
      'Digital Detox Screen Cap', 0, 8, 'Mindset'
    ]);
  }

  return dbInstance;
}

export default function DashboardScreen({ onSwipeLeft }) {
  const [habits, setHabits] = useState([]);
  const [weeklySessions, setWeeklySessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newHabitTitle, setNewHabitTitle] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Focus');

  // Swipe gesture tracking
  const touchStartX = useRef(0);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    try {
      setIsLoading(true);
      const db = await getDb();
      
      // Fetch habits
      const habitsList = await db.getAllAsync('SELECT * FROM habits ORDER BY id ASC');
      setHabits(habitsList);

      // Fetch weekly focus sessions grouped by date (limit to last 7 days)
      const sessions = await db.getAllAsync(`
        SELECT date, SUM(durationMinutes) as totalMinutes 
        FROM focus_sessions 
        GROUP BY date 
        ORDER BY date DESC 
        LIMIT 7
      `);
      // Reverse to render chronologically left-to-right
      setWeeklySessions(sessions.reverse());
    } catch (e) {
      console.log('Error refreshing database:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHabit = async (id, currentIsCompleted, currentStreak) => {
    try {
      const db = await getDb();
      const newStatus = currentIsCompleted === 1 ? 0 : 1;
      const streakDiff = currentIsCompleted === 1 ? -1 : 1;
      let newStreak = currentStreak + streakDiff;
      if (newStreak < 0) newStreak = 0;

      await db.runAsync(
        'UPDATE habits SET isCompleted = ?, streak = ? WHERE id = ?',
        [newStatus, newStreak, id]
      );
      refreshData();
    } catch (e) {
      console.log('Error toggling habit:', e);
    }
  };

  const addHabit = async () => {
    if (newHabitTitle.trim() === '') return;
    try {
      const db = await getDb();
      await db.runAsync(
        'INSERT INTO habits (title, isCompleted, streak, category) VALUES (?, ?, ?, ?)',
        [newHabitTitle, 0, 0, newHabitCategory]
      );
      setNewHabitTitle('');
      setModalVisible(false);
      refreshData();
    } catch (e) {
      console.log('Error adding habit:', e);
    }
  };

  const deleteHabit = async (id) => {
    try {
      const db = await getDb();
      await db.runAsync('DELETE FROM habits WHERE id = ?', [id]);
      refreshData();
    } catch (e) {
      console.log('Error deleting habit:', e);
    }
  };

  // Swiping controls
  const onTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const onTouchEnd = (e) => {
    const diffX = e.nativeEvent.pageX - touchStartX.current;
    if (diffX < -80) {
      onSwipeLeft();
    }
  };

  // Stats calculations
  const total = habits.length;
  const completed = habits.filter((h) => h.isCompleted === 1).length;
  const percent = total === 0 ? 0 : completed / total;

  return (
    <View style={styles.container} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Block */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtext}>DAILY ROUTINE</Text>
            <Text style={styles.title}>Carbon Deck</Text>
          </View>
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <MaterialCommunityIcons name="plus" size={26} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          <View style={styles.statsInfo}>
            <Text style={styles.statsLabel}>Routines Complete</Text>
            <Text style={styles.statsCount}>
              {completed} / {total} Completed
            </Text>
            <View style={styles.progressRail}>
              <View style={[styles.progressBar, { width: `${percent * 100}%` }]} />
            </View>
          </View>
          <View style={styles.percentageCircle}>
            <Text style={styles.percentageText}>{Math.round(percent * 100)}%</Text>
          </View>
        </View>

        {/* Checklist Title */}
        <Text style={styles.sectionHeader}>YOUR CHECKLIST</Text>

        {/* Habits Checklist */}
        <View style={styles.listContainer}>
          {isLoading ? (
            <View style={styles.center}>
              <Text style={styles.loadingText}>Syncing records...</Text>
            </View>
          ) : habits.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No routine habits configured.</Text>
              <Text style={styles.emptyTextSub}>Click the + icon to add your first one.</Text>
            </View>
          ) : (
            <FlatList
              data={habits}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isCompleted = item.isCompleted === 1;
                return (
                  <View style={[styles.habitItem, isCompleted && styles.habitItemCompleted]}>
                    <TouchableOpacity
                      style={styles.checkboxWrapper}
                      onPress={() => toggleHabit(item.id, item.isCompleted, item.streak)}
                    >
                      <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
                        {isCompleted && (
                          <MaterialCommunityIcons name="check" size={14} color="#000" />
                        )}
                      </View>
                    </TouchableOpacity>
                    <View style={styles.habitMeta}>
                      <Text style={[styles.habitTitle, isCompleted && styles.habitTitleCompleted]}>
                        {item.title}
                      </Text>
                      <Text style={styles.habitCat}>{item.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.habitActions}>
                      <MaterialCommunityIcons
                        name="fire"
                        size={16}
                        color={isCompleted ? '#FF9500' : '#444'}
                      />
                      <Text style={[styles.streakText, isCompleted && styles.streakTextCompleted]}>
                        {item.streak}
                      </Text>
                      <TouchableOpacity onPress={() => deleteHabit(item.id)}>
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={18}
                          color="#333"
                          style={{ marginLeft: 8 }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Weekly focus metrics representation */}
        <Text style={styles.sectionHeader}>FOCUS METRICS (WEEKLY)</Text>
        <View style={styles.chartContainer}>
          {weeklySessions.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>No focus sessions logged this week.</Text>
            </View>
          ) : (
            <View style={styles.barsRow}>
              {weeklySessions.map((session, index) => {
                const maxCap = 120; // 2 hours cap
                const ratio = Math.min(session.totalMinutes / maxCap, 1);
                const barHeight = Math.max(ratio * 70, 4); // Min height of 4 pixels
                const displayDate = session.date.substring(5); // MM-DD

                return (
                  <View key={index} style={styles.barColumn}>
                    <Text style={styles.barMinutes}>{session.totalMinutes}m</Text>
                    <View style={[styles.barItem, { height: barHeight }]} />
                    <Text style={styles.barLabel}>{displayDate}</Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* New habit creation Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Create New Habit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter routine description..."
              placeholderTextColor="#444"
              value={newHabitTitle}
              onChangeText={setNewHabitTitle}
              selectionColor="#555"
              autoFocus={true}
            />
            <View style={styles.catsRow}>
              {['Focus', 'Health', 'Setup', 'Mindset'].map((cat) => {
                const isSelected = newHabitCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catBtn, isSelected && styles.catBtnSelected]}
                    onPress={() => setNewHabitCategory(cat)}
                  >
                    <Text style={[styles.catBtnText, isSelected && styles.catBtnTextSelected]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.createBtn} onPress={addHabit}>
                <Text style={styles.createBtnText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    marginBottom: 24,
  },
  subtext: {
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.25)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  statsCard: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: 24,
  },
  statsInfo: {
    flex: 1,
  },
  statsLabel: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
  },
  statsCount: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 6,
  },
  progressRail: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFF',
  },
  percentageCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 20,
  },
  percentageText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listContainer: {
    flex: 3,
    marginBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyTextSub: {
    color: 'rgba(255,255,255,0.1)',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  habitItem: {
    backgroundColor: '#141416',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  habitItemCompleted: {
    borderColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
  },
  checkboxWrapper: {
    paddingRight: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  habitMeta: {
    flex: 1,
  },
  habitTitle: {
    color: '#FFF',
    fontSize: 14,
  },
  habitTitleCompleted: {
    color: 'rgba(255,255,255,0.25)',
    textDecorationLine: 'line-through',
  },
  habitCat: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.18)',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 2,
  },
  habitActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: 'rgba(255,255,255,0.25)',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  streakTextCompleted: {
    color: '#FF9500',
  },
  chartContainer: {
    flex: 1.8,
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: 20,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    height: '100%',
    paddingBottom: 10,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barMinutes: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 9,
    marginBottom: 6,
  },
  barItem: {
    width: 16,
    backgroundColor: '#FFF',
    borderRadius: 4,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 9,
    marginTop: 6,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: width * 0.85,
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#1B1B1E',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 16,
  },
  catsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  catBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1B1B1E',
    borderRadius: 8,
  },
  catBtnSelected: {
    backgroundColor: '#FFF',
  },
  catBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.4)',
  },
  catBtnTextSelected: {
    color: '#000',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cancelText: {
    color: 'rgba(255,255,255,0.3)',
    marginRight: 24,
  },
  createBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createBtnText: {
    color: '#000',
    fontWeight: 'bold',
  },
});
