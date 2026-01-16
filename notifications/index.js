import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { setPushToken, addNotification } from '../store/slices/notificationSlice';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync(dispatch) {
  let status;
  const settings = await Notifications.getPermissionsAsync();
  status = settings.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData?.data;
  if (token) dispatch(setPushToken(token));
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default', importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return token;
}

export function attachNotificationListeners(dispatch) {
  const subReceived = Notifications.addNotificationReceivedListener((n) => {
    const { title, body, data } = n.request?.content || {};
    dispatch(addNotification({ title: title || 'Notification', body: body || '', data }));
  });
  const subResponse = Notifications.addNotificationResponseReceivedListener((response) => {
    const { notification } = response;
    const { title, body, data } = notification.request?.content || {};
    dispatch(addNotification({ title: title || 'Notification', body: body || '', data }));
  });
  return () => {
    subReceived.remove();
    subResponse.remove();
  };
}
