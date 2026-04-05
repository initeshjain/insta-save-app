import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Post = {
  id: string;
  url: string;
  tags: string[];
  createdAt: string;
};

const KEY = 'POSTS';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [input, setInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [filters, setFilters] = useState({
    tag: null as string | null,
    sort: 'newest' as 'newest' | 'oldest',
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const data = await AsyncStorage.getItem(KEY);
    const parsed = data ? JSON.parse(data) : [];
    setPosts(parsed);
  };

  const addPost = async () => {
    if (!input.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const newPost: Post = {
      id: Date.now().toString(),
      url: input.trim(),
      tags,
      createdAt: new Date().toISOString(),
    };

    const data = await AsyncStorage.getItem(KEY);
    const existing = data ? JSON.parse(data) : [];

    // dedup (important)
    const exists = existing.some((p: Post) => p.url === newPost.url);
    if (exists) return;

    const updated = [newPost, ...existing];

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    setPosts(updated);

    setInput('');
    setTagsInput('');
  };

  const deletePost = async (id: string) => {
    const data = await AsyncStorage.getItem(KEY);
    const existing = data ? JSON.parse(data) : [];

    const updated = existing.filter((item: Post) => item.id !== id);

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    setPosts(updated);
  };



  const allTags = [
    'All',
    ...Array.from(new Set(posts.flatMap(p => p.tags || []))),
  ];

  let filteredPosts = posts;

  if (filters.tag) {
    filteredPosts = filteredPosts.filter(p =>
      p.tags?.includes(filters.tag!)
    );
  }

  filteredPosts = filteredPosts.sort((a, b) => {
    if (filters.sort === 'newest') {
      return (
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
    } else {
      return (
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
      );
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved Posts</Text>
        <Text style={styles.subtitle}>Organize your Instagram saves</Text>
      </View>

      <View style={styles.inputSection}>
        <TextInput
          placeholder="Paste Instagram link"
          value={input}
          onChangeText={setInput}
          placeholderTextColor="#999"
          style={styles.input}
        />

        <TextInput
          placeholder="Tags (comma separated)"
          value={tagsInput}
          onChangeText={setTagsInput}
          placeholderTextColor="#999"
          style={styles.input}
        />

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={addPost}
        >
          <Text style={styles.primaryButtonText}>+ Save Post</Text>
        </Pressable>
      </View>



      <View style={styles.filterSection}>
        <Text style={styles.sectionLabel}>Filter by Tag</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={allTags}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.tagButton,
                filters.tag === (item === 'All' ? null : item) &&
                styles.tagButtonActive,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                setFilters(prev => ({
                  ...prev,
                  tag: item === 'All' ? null : item,
                }))
              }
            >
              <Text
                style={[
                  styles.tagButtonText,
                  filters.tag === (item === 'All' ? null : item) &&
                  styles.tagButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.sortSection}>
        <Text style={styles.sectionLabel}>Sort by</Text>
        <View style={styles.sortButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.sortButton,
              filters.sort === 'newest' && styles.sortButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              setFilters(prev => ({ ...prev, sort: 'newest' }))
            }
          >
            <Text
              style={[
                styles.sortButtonText,
                filters.sort === 'newest' && styles.sortButtonTextActive,
              ]}
            >
              Newest
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sortButton,
              filters.sort === 'oldest' && styles.sortButtonActive,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              setFilters(prev => ({ ...prev, sort: 'oldest' }))
            }
          >
            <Text
              style={[
                styles.sortButtonText,
                filters.sort === 'oldest' && styles.sortButtonTextActive,
              ]}
            >
              Oldest
            </Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.sortButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() =>
              setFilters({ tag: null, sort: 'newest' })
            }
          >
            <Text style={styles.sortButtonText}>Reset</Text>
          </Pressable>
        </View>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No posts yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add your first Instagram link to get started
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <Text style={styles.postDate}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <Pressable
              onPress={() => Linking.openURL(item.url)}
              style={({ pressed }) => pressed && styles.postLinkPressed}
            >
              <Text style={styles.postUrl} numberOfLines={2}>
                {item.url}
              </Text>
            </Pressable>

            {item.tags && item.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {item.tags.map((tag) => (
                  <View key={tag} style={styles.tagBadge}>
                    <Text style={styles.tagBadgeText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => deletePost(item.id)}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </View>
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
  inputSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  input: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 14,
    color: '#1a1a1a',
    backgroundColor: '#f8f9fa',
  },
  primaryButton: {
    backgroundColor: '#e1306c',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  buttonPressed: {
    opacity: 0.7,
  },
  filterSection: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagButton: {
    marginLeft: 20,
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
  },
  tagButtonActive: {
    backgroundColor: '#e1306c',
    borderColor: '#e1306c',
  },
  tagButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  tagButtonTextActive: {
    color: '#fff',
  },
  sortSection: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  sortButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
  },
  sortButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dee2e6',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
  },
  sortButtonActive: {
    backgroundColor: '#e1306c',
    borderColor: '#e1306c',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    marginBottom: 10,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  postUrl: {
    fontSize: 14,
    color: '#e1306c',
    fontWeight: '500',
    marginBottom: 10,
  },
  postLinkPressed: {
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tagBadge: {
    backgroundColor: '#fce4ec',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagBadgeText: {
    fontSize: 12,
    color: '#c2185b',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#fff3e0',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffb74d',
  },
  deleteButtonText: {
    color: '#e65100',
    fontSize: 13,
    fontWeight: '600',
  },
});
