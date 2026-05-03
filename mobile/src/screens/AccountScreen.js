import { Text, View, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { colors, type } from '../theme';

export default function AccountScreen({ navigation }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  const initials = (user?.name || '?')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen scroll>
      <Text style={styles.h1}>Account</Text>

      <Animated.View entering={FadeInDown.duration(360).springify().damping(18)}>
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{user?.name}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                <Badge label={isAdmin ? 'Admin' : 'Customer'} variant={isAdmin ? 'primary' : 'info'} />
              </View>
            </View>
          </View>
        </Card>
      </Animated.View>

      {!isAdmin && (
        <>
          <Text style={styles.section}>Activity</Text>
          <MenuRow icon="💬" label="My Offers" hint="Track pending and accepted offers" onPress={() => navigation.navigate('MyOffers')} />
          <MenuRow icon="⭐" label="My Reviews" hint="Edit or delete reviews you've left" onPress={() => navigation.navigate('MyReviews')} />
          <MenuRow icon="🏛️" label="Visit the Atelier" hint="See aggregate seller rating" onPress={() => navigation.navigate('SellerProfile')} />
        </>
      )}

      <Text style={styles.section}>Account</Text>
      <Card>
        <Row label="Member since" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'} />
      </Card>

      <View style={{ height: 16 }} />
      <Button title="Log out" variant="outline" onPress={logout} />
    </Screen>
  );
}

function MenuRow({ icon, label, hint, onPress }) {
  return (
    <Card onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={styles.menuIcon}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.menuLabel}>{label}</Text>
          <Text style={styles.menuHint}>{hint}</Text>
        </View>
        <Text style={styles.chev}>›</Text>
      </View>
    </Card>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.textDim, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { ...type.display, color: colors.text, marginBottom: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  name: { color: colors.text, fontSize: 18, fontWeight: '700' },
  email: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  section: { ...type.h3, color: colors.text, marginTop: 24, marginBottom: 12 },
  menuIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center',
  },
  menuLabel: { color: colors.text, fontSize: 15, fontWeight: '600' },
  menuHint: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  chev: { color: colors.textMuted, fontSize: 24, fontWeight: '300' },
});
