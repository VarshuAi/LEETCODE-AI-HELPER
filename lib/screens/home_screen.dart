import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback onSwipeRight;
  final VoidCallback onSwipeLeft;

  const HomeScreen({
    Key? key,
    required this.onSwipeRight,
    required this.onSwipeLeft,
  }) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with SingleTickerProviderStateMixin {
  static const _platform = MethodChannel('com.varshan.chronos/apps');

  List<Map<String, dynamic>> _installedApps = [];
  List<Map<String, dynamic>> _filteredApps = [];
  bool _isDrawerOpen = false;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  
  // Custom analog dial ticker
  late Timer _clockTimer;
  DateTime _currentTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _startClock();
    _loadInstalledApps();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _startClock() {
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _currentTime = DateTime.now();
        });
      }
    });
  }

  Future<void> _loadInstalledApps() async {
    try {
      final List<dynamic> apps = await _platform.invokeMethod('getInstalledApps');
      setState(() {
        _installedApps = apps.map((app) => Map<String, dynamic>.from(app)).toList();
        _filteredApps = List.from(_installedApps);
      });
    } on PlatformException catch (e) {
      debugPrint("Failed to load apps: ${e.message}");
    }
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      if (query.isEmpty) {
        _filteredApps = List.from(_installedApps);
      } else {
        _filteredApps = _installedApps
            .where((app) => (app['name'] as String).toLowerCase().contains(query))
            .toList();
      }
    });
  }

  Future<void> _launchApp(String packageName) async {
    try {
      final bool success = await _platform.invokeMethod('launchApp', {'packageName': packageName});
      if (success) {
        // Close search drawer on launch
        _closeDrawer();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to open application')),
        );
      }
    } on PlatformException catch (e) {
      debugPrint("Failed to launch app: ${e.message}");
    }
  }

  void _openDrawer() {
    setState(() {
      _isDrawerOpen = true;
    });
    // Request focus on next frame to ensure the search field is loaded
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
    });
  }

  void _closeDrawer() {
    setState(() {
      _isDrawerOpen = false;
      _searchController.clear();
    });
    _searchFocusNode.unfocus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F11), // Matte Deep Carbon
      body: GestureDetector(
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity == null) return;
          if (details.primaryVelocity! < -300) {
            // Swiped Left
            widget.onSwipeLeft();
          } else if (details.primaryVelocity! > 300) {
            // Swiped Right
            widget.onSwipeRight();
          }
        },
        onVerticalDragEnd: (details) {
          if (details.primaryVelocity == null) return;
          if (details.primaryVelocity! < -300) {
            // Swipe Up -> Open app drawer
            _openDrawer();
          } else if (details.primaryVelocity! > 300 && _isDrawerOpen) {
            // Swipe Down -> Close app drawer
            _closeDrawer();
          }
        },
        child: Stack(
          children: [
            // Core launcher screen
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 32.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Top Bar (Developer Info & Status)
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          "CHRONOS BY VARSHAN",
                          style: TextStyle(
                            fontSize: 12,
                            letterSpacing: 3,
                            fontWeight: FontWeight.w600,
                            color: Colors.white.withOpacity(0.3),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, py: 4),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.04),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  color: Color(0xFF00FF66), // Glowing green focus dot
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                "FOCUS ACTIVE",
                                style: TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1,
                                  color: Colors.white.withOpacity(0.4),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    // Central Elegant Dial Clock
                    Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 250,
                            height: 250,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: const Color(0xFF141416),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.4),
                                  offset: const Offset(8, 8),
                                  blurRadius: 16,
                                ),
                                BoxShadow(
                                  color: Colors.white.withOpacity(0.02),
                                  offset: const Offset(-8, -8),
                                  blurRadius: 16,
                                ),
                              ],
                            ),
                            child: CustomPaint(
                              painter: ClockPainter(_currentTime),
                            ),
                          ),
                          const SizedBox(height: 32),
                          // Fuzzy Date & Time Description
                          Text(
                            _getFuzzyTime(),
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              fontSize: 18,
                              color: Colors.white70,
                              fontWeight: FontWeight.w300,
                              letterSpacing: 1,
                            ),
                          ),
                        ],
                      ),
                    ),

                    // Bottom Navigation Bar Hints
                    Column(
                      children: [
                        // Swift shortcut buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _buildQuickShortcut(Icons.phone_outlined, "tel:"),
                            const SizedBox(width: 24),
                            _buildQuickShortcut(Icons.chat_bubble_outline, "sms:"),
                            const SizedBox(width: 24),
                            _buildQuickShortcut(Icons.camera_alt_outlined, "camera:"),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Icon(Icons.arrow_back_ios_new, size: 12, color: Colors.white.withOpacity(0.15)),
                            Text(
                              "SWIPE LEFT FOR LOFI • SWIPE UP FOR APPS • SWIPE RIGHT FOR ROUTINE",
                              style: TextStyle(
                                fontSize: 8,
                                letterSpacing: 1,
                                color: Colors.white.withOpacity(0.2),
                              ),
                            ),
                            Icon(Icons.arrow_forward_ios, size: 12, color: Colors.white.withOpacity(0.15)),
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            // Sliding app drawer
            if (_isDrawerOpen)
              GestureDetector(
                onTap: _closeDrawer,
                child: Container(
                  color: Colors.black.withOpacity(0.6), // Dark overlay
                ),
              ),

            AnimatedPositioned(
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeInOut,
              bottom: _isDrawerOpen ? 0 : -MediaQuery.of(context).size.height * 0.75,
              left: 0,
              right: 0,
              height: MediaQuery.of(context).size.height * 0.75,
              child: Container(
                decoration: const BoxDecoration(
                  color: Color(0xFF141416), // Dark Carbon Gray
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(32),
                    topRight: Radius.circular(32),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black54,
                      blurRadius: 24,
                      spreadRadius: 4,
                      offset: Offset(0, -4),
                    ),
                  ],
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
                  child: Column(
                    children: [
                      // Handle bar
                      Container(
                        width: 48,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      const SizedBox(height: 20),
                      // Elegant Search Bar
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1B1B1E),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.04),
                          ),
                        ),
                        child: TextField(
                          controller: _searchController,
                          focusNode: _searchFocusNode,
                          style: const TextStyle(color: Colors.white, fontSize: 16),
                          cursorColor: Colors.white30,
                          decoration: InputDecoration(
                            border: InputBorder.none,
                            hintText: "Search apps...",
                            hintStyle: TextStyle(
                              color: Colors.white.withOpacity(0.2),
                              fontSize: 16,
                            ),
                            icon: Icon(Icons.search, color: Colors.white.withOpacity(0.2)),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, color: Colors.white30, size: 18),
                                    onPressed: () => _searchController.clear(),
                                  )
                                : null,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Fast App Drawer Grid/List
                      Expanded(
                        child: _filteredApps.isEmpty
                            ? Center(
                                child: Text(
                                  "No apps found",
                                  style: TextStyle(
                                    color: Colors.white.withOpacity(0.2),
                                    fontSize: 14,
                                  ),
                                ),
                              )
                            : ListView.builder(
                                physics: const BouncingScrollPhysics(),
                                itemCount: _filteredApps.length,
                                padding: const EdgeInsets.only(bottom: 24),
                                itemBuilder: (context, index) {
                                  final app = _filteredApps[index];
                                  return InkWell(
                                    onTap: () => _launchApp(app['packageName']),
                                    borderRadius: BorderRadius.circular(12),
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 8.0),
                                      child: Row(
                                        children: [
                                          Container(
                                            width: 44,
                                            height: 44,
                                            decoration: BoxDecoration(
                                              color: Colors.white.withOpacity(0.03),
                                              borderRadius: BorderRadius.circular(10),
                                              border: Border.all(
                                                color: Colors.white.withOpacity(0.02),
                                              ),
                                            ),
                                            child: Center(
                                              child: Text(
                                                (app['name'] as String).substring(0, 1).toUpperCase(),
                                                style: const TextStyle(
                                                  color: Colors.white55,
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 18,
                                                ),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 16),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  app['name'],
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                    fontWeight: FontWeight.w500,
                                                    fontSize: 15,
                                                  ),
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  app['packageName'],
                                                  style: TextStyle(
                                                    color: Colors.white.withOpacity(0.25),
                                                    fontSize: 11,
                                                    overflow: TextOverflow.ellipsis,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ),
                                          Icon(
                                            Icons.arrow_forward_ios,
                                            size: 12,
                                            color: Colors.white.withOpacity(0.15),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickShortcut(IconData icon, String url) {
    return Container(
      width: 52,
      height: 52,
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        shape: BoxShape.circle,
        border: Border.all(color: Colors.white.withOpacity(0.03)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            offset: const Offset(4, 4),
            blurRadius: 8,
          ),
        ],
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.white54, size: 22),
        onPressed: () {
          // Fallback UI notification
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Launch shortcut: $url'),
              duration: const Duration(seconds: 1),
            ),
          );
        },
      ),
    );
  }

  String _getFuzzyTime() {
    final hour = _currentTime.hour;
    final min = _currentTime.minute;
    final ampm = hour >= 12 ? 'PM' : 'AM';
    final formattedHour = hour % 12 == 0 ? 12 : hour % 12;
    
    // Fuzzy minutes text
    String minStr = min < 10 ? '0$min' : '$min';
    final List<String> days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final List<String> months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    final dayStr = days[_currentTime.weekday - 1];
    final monthStr = months[_currentTime.month - 1];
    final dateStr = _currentTime.day;

    return "$formattedHour:$minStr $ampm\n$dayStr, $monthStr $dateStr";
  }
}

// Clock painter for elegant Carbon Analog Dial
class ClockPainter extends CustomPainter {
  final DateTime time;

  ClockPainter(this.time);

  @override
  void paint(Canvas canvas, Size size) {
    final centerX = size.width / 2;
    final centerY = size.height / 2;
    final center = Offset(centerX, centerY);
    final radius = min(centerX, centerY);

    // Draw clock face indicators (tick marks)
    final tickPaint = Paint()
      ..color = Colors.white.withOpacity(0.1)
      ..strokeWidth = 1.5;

    for (var i = 0; i < 12; i++) {
      final angle = i * 30 * pi / 180;
      final outerX = centerX + (radius - 12) * cos(angle);
      final outerY = centerY + (radius - 12) * sin(angle);
      final innerX = centerX + (radius - 22) * cos(angle);
      final innerY = centerY + (radius - 22) * sin(angle);
      canvas.drawLine(Offset(innerX, innerY), Offset(outerX, outerY), tickPaint);
    }

    // Hour Hand
    final hourAngle = ((time.hour % 12) * 30 + time.minute * 0.5) * pi / 180;
    final hourHandPaint = Paint()
      ..color = Colors.white70
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      center,
      Offset(centerX + (radius - 60) * sin(hourAngle), centerY - (radius - 60) * cos(hourAngle)),
      hourHandPaint,
    );

    // Minute Hand
    final minuteAngle = (time.minute * 6 + time.second * 0.1) * pi / 180;
    final minuteHandPaint = Paint()
      ..color = Colors.white54
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      center,
      Offset(centerX + (radius - 40) * sin(minuteAngle), centerY - (radius - 40) * cos(minuteAngle)),
      minuteHandPaint,
    );

    // Second Hand (Carbon Orange/Crimson glow accent)
    final secondAngle = time.second * 6 * pi / 180;
    final secondHandPaint = Paint()
      ..color = const Color(0xFFFF453A) // Premium Orange Accent
      ..strokeWidth = 1.2
      ..strokeCap = StrokeCap.round;
    canvas.drawLine(
      center,
      Offset(centerX + (radius - 30) * sin(secondAngle), centerY - (radius - 30) * cos(secondAngle)),
      secondHandPaint,
    );

    // Center Hub
    final centerCapPaint = Paint()..color = const Color(0xFF0F0F11);
    canvas.drawCircle(center, 6, centerCapPaint);

    final centerPinPaint = Paint()..color = const Color(0xFFFF453A);
    canvas.drawCircle(center, 2.5, centerPinPaint);
  }

  @override
  bool shouldRepaint(covariant ClockPainter oldDelegate) {
    return oldDelegate.time.second != time.second;
  }
}
