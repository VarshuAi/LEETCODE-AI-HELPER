import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';

class DbHelper {
  static final DbHelper _instance = DbHelper._internal();
  factory DbHelper() => _instance;
  DbHelper._internal();

  static Database? _database;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, 'chronos_launcher.db');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // Table for daily habits / routines
    await db.execute('''
      CREATE TABLE habits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        isCompleted INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0,
        category TEXT DEFAULT 'General'
      )
    ''');

    // Table for logging lofi focus sessions
    await db.execute('''
      CREATE TABLE focus_sessions(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        durationMinutes INTEGER NOT NULL,
        audioType TEXT NOT NULL
      )
    ''');

    // Insert default habits to wow the user on first launch
    await db.insert('habits', {'title': 'Morning Deep Work Block (90m)', 'isCompleted': 0, 'streak': 4, 'category': 'Focus'});
    await db.insert('habits', {'title': 'Hydrate & Move (10m)', 'isCompleted': 1, 'streak': 12, 'category': 'Health'});
    await db.insert('habits', {'title': 'Review Chronos Routine', 'isCompleted': 0, 'streak': 2, 'category': 'Setup'});
    await db.insert('habits', {'title': 'Digital Detox Screen Cap', 'isCompleted': 0, 'streak': 8, 'category': 'Mindset'});
  }

  // --- HABIT OPERATIONS ---
  Future<List<Map<String, dynamic>>> getHabits() async {
    final db = await database;
    return await db.query('habits', orderBy: 'id ASC');
  }

  Future<int> insertHabit(String title, String category) async {
    final db = await database;
    return await db.insert('habits', {
      'title': title,
      'isCompleted': 0,
      'streak': 0,
      'category': category,
    });
  }

  Future<int> toggleHabit(int id, bool currentStatus) async {
    final db = await database;
    final newStatus = currentStatus ? 0 : 1;
    final newStreakDiff = currentStatus ? -1 : 1;

    // Get current habit to update its streak securely
    List<Map<String, dynamic>> results = await db.query('habits', where: 'id = ?', whereArgs: [id]);
    int currentStreak = 0;
    if (results.isNotEmpty) {
      currentStreak = results.first['streak'] as int;
    }
    int newStreak = currentStreak + newStreakDiff;
    if (newStreak < 0) newStreak = 0;

    return await db.update(
      'habits',
      {
        'isCompleted': newStatus,
        'streak': newStreak,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteHabit(int id) async {
    final db = await database;
    return await db.delete('habits', where: 'id = ?', whereArgs: [id]);
  }

  Future<int> resetAllHabits() async {
    final db = await database;
    return await db.update('habits', {'isCompleted': 0});
  }

  // --- FOCUS SESSION OPERATIONS ---
  Future<List<Map<String, dynamic>>> getFocusSessions() async {
    final db = await database;
    return await db.query('focus_sessions', orderBy: 'date DESC');
  }

  Future<int> insertFocusSession(int minutes, String audioType) async {
    final db = await database;
    final today = DateTime.now().toIso8601String().substring(0, 10);
    return await db.insert('focus_sessions', {
      'date': today,
      'durationMinutes': minutes,
      'audioType': audioType,
    });
  }

  Future<List<Map<String, dynamic>>> getWeeklyFocusTime() async {
    final db = await database;
    return await db.rawQuery('''
      SELECT date, SUM(durationMinutes) as totalMinutes 
      from focus_sessions 
      GROUP BY date 
      ORDER BY date DESC 
      LIMIT 7
    ''');
  }
}
