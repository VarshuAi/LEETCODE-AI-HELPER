import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Slider
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as SQLite from 'expo-sqlite';

let dbInstance = null;
async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('chronos_launcher.db');
  return dbInstance;
}

export default function MixerScreen({ onSwipeRight }) {
  // Sound instances
  const rainSound = useRef(new Audio.Sound());
  const synthSound = useRef(new Audio.Sound());
  const pianoSound = useRef(new Audio.Sound());

  const [isRainPlaying, setIsRainPlaying] = useState(false);
  const [isSynthPlaying, setIsSynthPlaying] = useState(false);
  const [isPianoPlaying, setIsPianoPlaying] = useState(false);

  const [rainVolume, setRainVolume] = useState(0.5);
  const [synthVolume, setSynthVolume] = useState(0.3);
  const [pianoVolume, setPianoVolume] = useState(0.4);

  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  // Focus Timer States
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const stopwatchTimer = useRef(null);

  // Swipe gesture tracking
  const touchStartX = useRef(0);

  useEffect(() => {
    // Configure audio mode for multitasking/looping background play
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldRouteThroughEarpieceIOS: false,
      playThroughEarpieceAndroid: false,
    });

    initAudioChannels();

    return () => {
      // Clean up audio sound instances
      rainSound.current.unloadAsync();
      synthSound.current.unloadAsync();
      pianoSound.current.unloadAsync();
      if (stopwatchTimer.current) clearInterval(stopwatchTimer.current);
    };
  }, []);

  const initAudioChannels = async () => {
    try {
      // Load lofi assets
      await rainSound.current.loadAsync(
        require('../assets/audio/rain_lofi.mp3'),
        { isLooping: true, volume: rainVolume }
      );
      await synthSound.current.loadAsync(
        require('../assets/audio/deep_synth.mp3'),
        { isLooping: true, volume: synthVolume }
      );
      await pianoSound.current.loadAsync(
        require('../assets/audio/mellow_piano.mp3'),
        { isLooping: true, volume: pianoVolume }
      );

      setIsAudioInitialized(true);
    } catch (e) {
      console.log('Error loading audio loops:', e);
    }
  };

  // Focus Session Controls
  const toggleFocusSession = async () => {
    if (isSessionActive) {
      // Stop session and log to SQLite database
      if (stopwatchTimer.current) clearInterval(stopwatchTimer.current);
      const minutes = Math.round(elapsedSeconds / 60);

      if (minutes > 0) {
        await logFocusSession(minutes);
      }
      setIsSessionActive(false);
    } else {
      // Start session
      setElapsedSeconds(0);
      setIsSessionActive(true);
      stopwatchTimer.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
  };

  const logFocusSession = async (minutes) => {
    try {
      const db = await getDb();
      let primaryAudio = 'None';
      if (isRainPlaying) primaryAudio = 'Rain';
      else if (isSynthPlaying) primaryAudio = 'Synth';
      else if (isPianoPlaying) primaryAudio = 'Piano';

      const today = new Date().toISOString().substring(0, 10); // YYYY-MM-DD
      await db.runAsync(
        'INSERT INTO focus_sessions (date, durationMinutes, audioType) VALUES (?, ?, ?)',
        [today, minutes, primaryAudio]
      );
    } catch (e) {
      console.log('Error logging focus session:', e);
    }
  };

  // Audio Channel Toggles
  const toggleRain = async () => {
    if (!isAudioInitialized) return;
    try {
      if (isRainPlaying) {
        await rainSound.current.pauseAsync();
      } else {
        await rainSound.current.playAsync();
      }
      setIsRainPlaying(!isRainPlaying);
    } catch (e) {
      console.log('Error toggling rain:', e);
    }
  };

  const toggleSynth = async () => {
    if (!isAudioInitialized) return;
    try {
      if (isSynthPlaying) {
        await synthSound.current.pauseAsync();
      } else {
        await synthSound.current.playAsync();
      }
      setIsSynthPlaying(!isSynthPlaying);
    } catch (e) {
      console.log('Error toggling synth:', e);
    }
  };

  const togglePiano = async () => {
    if (!isAudioInitialized) return;
    try {
      if (isPianoPlaying) {
        await pianoSound.current.pauseAsync();
      } else {
        await pianoSound.current.playAsync();
      }
      setIsPianoPlaying(!isPianoPlaying);
    } catch (e) {
      console.log('Error toggling piano:', e);
    }
  };

  // Sound Volume Updates
  const updateRainVolume = async (val) => {
    setRainVolume(val);
    if (isAudioInitialized) {
      await rainSound.current.setVolumeAsync(val);
    }
  };

  const updateSynthVolume = async (val) => {
    setSynthVolume(val);
    if (isAudioInitialized) {
      await synthSound.current.setVolumeAsync(val);
    }
  };

  const updatePianoVolume = async (val) => {
    setPianoVolume(val);
    if (isAudioInitialized) {
      await pianoSound.current.setVolumeAsync(val);
    }
  };

  const formatStopwatch = () => {
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    const minStr = minutes < 10 ? `0${minutes}` : minutes;
    const secStr = seconds < 10 ? `0${seconds}` : seconds;
    return `${minStr}:${secStr}`;
  };

  // Swiping Router gesture triggers
  const onTouchStart = (e) => {
    touchStartX.current = e.nativeEvent.pageX;
  };

  const onTouchEnd = (e) => {
    const diffX = e.nativeEvent.pageX - touchStartX.current;
    if (diffX > 80) {
      onSwipeRight();
    }
  };

  return (
    <View style={styles.container} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header Block */}
        <View style={styles.header}>
          <Text style={styles.subtext}>ATMOSPHERIC AUDIO</Text>
          <Text style={styles.title}>Lofi Mixer Deck</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Stopwatch session container */}
          <View style={styles.timerCard}>
            <Text style={[styles.timerStatus, isSessionActive && styles.timerStatusActive]}>
              {isSessionActive ? 'FOCUS TIMER RUNNING' : 'START STUDY BLOCK'}
            </Text>
            <Text style={[styles.timerDigits, isSessionActive && styles.timerDigitsActive]}>
              {formatStopwatch()}
            </Text>
            <TouchableOpacity
              style={[styles.timerBtn, isSessionActive && styles.timerBtnActive]}
              onPress={toggleFocusSession}
            >
              <Text style={[styles.timerBtnText, isSessionActive && styles.timerBtnTextActive]}>
                {isSessionActive ? 'Stop Focus Session' : 'Start Focus Session'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mixer Channels Panel */}
          <Text style={styles.sectionHeader}>LOFI FOCUS CHANNELS</Text>

          {!isAudioInitialized ? (
            <View style={styles.loaderContainer}>
              <Text style={styles.loaderText}>Calibrating audio channels...</Text>
            </View>
          ) : (
            <View style={styles.channelsDeck}>
              {/* Rain Channel */}
              <View style={[styles.channelCard, isRainPlaying && styles.channelCardActive]}>
                <View style={styles.channelRow}>
                  <View style={[styles.iconContainer, isRainPlaying && styles.iconContainerActive]}>
                    <MaterialCommunityIcons
                      name="weather-rainy"
                      size={20}
                      color={isRainPlaying ? '#FFF' : '#444'}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={[styles.channelTitle, isRainPlaying && styles.channelTitleActive]}>
                      Rain Lofi Loop
                    </Text>
                    <Text style={styles.channelDesc}>Deep structural white noise generator</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.playBtn, isRainPlaying && styles.playBtnActive]}
                    onPress={toggleRain}
                  >
                    <MaterialCommunityIcons
                      name={isRainPlaying ? 'pause' : 'play'}
                      size={18}
                      color={isRainPlaying ? '#000' : '#FFF'}
                    />
                  </TouchableOpacity>
                </View>
                {isRainPlaying && (
                  <View style={styles.sliderRow}>
                    <MaterialCommunityIcons name="volume-low" size={14} color="#333" />
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      value={rainVolume}
                      onValueChange={updateRainVolume}
                      minimumTrackTintColor="#FFF"
                      maximumTrackTintColor="rgba(255,255,255,0.05)"
                      thumbTintColor="#FFF"
                    />
                    <MaterialCommunityIcons name="volume-high" size={14} color="#333" />
                  </View>
                )}
              </View>

              {/* Synth Channel */}
              <View style={[styles.channelCard, isSynthPlaying && styles.channelCardActive]}>
                <View style={styles.channelRow}>
                  <View style={[styles.iconContainer, isSynthPlaying && styles.iconContainerActive]}>
                    <MaterialCommunityIcons
                      name="sine-wave"
                      size={20}
                      color={isSynthPlaying ? '#FFF' : '#444'}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={[styles.channelTitle, isSynthPlaying && styles.channelTitleActive]}>
                      Deep Synth Ambient
                    </Text>
                    <Text style={styles.channelDesc}>Binaural delta frequency synthesizer</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.playBtn, isSynthPlaying && styles.playBtnActive]}
                    onPress={toggleSynth}
                  >
                    <MaterialCommunityIcons
                      name={isSynthPlaying ? 'pause' : 'play'}
                      size={18}
                      color={isSynthPlaying ? '#000' : '#FFF'}
                    />
                  </TouchableOpacity>
                </View>
                {isSynthPlaying && (
                  <View style={styles.sliderRow}>
                    <MaterialCommunityIcons name="volume-low" size={14} color="#333" />
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      value={synthVolume}
                      onValueChange={updateSynthVolume}
                      minimumTrackTintColor="#FFF"
                      maximumTrackTintColor="rgba(255,255,255,0.05)"
                      thumbTintColor="#FFF"
                    />
                    <MaterialCommunityIcons name="volume-high" size={14} color="#333" />
                  </View>
                )}
              </View>

              {/* Piano Channel */}
              <View style={[styles.channelCard, isPianoPlaying && styles.channelCardActive]}>
                <View style={styles.channelRow}>
                  <View style={[styles.iconContainer, isPianoPlaying && styles.iconContainerActive]}>
                    <MaterialCommunityIcons
                      name="piano"
                      size={20}
                      color={isPianoPlaying ? '#FFF' : '#444'}
                    />
                  </View>
                  <View style={styles.channelInfo}>
                    <Text style={[styles.channelTitle, isPianoPlaying && styles.channelTitleActive]}>
                      Mellow Piano Chords
                    </Text>
                    <Text style={styles.channelDesc}>Soft repeating neo-classical progression</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.playBtn, isPianoPlaying && styles.playBtnActive]}
                    onPress={togglePiano}
                  >
                    <MaterialCommunityIcons
                      name={isPianoPlaying ? 'pause' : 'play'}
                      size={18}
                      color={isPianoPlaying ? '#000' : '#FFF'}
                    />
                  </TouchableOpacity>
                </View>
                {isPianoPlaying && (
                  <View style={styles.sliderRow}>
                    <MaterialCommunityIcons name="volume-low" size={14} color="#333" />
                    <Slider
                      style={styles.slider}
                      minimumValue={0}
                      maximumValue={1}
                      value={pianoVolume}
                      onValueChange={updatePianoVolume}
                      minimumTrackTintColor="#FFF"
                      maximumTrackTintColor="rgba(255,255,255,0.05)"
                      thumbTintColor="#FFF"
                    />
                    <MaterialCommunityIcons name="volume-high" size={14} color="#333" />
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
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
  timerCard: {
    backgroundColor: '#141416',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
    marginBottom: 28,
  },
  timerStatus: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.18)',
  },
  timerStatusActive: {
    color: '#FF453A',
  },
  timerDigits: {
    fontSize: 48,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.15)',
    marginVertical: 12,
  },
  timerDigitsActive: {
    color: '#FFF',
  },
  timerBtn: {
    backgroundColor: '#FFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  timerBtnActive: {
    backgroundColor: '#FF453A',
  },
  timerBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timerBtnTextActive: {
    color: '#FFF',
  },
  sectionHeader: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  loaderContainer: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    color: 'rgba(255,255,255,0.15)',
    fontSize: 12,
  },
  channelsDeck: {
    gap: 16,
  },
  channelCard: {
    backgroundColor: '#141416',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  channelCardActive: {
    borderColor: 'rgba(255,255,255,0.05)',
  },
  channelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  channelInfo: {
    flex: 1,
    marginLeft: 16,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.6)',
  },
  channelTitleActive: {
    color: '#FFF',
  },
  channelDesc: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.22)',
    marginTop: 2,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    borderColor: '#FFF',
    backgroundColor: '#FFF',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 4,
  },
  slider: {
    flex: 1,
    marginHorizontal: 12,
    height: 20,
  },
});
