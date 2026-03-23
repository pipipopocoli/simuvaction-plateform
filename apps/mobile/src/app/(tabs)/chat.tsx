import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatRooms } from '../../hooks/use-chat-rooms';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { ChatRoom } from '../../types';

const roomTypeIcon: Record<string, string> = {
  global: '🌐',
  team: '🏳️',
  private: '🔒',
  direct: '💬',
};

function RoomItem({ room }: { room: ChatRoom }) {
  const icon = roomTypeIcon[room.roomType] || '💬';
  const lastMsg = room.lastMessage;
  const time = lastMsg ? formatTime(lastMsg.createdAt) : '';

  return (
    <TouchableOpacity
      style={styles.roomItem}
      onPress={() => router.push(`/chat/${room.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.roomIcon}>
        <Text style={styles.roomEmoji}>{icon}</Text>
      </View>
      <View style={styles.roomContent}>
        <View style={styles.roomHeader}>
          <Text style={styles.roomName} numberOfLines={1}>{room.name}</Text>
          {time ? <Text style={styles.roomTime}>{time}</Text> : null}
        </View>
        {lastMsg ? (
          <Text style={styles.roomPreview} numberOfLines={1}>
            {lastMsg.sender?.name}: {lastMsg.body}
          </Text>
        ) : (
          <Text style={styles.roomPreviewEmpty}>Aucun message</Text>
        )}
      </View>
      {(room.unreadCount ?? 0) > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{room.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function ChatScreen() {
  const { rooms, loading, error, refresh } = useChatRooms();

  return (
    <View style={styles.container}>
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="cloud-offline" size={48} color={Colors.textMuted} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RoomItem room={item} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
          contentContainerStyle={rooms.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color={Colors.textMuted} />
                <Text style={styles.emptyText}>Aucun canal de discussion</Text>
              </View>
            ) : null
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  roomItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomEmoji: {
    fontSize: 22,
  },
  roomContent: {
    flex: 1,
    gap: 2,
  },
  roomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  roomTime: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  roomPreview: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  roomPreviewEmpty: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#fff',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 76,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.md,
  },
});
