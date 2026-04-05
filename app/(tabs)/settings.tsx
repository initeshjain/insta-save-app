import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const KEY = 'POSTS';

export default function SettingsScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const exportBackup = async () => {
    try {
      setIsLoading(true);
      const data = await AsyncStorage.getItem(KEY);
      const posts = data ? JSON.parse(data) : [];

      const backup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        posts,
      };

      const fileUri =
        FileSystem.documentDirectory + 'insta-save-backup.json';

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(backup)
      );

      await Sharing.shareAsync(fileUri);
    } catch (err) {
      console.log('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const importBackup = async () => {
    try {
      setIsLoading(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;

      const content = await FileSystem.readAsStringAsync(fileUri);
      const parsed = JSON.parse(content);

      if (!parsed.posts || !Array.isArray(parsed.posts)) return;

      await AsyncStorage.setItem(KEY, JSON.stringify(parsed.posts));
      alert('Backup imported successfully!');
    } catch (err) {
      console.log('Import error:', err);
      alert('Failed to import backup');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your backups</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Restore</Text>
        <Text style={styles.sectionDescription}>
          Export your saved posts to a backup file or import from an existing backup.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.exportButton,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={exportBackup}
          disabled={isLoading}
        >
          <Text style={styles.exportButtonText}>Export Backup</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.importButton,
            pressed && styles.buttonPressed,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={importBackup}
          disabled={isLoading}
        >
          <Text style={styles.importButtonText}>Import Backup</Text>
        </Pressable>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>About Backups</Text>
        <Text style={styles.infoText}>
          Backups are stored as JSON files. You can export your posts at any time and import them on another device.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  exportButton: {
    backgroundColor: '#e1306c',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  importButton: {
    backgroundColor: '#0095f6',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  infoBox: {
    backgroundColor: '#fffaeb',
    marginHorizontal: 16,
    marginVertical: 16,
    padding: 14,
    borderLeftColor: '#fbbf24',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
  },
});
