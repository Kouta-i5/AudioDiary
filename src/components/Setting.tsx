import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  settingLabel: {
    fontSize: 16,
  },
});

export default function Setting() {
  const [isSpeechOn, setIsSpeechOn] = useState(true);

  useEffect(() => {
    // 初期値の読み込み
    loadSpeechSetting();
  }, []);

  const loadSpeechSetting = async () => {
    try {
      const value = await AsyncStorage.getItem('isSpeechOn');
      if (value !== null) {
        setIsSpeechOn(JSON.parse(value));
      }
    } catch (error) {
      console.error('設定の読み込みエラー:', error);
    }
  };

  const toggleSpeech = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('isSpeechOn', JSON.stringify(value));
      setIsSpeechOn(value);
    } catch (error) {
      console.error('設定の保存エラー:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>読み上げ機能</Text>
        <Switch
          value={isSpeechOn}
          onValueChange={toggleSpeech}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isSpeechOn ? '#007AFF' : '#f4f3f4'}
        />
      </View>
    </View>
  );
}