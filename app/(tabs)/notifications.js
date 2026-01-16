import { useSelector, useDispatch } from 'react-redux';
import { selectNotifications } from '../../store';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markAllRead } from '../../store/slices/notificationSlice';

export default function NotificationsScreen() {
  const { items, unread } = useSelector(selectNotifications);
  const dispatch = useDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={() => dispatch(markAllRead())}>
            <Text style={styles.mark}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.card, !item.read && styles.cardUnread]}>
            <Text style={styles.cardTitle}>{item.title || 'Notification'}</Text>
            {!!item.body && <Text style={styles.cardBody}>{item.body}</Text>}
            <Text style={styles.cardTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No notifications</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 16, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  mark: { color: '#4F46E5', fontWeight: '700' },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 12 },
  cardUnread: { borderWidth: 1, borderColor: '#DBEAFE' },
  cardTitle: { fontWeight: '800', color: '#111827' },
  cardBody: { color: '#374151', marginTop: 4 },
  cardTime: { color: '#6B7280', fontSize: 12, marginTop: 8 },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 40 },
});
