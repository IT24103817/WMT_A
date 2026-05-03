import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import AdminInventoryScreen from '../screens/inventory/AdminInventoryScreen';
import AdminListingsScreen from '../screens/marketplace/AdminListingsScreen';
import AdminOffersScreen from '../screens/offers/AdminOffersScreen';
import AdminBidsScreen from '../screens/bidding/AdminBidsScreen';
import AdminArticlesScreen from '../screens/learning/AdminArticlesScreen';
import AdminOrdersScreen from '../screens/orders/AdminOrdersScreen';
import AdminReviewsScreen from '../screens/reviews/AdminReviewsScreen';
import AdminPaymentsScreen from '../screens/payment/AdminPaymentsScreen';
import AccountScreen from '../screens/AccountScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const tabIcon = (ch) => ({ focused, color }) => (
  <View style={{
    alignItems: 'center', justifyContent: 'center', width: 38, height: 28,
    borderRadius: 14,
    backgroundColor: focused ? colors.primaryGlow : 'transparent',
  }}>
    <Text style={{ fontSize: 15, color }}>{ch}</Text>
  </View>
);

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.tabBorder,
          height: 66,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '600', marginTop: -2 },
        tabBarItemStyle: { paddingHorizontal: 0 },
      }}
    >
      <Tab.Screen name="Inventory" component={AdminInventoryScreen} options={{ tabBarIcon: tabIcon('💎') }} />
      <Tab.Screen name="Listings" component={AdminListingsScreen} options={{ tabBarIcon: tabIcon('🛒') }} />
      <Tab.Screen name="Offers" component={AdminOffersScreen} options={{ tabBarIcon: tabIcon('💬') }} />
      <Tab.Screen name="Bids" component={AdminBidsScreen} options={{ tabBarIcon: tabIcon('🔨') }} />
      <Tab.Screen name="Articles" component={AdminArticlesScreen} options={{ tabBarIcon: tabIcon('📚') }} />
      <Tab.Screen name="Orders" component={AdminOrdersScreen} options={{ tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Reviews" component={AdminReviewsScreen} options={{ tabBarIcon: tabIcon('⭐') }} />
      <Tab.Screen name="Pay" component={AdminPaymentsScreen} options={{ tabBarLabel: 'Pay', tabBarIcon: tabIcon('💳') }} />
      <Tab.Screen name="Me" component={AccountScreen} options={{ tabBarIcon: tabIcon('☺') }} />
    </Tab.Navigator>
  );
}
