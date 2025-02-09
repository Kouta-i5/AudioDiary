import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import Constants from 'expo-constants';
import * as Speech from 'expo-speech';
import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  chatContainer: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#E9E9EB',
    alignSelf: 'flex-start',
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: 'black',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    borderRadius: 20,
    padding: 12,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
  },
  micButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  micButtonRecording: {
    backgroundColor: '#FF3B30',
  },
  micButtonText: {
    color: 'white',
  },

  // トグルボタンまわりの簡易スタイル
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 8,
  },
  toggleText: {
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#E8F5E9',  // 薄い緑の背景色に変更
    padding: 8,
    borderRadius: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  diaryButton: {
    backgroundColor: '#FF9500',
    padding: 8,
    borderRadius: 16,
    marginRight: 'auto',
  },
  diaryButtonText: {
    color: 'white',
    fontSize: 14,
  },
});

interface ChatGPTMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [isSpeechOn, setIsSpeechOn] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [messages, setMessages] = useState<ChatGPTMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // 日記モードのステート追加
  const [isDiaryMode, setIsDiaryMode] = useState(false);

  const scrollViewRef = React.useRef<ScrollView>(null);

  useEffect(() => {
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

    loadSpeechSetting();
    const date = new Date();
    const formattedDate = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    setCurrentDate(formattedDate);

    Voice.onSpeechResults = (e) => {
      if (e.value && e.value[0]) {
        setInputText(e.value[0]);
      }
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // 音声認識が動作中の場合は停止する
    if (isRecording) {
      await stopSpeechToText();
      setInputText('');
    }

    const userMessage: ChatGPTMessage = { role: 'user', content: inputText.trim() };
    
    // 入力欄のクリアを先に実行
    setInputText('');
    
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Constants.expoConfig?.extra?.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages.length > 0 ? [...messages, userMessage] : [userMessage],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const assistantMessage: ChatGPTMessage = {
          role: 'assistant',
          content: data.choices[0].message.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // メッセージ追加後に最下部にスクロール
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);

        if (isSpeechOn) {
          Speech.speak(assistantMessage.content, {
            language: 'ja-JP',
            pitch: 1.0,
            rate: 1.0,
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      // エラーメッセージをユーザーに表示することをお勧めします
    } finally {
      setIsLoading(false);
    }
  };

  const startSpeechToText = async () => {
    try {
      setIsRecording(true);
      await Voice.start('ja-JP');
    } catch (error) {
      console.error('音声認識エラー:', error);
      alert('音声認識に失敗しました');
      setIsRecording(false);
    }
  };

  const stopSpeechToText = async () => {
    try {
      await Voice.stop();
      setIsRecording(false);
    } catch (error) {
      console.error('音声認識停止エラー:', error);
    }
  };

  // 日記モードを開始する関数
  const startDiaryMode = () => {
    setIsDiaryMode(true);
    const diaryPrompt = "今日はどんな1日でしたか？";
    const assistantMessage: ChatGPTMessage = {
      role: 'assistant',
      content: diaryPrompt,
    };
    setMessages([assistantMessage]);
    
    // 音声読み上げがオンの場合、質問を読み上げる
    if (isSpeechOn) {
      Speech.speak(diaryPrompt, {
        language: 'ja-JP',
        pitch: 1.0,
        rate: 1.0,
      });
    }
  };

  // 日記を終える関数を追加
  const endDiaryMode = () => {
    const endMessage: ChatGPTMessage = {
      role: 'assistant',
      content: '今日もいい一日でしたね。明日も頑張りましょう！',
    };
    setMessages(prev => [...prev, endMessage]);
    setIsDiaryMode(false);

    // 音声読み上げがオンの場合、締めのメッセージを読み上げる
    if (isSpeechOn) {
      Speech.speak(endMessage.content, {
        language: 'ja-JP',
        pitch: 1.0,
        rate: 1.0,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.dateText}>{currentDate}</Text>
      <View style={styles.toggleContainer}>
        {!isDiaryMode ? (
          <TouchableOpacity
            style={styles.diaryButton}
            onPress={startDiaryMode}
            disabled={isLoading || messages.length > 0}
          >
            <Text style={styles.diaryButtonText}>日記を始める</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.diaryButton, { backgroundColor: '#FF3B30' }]}
            onPress={endDiaryMode}
            disabled={isLoading}
          >
            <Text style={styles.diaryButtonText}>日記を終える</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.chatContainer}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, index) => (
          <View
            key={index}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage,
            ]}
          >
            <Text
              style={
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              }
            >
              {message.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={isRecording ? stopSpeechToText : startSpeechToText}
          disabled={isLoading}
        >
          <Text style={styles.micButtonText}>🎤</Text>
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="メッセージを入力..."
          multiline
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage} disabled={isLoading}>
          <Text style={styles.sendButtonText}>送信</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}