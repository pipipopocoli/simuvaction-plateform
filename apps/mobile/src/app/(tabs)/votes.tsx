import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiFetch } from '../../lib/api-client';
import { API_ENDPOINTS } from '../../constants/api';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import type { Vote, VoteOption } from '../../types';

function VoteCard({ vote, onRefresh }: { vote: Vote; onRefresh: () => void }) {
  const [casting, setCasting] = useState(false);
  const isOpen = vote.status === 'open' || vote.status === 'active';
  const canVote = isOpen && !vote.hasVoted;

  const handleCast = async (option: VoteOption) => {
    if (!canVote) return;

    Alert.alert(
      'Confirmer votre vote',
      `Voter pour "${option.label}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Voter',
          onPress: async () => {
            setCasting(true);
            try {
              await apiFetch(API_ENDPOINTS.castVote(vote.id), {
                method: 'POST',
                body: { optionId: option.id },
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onRefresh();
            } catch (err) {
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Vote échoué');
            } finally {
              setCasting(false);
            }
          },
        },
      ],
    );
  };

  const statusConfig: Record<string, { color: string; label: string; icon: 'create-outline' | 'radio-button-on' | 'lock-closed' | 'close-circle' }> = {
    draft: { color: Colors.textMuted, label: 'Brouillon', icon: 'create-outline' },
    open: { color: Colors.success, label: 'En cours', icon: 'radio-button-on' },
    active: { color: Colors.success, label: 'En cours', icon: 'radio-button-on' },
    closed: { color: Colors.warning, label: 'Terminé', icon: 'lock-closed' },
    cancelled: { color: Colors.error, label: 'Annulé', icon: 'close-circle' },
  };

  const status = statusConfig[vote.status];

  return (
    <View style={styles.voteCard}>
      <View style={styles.voteHeader}>
        <View style={styles.voteTitle}>
          <Text style={styles.voteName}>{vote.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: status.color + '20' }]}>
            <Ionicons name={status.icon} size={12} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
        </View>
        {vote.description && (
          <Text style={styles.voteDescription}>{vote.description}</Text>
        )}
        <View style={styles.voteMeta}>
          <Text style={styles.metaText}>
            {vote.visibility === 'secret' ? '🔒 Secret' : '👁️ Public'} • {vote.ballotMode === 'per_person' ? 'Par personne' : 'Par délégation'}
          </Text>
          {vote.totalVotes != null && (
            <Text style={styles.metaText}>{vote.totalVotes} vote{vote.totalVotes !== 1 ? 's' : ''}</Text>
          )}
        </View>
      </View>

      <View style={styles.optionsList}>
        {vote.options.map((opt) => {
          const total = vote.totalVotes || 1;
          const pct = opt.voteCount != null ? Math.round((opt.voteCount / total) * 100) : null;
          const showResults = vote.status === 'closed' || (vote.showLiveResults && vote.hasVoted);

          return (
            <TouchableOpacity
              key={opt.id}
              style={[styles.optionRow, canVote && styles.optionRowActive]}
              onPress={() => handleCast(opt)}
              disabled={!canVote || casting}
              activeOpacity={canVote ? 0.7 : 1}
            >
              {showResults && pct != null && (
                <View
                  style={[styles.optionBar, { width: `${pct}%` }]}
                />
              )}
              <Text style={styles.optionLabel}>{opt.label}</Text>
              {showResults && pct != null && (
                <Text style={styles.optionPct}>{pct}%</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {vote.hasVoted && (
        <View style={styles.votedBadge}>
          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
          <Text style={styles.votedText}>Vous avez voté</Text>
        </View>
      )}

      {casting && (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.sm }} />
      )}
    </View>
  );
}

export default function VotesScreen() {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    try {
      const data = await apiFetch<Vote[]>(API_ENDPOINTS.votes);
      setVotes(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const openVotes = votes.filter(v => v.status === 'open' || v.status === 'active');
  const closedVotes = votes.filter(v => v.status === 'closed');

  return (
    <View style={styles.container}>
      <FlatList
        data={[...openVotes, ...closedVotes]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VoteCard vote={item} onRefresh={fetchVotes} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchVotes} tintColor={Colors.primary} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={64} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Aucun vote en cours</Text>
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
  voteCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  voteHeader: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  voteTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  voteName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '600' },
  voteDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  voteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: { fontSize: FontSize.xs, color: Colors.textMuted },
  optionsList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    overflow: 'hidden',
    position: 'relative',
  },
  optionRowActive: {
    backgroundColor: Colors.bgElevated,
  },
  optionBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: Colors.primary + '15',
  },
  optionLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
    flex: 1,
    zIndex: 1,
  },
  optionPct: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
    zIndex: 1,
  },
  votedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.success + '10',
  },
  votedText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: 100,
  },
  emptyText: { fontSize: FontSize.md, color: Colors.textMuted },
});
