import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import CustomerTabs from './CustomerTabs';
import AdminTabs from './AdminTabs';
import GemDetailScreen from '../screens/marketplace/GemDetailScreen';
import MakeOfferScreen from '../screens/marketplace/MakeOfferScreen';
import BidDetailScreen from '../screens/bidding/BidDetailScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import ReviewScreen from '../screens/orders/ReviewScreen';
import ArticleDetailScreen from '../screens/learning/ArticleDetailScreen';
import PaymentScreen from '../screens/payment/PaymentScreen';
import InventoryFormScreen from '../screens/inventory/InventoryFormScreen';
import ArticleFormScreen from '../screens/learning/ArticleFormScreen';
import ListingFormScreen from '../screens/marketplace/ListingFormScreen';
import BidFormScreen from '../screens/bidding/BidFormScreen';
import CustomerOffersScreen from '../screens/offers/CustomerOffersScreen';
import SellerProfileScreen from '../screens/SellerProfileScreen';
import AdminOrderUpdateScreen from '../screens/orders/AdminOrderUpdateScreen';
import MyReviewsScreen from '../screens/reviews/MyReviewsScreen';
import EditReviewScreen from '../screens/reviews/EditReviewScreen';
import CheckoutScreen from '../screens/cart/CheckoutScreen';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.bg },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '700' },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.bg },
  animation: 'slide_from_right',
};

export default function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Sign up' }} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={user.role === 'admin' ? AdminTabs : CustomerTabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="GemDetail" component={GemDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="MakeOffer" component={MakeOfferScreen} options={{ title: 'Make an Offer' }} />
      <Stack.Screen name="BidDetail" component={BidDetailScreen} options={{ title: 'Auction' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
      <Stack.Screen name="Review" component={ReviewScreen} options={{ title: 'Leave a review' }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} options={{ title: '' }} />
      <Stack.Screen name="Payment" component={PaymentScreen} options={{ title: 'Payment', presentation: 'modal' }} />
      <Stack.Screen name="InventoryForm" component={InventoryFormScreen} options={{ title: 'Gem' }} />
      <Stack.Screen name="ArticleForm" component={ArticleFormScreen} options={{ title: 'Article' }} />
      <Stack.Screen name="ListingForm" component={ListingFormScreen} options={{ title: 'Listing' }} />
      <Stack.Screen name="BidForm" component={BidFormScreen} options={{ title: 'New Auction' }} />
      <Stack.Screen name="MyOffers" component={CustomerOffersScreen} options={{ title: 'My Offers' }} />
      <Stack.Screen name="SellerProfile" component={SellerProfileScreen} options={{ title: 'GemMarket Atelier' }} />
      <Stack.Screen name="AdminOrderUpdate" component={AdminOrderUpdateScreen} options={{ title: 'Update Order' }} />
      <Stack.Screen name="MyReviews" component={MyReviewsScreen} options={{ title: 'My Reviews' }} />
      <Stack.Screen name="EditReview" component={EditReviewScreen} options={{ title: 'Edit review' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout' }} />
    </Stack.Navigator>
  );
}
