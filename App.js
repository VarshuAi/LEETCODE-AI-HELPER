import React, { useState } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import HomeScreen from './screens/HomeScreen';
import DashboardScreen from './screens/DashboardScreen';
import MixerScreen from './screens/MixerScreen';

export default function App() {
  const [activeScreen, setActiveScreen] = useState('home');

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <DashboardScreen onSwipeLeft={() => setActiveScreen('home')} />;
      case 'mixer':
        return <MixerScreen onSwipeRight={() => setActiveScreen('home')} />;
      case 'home':
      default:
        return (
          <HomeScreen
            onSwipeRight={() => setActiveScreen('dashboard')}
            onSwipeLeft={() => setActiveScreen('mixer')}
          />
        );
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#0F0F11"
          translucent={true}
        />
        {renderActiveScreen()}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F11',
  },
});
