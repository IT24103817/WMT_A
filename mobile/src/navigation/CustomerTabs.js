import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import MarketplaceScreen from '../screens/marketplace/MarketplaceScreen';
import BiddingScreen from '../screens/bidding/BiddingScreen';
import LearningScreen from '../screens/learning/LearningScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import AccountScreen from '../screens/AccountScreen';
import CartScreen from '../screens/cart/CartScreen';
import { useCart } from '../context/CartContext';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const tabIcon = (ch) => ({ focused, color }) => (
  <View style={{
    alignItems: 'center', justifyContent: 'center', width: 44, height: 30,
    borderRadius: 15,
    backgroundColor: focused ? colors.primaryGlow : 'transparent',
  }}>
    <Text style={{ fontSize: 18, color }}>{ch}</Text>
  </View>
);

function CartTabIcon({ focused, color }) {
  const { count } = useCart();
  return (
    <View style={{
      alignItems: 'center', justifyContent: 'center', width: 44, height: 30,
      borderRadius: 15,
      backgroundColor: focused ? colors.primaryGlow : 'transparent',
    }}>
      <Text style={{ fontSize: 18, color }}>🛒</Text>
      {count > 0 ? (
        <View style={{
          position: 'absolute', top: -4, right: 4,
          minWidth: 18, height: 18, borderRadius: 9,
          backgroundColor: colors.primary,
          paddingHorizontal: 5,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function CustomerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.tabBorder,
          height: 64,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: -2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: tabIcon('⌂') }} />
      <Tab.Screen name="Market" component={MarketplaceScreen} options={{ tabBarIcon: tabIcon('💎') }} />
      <Tab.Screen name="Auctions" component={BiddingScreen} options={{ tabBarIcon: tabIcon('🔨') }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarIcon: CartTabIcon }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarIcon: tabIcon('📦') }} />
      <Tab.Screen name="Learn" component={LearningScreen} options={{ tabBarIcon: tabIcon('📚') }} />
      <Tab.Screen name="Account" component={AccountScreen} options={{ tabBarIcon: tabIcon('☺') }} />
    </Tab.Navigator>
  );
}
