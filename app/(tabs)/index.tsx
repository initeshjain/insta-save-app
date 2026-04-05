import { View, Text, FlatList } from 'react-native';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Post = {
  id: string;
  url: string;
};

const KEY = 'POSTS';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const data = await AsyncStorage.getItem(KEY);
    const parsed = data ? JSON.parse(data) : [];
    setPosts(parsed);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>
        Saved Posts
      </Text>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text>No posts yet</Text>}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 10 }}>
            <Text>{item.url}</Text>
          </View>
        )}
      />
    </View>
  );
}