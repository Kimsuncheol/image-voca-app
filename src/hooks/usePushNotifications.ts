import { useEffect, useState } from 'react';
import { Notification, NotificationCompletion, Notifications } from 'react-native-notifications';

export interface PushNotificationState {
  deviceToken?: string;
  notification?: Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  const [deviceToken, setDeviceToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notification | undefined>();

  useEffect(() => {
    // Request permissions on iOS, refresh token on Android
    let registerListener: any;
    let registerFailedListener: any;
    let receivedForegroundListener: any;
    let openedListener: any;
    let receivedBackgroundListener: any;

    try {
      Notifications.registerRemoteNotifications();

      registerListener = Notifications.events().registerRemoteNotificationsRegistered((event) => {
        console.log("Device Token Received", event.deviceToken);
        setDeviceToken(event.deviceToken);
      });

      registerFailedListener = Notifications.events().registerRemoteNotificationsRegistrationFailed((event) => {
        console.error("Registration Failed", event);
      });

      receivedForegroundListener = Notifications.events().registerNotificationReceivedForeground((notification: Notification, completion: (response: NotificationCompletion) => void) => {
        console.log("Notification Received - Foreground", notification.payload);
        setNotification(notification);
        completion({alert: true, sound: true, badge: false});
      });

      openedListener = Notifications.events().registerNotificationOpened((notification: Notification, completion: () => void) => {
         console.log("Notification opened by device user", notification.payload);
         setNotification(notification);
         completion();
      });

      receivedBackgroundListener = Notifications.events().registerNotificationReceivedBackground((notification: Notification, completion: (response: any) => void) => {
        console.log("Notification Received - Background", notification.payload);
        completion({alert: true, sound: true, badge: false});
      });
    } catch (error) {
       console.warn("Failed to initialize push notifications. Ensure you have rebuilt the app with 'npx expo run:android' or 'npx expo run:ios' after installing react-native-notifications.", error);
    }

    return () => {
      registerListener?.remove();
      registerFailedListener?.remove();
      receivedForegroundListener?.remove();
      receivedBackgroundListener?.remove();
      openedListener?.remove();
    };
  }, []);

  return {
    deviceToken,
    notification,
  };
};
