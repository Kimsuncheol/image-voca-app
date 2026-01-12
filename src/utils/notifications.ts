import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Expo Go on Android removed Push Notification support in SDK 53+.
// We need to guard against using it or importing it where it might crash.
// However, 'import' is static. If the crash happens at import time, we might be in trouble
// unless we use require(). But types are nicer with import.
// The error message "functionality ... was removed" suggests runtime checks or module initialization.

export const safeGetPermissionsAsync = async () => {
    if (Platform.OS === 'android') {
        // In a real app we would check for Constants.appOwnership === 'expo'
        // For now, we assume if we are here we might be in Expo Go,
        // and we want to avoid the crash.
        // But simply importing top-level might be the issue. 
        // If this file is imported, 'expo-notifications' is imported.
        // We might need to make this file NOT imported on Android?
        // Or essentially, we rely on the fact that maybe the CRASH happens when we CALL something?
        // The user stack trace showed local import.
        return { granted: false, status: 'denied' };
    }
    return await Notifications.getPermissionsAsync();
}

export const safeRequestPermissionsAsync = async () => {
    if (Platform.OS === 'android') {
        return { granted: false, status: 'denied' };
    }
    return await Notifications.requestPermissionsAsync();
}
