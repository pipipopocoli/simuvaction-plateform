import { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMessages } from '../../hooks/use-messages';
import { useAuth } from '../../lib/auth-context';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { ChatMessage } from '../../types';

function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (message.deletedAt) {
    return (
      <View style={[styles.bubble, styles.deletedBubble]}>
        <Text style={styles.deletedText}>Message supprimé</Text>
      </View>
    );
  }

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        {!isOwn && (
          <Text style={styles.senderName}>
            {message.sender.name}
            {message.sender.countryCode ? ` ${countryFlag(message.sender.countryCode)}` : ''}
          </Text>
        )}
        {message.replyTo && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyAuthor}>{message.replyTo.sender?.name}</Text>
            <Text style={styles.replyContent} numberOfLines={1}>
              {message.replyTo.body}
            </Text>
          </View>
        )}
        <Text style={[styles.messageText, isOwn ? styles.messageTextOwn : styles.messageTextOther]}>
          {message.body}
        </Text>
        <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>{time}</Text>
      </View>
    </View>
  );
}

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const codePoints = code
    .toUpperCase()
    .split('')
    .map(c => 0x1f1e6 - 65 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export default function ChatRoomScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const { user } = useAuth();
  const { messages, loading, hasMore, sendMessage, loadMore } = useMessages(roomId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    setText('');
    try {
      await sendMessage(content);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      setText(content); // Restore on error
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Chat', headerShown: true }} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isOwn={item.senderId === user?.id} />
          )}
          inverted
          contentContainerStyle={styles.messageList}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            loading ? <ActivityIndicator color={Colors.primary} style={{ padding: Spacing.lg }} /> : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyChat}>
                <Text style={styles.emptyChatText}>Commencez la conversation</Text>
              </View>
            ) : null
          }
        />

        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="Écrire un message..."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 3,
    justifyContent: 'flex-start',
  },
  messageRowOwn: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.lg,
  },
  bubbleOwn: {
    backgroundColor: Colors.bubbleSelf,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.bubbleOther,
    borderBottomLeftRadius: 4,
  },
  deletedBubble: {
    backgroundColor: Colors.bgElevated,
    opacity: 0.5,
  },
  deletedText: {
    color: Colors.textMuted,
    fontStyle: 'italic',
    fontSize: FontSize.sm,
  },
  senderName: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  replyPreview: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderLeftWidth: 2,
    borderLeftColor: Colors.primary,
    borderRadius: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    marginBottom: 4,
  },
  replyAuthor: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.primaryLight,
  },
  replyContent: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  messageText: {
    fontSize: FontSize.md,
    lineHeight: 21,
  },
  messageTextOwn: {
    color: Colors.bubbleSelfText,
  },
  messageTextOther: {
    color: Colors.bubbleOtherText,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.6)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    fontSize: FontSize.md,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
    transform: [{ scaleY: -1 }], // inverted list
  },
  emptyChatText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
  },
});
