import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'database/db_helper.dart';
import 'screens/home_screen.dart';
import 'screens/dashboard.dart';
import 'screens/mixer.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set orientation to portrait only
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
  ]);

  // Set system navigation overlay styling for premium immersive carbon look
  SystemChrome.setSystemUIOverlayStyle(const SystemOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
    systemNavigationBarColor: Color(0xFF0F0F11),
    systemNavigationBarIconBrightness: Brightness.light,
  ));

  // Initialize SQLite local database on startup
  final dbHelper = DbHelper();
  await dbHelper.database;

  runApp(const ChronosApp());
}

class ChronosApp extends StatelessWidget {
  const ChronosApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chronos',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        fontFamily: 'Outfit', // High-fidelity clean typography
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F0F11),
        textSelectionTheme: const TextSelectionThemeData(
          cursorColor: Colors.white24,
          selectionColor: Colors.white10,
          selectionHandleColor: Colors.white24,
        ),
      ),
      home: const ChronosRouter(),
    );
  }
}

class ChronosRouter extends StatefulWidget {
  const ChronosRouter({Key? key}) : super(key: key);

  @override
  State<ChronosRouter> createState() => _ChronosRouterState();
}

class _ChronosRouterState extends State<ChronosRouter> {
  late PageController _pageController;

  // We have 3 screens: [Dashboard, HomeScreen, MixerScreen]
  // HomeScreen is in the center (index 1)
  final int _homeIndex = 1;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(initialPage: _homeIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _navigateToDashboard() {
    _pageController.animateToPage(
      0,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  void _navigateToMixer() {
    _pageController.animateToPage(
      2,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  void _navigateToHome() {
    _pageController.animateToPage(
      _homeIndex,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        // Intercept back button and redirect to home screen if drawer or other screens are open
        if (_pageController.page != _homeIndex.toDouble()) {
          _navigateToHome();
          return false; // prevent closing
        }
        return true;
      },
      child: Scaffold(
        body: PageView(
          controller: _pageController,
          physics: const BouncingScrollPhysics(),
          children: [
            DashboardScreen(
              onSwipeLeft: _navigateToHome,
            ),
            HomeScreen(
              onSwipeRight: _navigateToDashboard,
              onSwipeLeft: _navigateToMixer,
            ),
            MixerScreen(
              onSwipeRight: _navigateToHome,
            ),
          ],
        ),
      ),
    );
  }
}
