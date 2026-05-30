import 'package:flutter/material.dart';
import '../database/db_helper.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback onSwipeLeft;

  const DashboardScreen({Key? key, required this.onSwipeLeft}) : super(key: key);

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final DbHelper _db = DbHelper();
  List<Map<String, dynamic>> _habits = [];
  List<Map<String, dynamic>> _weeklyMinutes = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _refreshData();
  }

  Future<void> _refreshData() async {
    setState(() => _isLoading = true);
    final habits = await _db.getHabits();
    final weekly = await _db.getWeeklyFocusTime();
    setState(() {
      _habits = habits;
      _weeklyMinutes = weekly;
      _isLoading = false;
    });
  }

  void _addNewHabit() {
    final textController = TextEditingController();
    String selectedCategory = 'Focus';

    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: const Color(0xFF141416),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: Border.all(color: Colors.white.withOpacity(0.05)),
              ),
              title: const Text(
                "Create New Habit",
                style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: textController,
                    style: const TextStyle(color: Colors.white),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: const Color(0xFF1B1B1E),
                      hintText: "Enter routine description...",
                      hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                        borderSide: BorderSide.none,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: ['Focus', 'Health', 'Setup', 'Mindset'].map((cat) {
                      final isSelected = selectedCategory == cat;
                      return GestureDetector(
                        onTap: () {
                          setDialogState(() {
                            selectedCategory = cat;
                          });
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white : const Color(0xFF1B1B1E),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            cat,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isSelected ? Colors.black : Colors.white60,
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text("Cancel", style: TextStyle(color: Colors.white30)),
                ),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  onPressed: () async {
                    if (textController.text.isNotEmpty) {
                      await _db.insertHabit(textController.text, selectedCategory);
                      Navigator.pop(context);
                      _refreshData();
                    }
                  },
                  child: const Text("Create"),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _toggleHabit(int id, bool currentStatus) async {
    await _db.toggleHabit(id, currentStatus);
    _refreshData();
  }

  Future<void> _deleteHabit(int id) async {
    await _db.deleteHabit(id);
    _refreshData();
  }

  @override
  Widget build(BuildContext context) {
    // Calculate total completion percentage
    final total = _habits.length;
    final completed = _habits.where((h) => h['isCompleted'] == 1).length;
    final double completionPercent = total == 0 ? 0 : completed / total;

    return Scaffold(
      backgroundColor: const Color(0xFF0F0F11),
      body: GestureDetector(
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity == null) return;
          if (details.primaryVelocity! < -300) {
            // Swipe Left -> Go back to Home
            widget.onSwipeLeft();
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header Block
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "DAILY ROUTINE",
                          style: TextStyle(
                            fontSize: 10,
                            letterSpacing: 2,
                            fontWeight: FontWeight.bold,
                            color: Colors.white.withOpacity(0.3),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          "Carbon Deck",
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.add, color: Colors.white54, size: 28),
                      onPressed: _addNewHabit,
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Routine stats board card
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: const Color(0xFF141416),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.04)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.2),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Routines Complete",
                              style: TextStyle(color: Colors.white30, fontSize: 13),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              "$completed / $total Completed",
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            // Micro progress bar
                            ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: completionPercent,
                                backgroundColor: Colors.white.withOpacity(0.05),
                                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                minHeight: 6,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 24),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withOpacity(0.1),
                            width: 3,
                          ),
                        ),
                        child: Center(
                          child: Text(
                            "${(completionPercent * 100).toInt()}%",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Habit List Title
                const Text(
                  "YOUR CHECKLIST",
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 2,
                    color: Colors.white30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),

                // Habits checklist list
                Expanded(
                  flex: 3,
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: Colors.white24))
                      : _habits.isEmpty
                          ? Center(
                              child: Text(
                                "No routine habits configured.\nClick the + icon to add your first one.",
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Colors.white20, fontSize: 13, height: 1.5),
                              ),
                            )
                          : ListView.builder(
                              physics: const BouncingScrollPhysics(),
                              itemCount: _habits.length,
                              itemBuilder: (context, index) {
                                final habit = _habits[index];
                                final bool isCompleted = habit['isCompleted'] == 1;
                                final int id = habit['id'];
                                final String category = habit['category'] ?? 'General';

                                return Container(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF141416),
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isCompleted
                                          ? Colors.white.withOpacity(0.05)
                                          : Colors.transparent,
                                    ),
                                  ),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                                    leading: InkWell(
                                      onTap: () => _toggleHabit(id, isCompleted),
                                      child: Container(
                                        width: 24,
                                        height: 24,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          border: Border.all(
                                            color: isCompleted ? Colors.white : Colors.white24,
                                            width: 2,
                                          ),
                                          color: isCompleted ? Colors.white : Colors.transparent,
                                        ),
                                        child: isCompleted
                                            ? const Icon(Icons.check, size: 14, color: Colors.black)
                                            : null,
                                      ),
                                    ),
                                    title: Text(
                                      habit['title'],
                                      style: TextStyle(
                                        color: isCompleted ? Colors.white30 : Colors.white,
                                        decoration: isCompleted
                                            ? TextDecoration.lineThrough
                                            : TextDecoration.none,
                                        fontSize: 14,
                                      ),
                                    ),
                                    subtitle: Text(
                                      category.toUpperCase(),
                                      style: TextStyle(
                                        fontSize: 9,
                                        color: Colors.white.withOpacity(0.2),
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1,
                                      ),
                                    ),
                                    trailing: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.local_fire_department,
                                            color: isCompleted ? Colors.orangeAccent : Colors.white24,
                                            size: 16),
                                        const SizedBox(width: 4),
                                        Text(
                                          "${habit['streak']}",
                                          style: TextStyle(
                                            color: isCompleted ? Colors.orangeAccent : Colors.white30,
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        IconButton(
                                          icon: const Icon(Icons.delete_outline,
                                              color: Colors.white12, size: 18),
                                          onPressed: () => _deleteHabit(id),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              },
                            ),
                ),

                const SizedBox(height: 16),

                // Weekly Performance Chart Section
                const Text(
                  "FOCUS METRICS (WEEKLY)",
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 2,
                    color: Colors.white30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),

                Expanded(
                  flex: 2,
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFF141416),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.white.withOpacity(0.04)),
                    ),
                    child: _weeklyMinutes.isEmpty
                        ? const Center(
                            child: Text(
                              "No focus sessions logged this week.",
                              style: TextStyle(color: Colors.white20, fontSize: 12),
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: _weeklyMinutes.map((day) {
                              final int totalMin = day['totalMinutes'] ?? 0;
                              final String rawDate = day['date'] ?? '';
                              final String label = rawDate.length > 5 ? rawDate.substring(5) : rawDate; // MM-DD
                              
                              // Relative bar height (cap at 120 minutes)
                              final double barHeight = (totalMin / 120.0).clamp(0.05, 1.0) * 80;

                              return Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  Text(
                                    "${totalMin}m",
                                    style: const TextStyle(color: Colors.white55, fontSize: 9),
                                  ),
                                  const SizedBox(height: 6),
                                  Container(
                                    width: 16,
                                    height: barHeight,
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                  ),
                                  const SizedBox(height: 6),
                                  Text(
                                    label,
                                    style: TextStyle(color: Colors.white.withOpacity(0.3), fontSize: 9),
                                  ),
                                ],
                              );
                            }).toList(),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
