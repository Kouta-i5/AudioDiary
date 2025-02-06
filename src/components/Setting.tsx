import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function Setting() {
  return (

    <View style={styles.container}>
      <Text>設定</Text>
    </View>

  );
}