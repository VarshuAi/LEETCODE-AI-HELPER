import 'dart:async';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../database/db_helper.dart';

class MixerScreen extends StatefulWidget {
  final VoidCallback onSwipeRight;

  const MixerScreen({Key? key, required this.onSwipeRight}) : super(key: key);

  @override
  State<MixerScreen> createState() => _MixerScreenState();
}

class _MixerScreenState extends State<MixerScreen> {
  final DbHelper _db = DbHelper();

  // Three separate players for multi-channel mixing
  late AudioPlayer _rainPlayer;
  late AudioPlayer _synthPlayer;
  late AudioPlayer _pianoPlayer;

  bool _isRainPlaying = false;
  bool _isSynthPlaying = false;
  bool _isPianoPlaying = false;

  double _rainVolume = 0.5;
  double _synthVolume = 0.3;
  double _pianoVolume = 0.4;

  bool _isPlayersInitialized = false;

  // Focus Session Stopwatch
  Timer? _sessionTimer;
  int _elapsedSeconds = 0;
  bool _isSessionActive = false;

  @override
  void initState() {
    super.initState();
    _initAudioPlayers();
  }

  @override
  void dispose() {
    _sessionTimer?.cancel();
    _rainPlayer.dispose();
    _synthPlayer.dispose();
    _pianoPlayer.dispose();
    super.dispose();
  }

  Future<void> _initAudioPlayers() async {
    _rainPlayer = AudioPlayer();
    _synthPlayer = AudioPlayer();
    _pianoPlayer = AudioPlayer();

    try {
      // Set assets and loop modes
      await _rainPlayer.setAsset('assets/audio/rain_lofi.mp3');
      await _rainPlayer.setLoopMode(LoopMode.one);
      await _rainPlayer.setVolume(_rainVolume);

      await _synthPlayer.setAsset('assets/audio/deep_synth.mp3');
      await _synthPlayer.setLoopMode(LoopMode.one);
      await _synthPlayer.setVolume(_synthVolume);

      await _pianoPlayer.setAsset('assets/audio/mellow_piano.mp3');
      await _pianoPlayer.setLoopMode(LoopMode.one);
      await _pianoPlayer.setVolume(_pianoVolume);

      if (mounted) {
        setState(() {
          _isPlayersInitialized = true;
        });
      }
    } catch (e) {
      debugPrint("Error initializing players: $e");
    }
  }

  // Focus session controls
  void _toggleFocusSession() {
    if (_isSessionActive) {
      // Stop session and log to SQLite database
      _sessionTimer?.cancel();
      final minutes = (_elapsedSeconds / 60).round();
      if (minutes > 0) {
        _logFocusSession(minutes);
      }
      setState(() {
        _isSessionActive = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Focus Session Stopped. Logged $minutes minutes!'),
          backgroundColor: Colors.white,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
    } else {
      // Start session
      setState(() {
        _elapsedSeconds = 0;
        _isSessionActive = true;
      });
      _sessionTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (mounted) {
          setState(() {
            _elapsedSeconds++;
          });
        }
      });
    }
  }

  Future<void> _logFocusSession(int minutes) async {
    String primaryAudio = "None";
    if (_isRainPlaying) primaryAudio = "Rain";
    else if (_isSynthPlaying) primaryAudio = "Synth";
    else if (_isPianoPlaying) primaryAudio = "Piano";

    await _db.insertFocusSession(minutes, primaryAudio);
  }

  void _toggleRain() {
    setState(() {
      _isRainPlaying = !_isRainPlaying;
      if (_isRainPlaying) {
        _rainPlayer.play();
      } else {
        _rainPlayer.pause();
      }
    });
  }

  void _toggleSynth() {
    setState(() {
      _isSynthPlaying = !_isSynthPlaying;
      if (_isSynthPlaying) {
        _synthPlayer.play();
      } else {
        _synthPlayer.pause();
      }
    });
  }

  void _togglePiano() {
    setState(() {
      _isPianoPlaying = !_isPianoPlaying;
      if (_isPianoPlaying) {
        _pianoPlayer.play();
      } else {
        _pianoPlayer.pause();
      }
    });
  }

  String _formatElapsedTime() {
    final minutes = _elapsedSeconds ~/ 60;
    final seconds = _elapsedSeconds % 60;
    final minStr = minutes < 10 ? '0$minutes' : '$minutes';
    final secStr = seconds < 10 ? '0$seconds' : '$seconds';
    return "$minStr:$secStr";
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0F11),
      body: GestureDetector(
        onHorizontalDragEnd: (details) {
          if (details.primaryVelocity == null) return;
          if (details.primaryVelocity! > 300) {
            // Swipe Right -> Back to Home screen
            widget.onSwipeRight();
          }
        },
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header details
                Text(
                  "ATMOSPHERIC AUDIO",
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 2,
                    fontWeight: FontWeight.bold,
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  "Lofi Mixer Deck",
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 24),

                // Dynamic stopwatch panel for active focus sessions
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(24),
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
                  child: Column(
                    children: [
                      Text(
                        _isSessionActive ? "FOCUS TIMER RUNNING" : "START STUDY BLOCK",
                        style: TextStyle(
                          fontSize: 10,
                          letterSpacing: 1.5,
                          color: _isSessionActive ? const Color(0xFFFF453A) : Colors.white24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _formatElapsedTime(),
                        style: TextStyle(
                          fontSize: 48,
                          fontFamily: 'monospace',
                          fontWeight: FontWeight.bold,
                          color: _isSessionActive ? Colors.white : Colors.white24,
                        ),
                      ),
                      const SizedBox(height: 20),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: _isSessionActive ? const Color(0xFFFF453A) : Colors.white,
                          foregroundColor: _isSessionActive ? Colors.white : Colors.black,
                          padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: _toggleFocusSession,
                        child: Text(
                          _isSessionActive ? "Stop Focus Session" : "Start Focus Session",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 28),

                // Channels List
                const Text(
                  "LOFI FOCUS CHANNELS",
                  style: TextStyle(
                    fontSize: 10,
                    letterSpacing: 2,
                    color: Colors.white30,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),

                Expanded(
                  child: !_isPlayersInitialized
                      ? const Center(child: CircularProgressIndicator(color: Colors.white24))
                      : ListView(
                          physics: const BouncingScrollPhysics(),
                          children: [
                            _buildAudioChannel(
                              title: "Rain Lofi Loop",
                              subtitle: "Deep structural white noise generator",
                              icon: Icons.thunderstorm_outlined,
                              isPlaying: _isRainPlaying,
                              volume: _rainVolume,
                              onToggle: _toggleRain,
                              onVolumeChanged: (val) {
                                setState(() {
                                  _rainVolume = val;
                                  _rainPlayer.setVolume(val);
                                });
                              },
                            ),
                            const SizedBox(height: 16),
                            _buildAudioChannel(
                              title: "Deep Synth Ambient",
                              subtitle: "Binaural delta frequency synthesizer",
                              icon: Icons.waves,
                              isPlaying: _isSynthPlaying,
                              volume: _synthVolume,
                              onToggle: _toggleSynth,
                              onVolumeChanged: (val) {
                                setState(() {
                                  _synthVolume = val;
                                  _synthPlayer.setVolume(val);
                                });
                              },
                            ),
                            const SizedBox(height: 16),
                            _buildAudioChannel(
                              title: "Mellow Piano Chords",
                              subtitle: "Soft repeating neo-classical progression",
                              icon: Icons.piano,
                              isPlaying: _isPianoPlaying,
                              volume: _pianoVolume,
                              onToggle: _togglePiano,
                              onVolumeChanged: (val) {
                                setState(() {
                                  _pianoVolume = val;
                                  _pianoPlayer.setVolume(val);
                                });
                              },
                            ),
                          ],
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAudioChannel({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isPlaying,
    required double volume,
    required VoidCallback onToggle,
    required ValueChanged<double> onVolumeChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFF141416),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isPlaying ? Colors.white.withOpacity(0.08) : Colors.transparent,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: isPlaying ? Colors.white.withOpacity(0.08) : Colors.white.withOpacity(0.02),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  icon,
                  color: isPlaying ? Colors.white : Colors.white30,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: TextStyle(
                        color: isPlaying ? Colors.white : Colors.white70,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.25),
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
              InkWell(
                onTap: onToggle,
                borderRadius: BorderRadius.circular(50),
                child: Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isPlaying ? Colors.white : Colors.white24,
                      width: 1.5,
                    ),
                    color: isPlaying ? Colors.white : Colors.transparent,
                  ),
                  child: Center(
                    child: Icon(
                      isPlaying ? Icons.pause : Icons.play_arrow,
                      color: isPlaying ? Colors.black : Colors.white54,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ],
          ),
          if (isPlaying) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.volume_down, color: Colors.white.withOpacity(0.2), size: 14),
                Expanded(
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: Colors.white,
                      inactiveTrackColor: Colors.white.withOpacity(0.05),
                      trackHeight: 3.0,
                      thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6.0),
                      thumbColor: Colors.white,
                      overlayColor: Colors.white.withOpacity(0.1),
                    ),
                    child: Slider(
                      value: volume,
                      min: 0.0,
                      max: 1.0,
                      onChanged: onVolumeChanged,
                    ),
                  ),
                ),
                Icon(Icons.volume_up, color: Colors.white.withOpacity(0.2), size: 14),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
