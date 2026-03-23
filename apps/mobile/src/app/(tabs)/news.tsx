import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../constants/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { NewsPost } from '../../types';

function NewsCard({ post }: { post: NewsPost }) {
  const time = new Date(post.publishedAt || post.createdAt);
  const timeStr = time.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const statusColors: Record<string, string> = {
    published: Colors.success,
    pending_approval: Colors.warning,
    draft: Colors.textMuted,
    rejected: Colors.error,
  };

  return (
    <View style={styles.newsCard}>
      <View style={styles.newsHeader}>
        <View style={[styles.statusDot, { backgroundColor: statusColors[post.status] || Colors.textMuted }]} />
        <Text style={styles.newsAuthor}>{post.author.name}</Text>
        <Text style={styles.newsTime}>{timeStr}</Text>
      </View>
      <Text style={styles.newsTitle}>{post.title}</Text>
      <Text style={styles.newsContent} numberOfLines={4}>
        {post.content}
      </Text>
      {post.approvals && post.approvals.length > 0 && (
        <View style={styles.approvalsRow}>
          {post.approvals.map(a => (
            <View key={a.id} style={styles.approvalChip}>
              <Ionicons
                name={a.approved ? 'checkmark-circle' : 'close-circle'}
                size={12}
                color={a.approved ? Colors.success : Colors.error}
              />
              <Text style={styles.approvalName}>{a.approver.name}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function NewsScreen() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = useCallback(async () => {
    try {
      const data = await apiFetch<NewsPost[]>(API_ENDPOINTS.news);
      setPosts(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <NewsCard post={item} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchNews} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="newspaper-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucun article publié</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: Spacing.lg, gap: Spacing.md },
  newsCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  newsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  newsAuthor: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    flex: 1,
  },
  newsTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  newsTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 24,
  },
  newsContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  approvalsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  approvalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  approvalName: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 100,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
