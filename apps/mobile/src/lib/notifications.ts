import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { apiFetch } from './api-client';
import { API_ENDPOINTS } from '../constants/api';

// Configure how notifications are displayed when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.HIGH,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('simuvaction', {
      name: 'SimuVaction',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#009EDB',
      sound: 'default',
    });
  }

  // Check/request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // Will use the projectId from app.json
  });

  const token = tokenData.data;

  // Register token with backend
  try {
    await apiFetch(API_ENDPOINTS.registerDevice, {
      method: 'POST',
      body: {
        token,
        platform: Platform.OS,
        deviceName: Device.deviceName || `${Device.brand} ${Device.modelName}`,
      },
    });
  } catch (error) {
    console.error('Failed to register device token:', error);
  }

  return token;
}

export function setupNotificationListeners() {
  // Handle notification tap (app was in background/killed)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;

      if (data?.deepLink && typeof data.deepLink === 'string') {
        // Navigate to the deep link target
        router.push(data.deepLink as never);
      } else if (data?.channelId) {
        router.push(`/chat/${data.channelId}` as never);
      } else if (data?.voteId) {
        router.push('/(tabs)/votes' as never);
      }
    },
  );

  // Handle notification received while app is in foreground
  const notificationSubscription = Notifications.addNotificationReceivedListener(
    (_notification) => {
      // Could update badge count or show in-app notification
    },
  );

  return () => {
    responseSubscription.remove();
    notificationSubscription.remove();
  };
}
