# Account Deletion Testing Guide

This guide explains how to test the account deletion functionality to ensure all user data is properly removed.

## What Gets Deleted

When a user deletes their account, the following data should be removed:

1. **Firebase Authentication Account** - The user's auth account
2. **Firestore Document** - User document at `users/{uid}` including:
   - uid, displayName, email
   - role (admin/user)
   - photoURL
   - wordBank
   - recentCourse
   - subscription data
   - createdAt timestamp
3. **Storage Files** - Profile image at `profile_images/{uid}`

## Testing Steps

### Before Deletion Test

1. **Create a test account** or use an existing account
2. **Navigate to Profile screen**
3. **Click "Check Data Status" button** in the Testing & Debug section
4. **Verify the console output shows**:
   ```
   Firestore document: EXISTS
   Storage profile image: EXISTS (or NOT FOUND if no image uploaded)
   ```
5. **Note the user ID** from console logs for verification

### Perform Account Deletion

1. **Scroll to Account Actions section**
2. **Click "Delete Account" button**
3. **Confirm deletion** in the alert dialog
4. **Watch console logs** for detailed deletion process:
   ```
   🗑️ Starting account deletion process...
   🔄 Step 1: Cleaning up user data...
   🧹 Starting cleanup for user: {userId}
   📸 Step 1: Attempting to delete profile image...
   ✅ Profile image deleted from Storage
   📄 Step 2: Attempting to delete Firestore document...
   ✅ User document deleted from Firestore
   🎉 Cleanup completed successfully for user: {userId}
   🔄 Step 2: Deleting Firebase Auth user...
   ✅ Firebase Auth user deleted successfully
   🚪 Account deletion complete, redirecting to login...
   ```

### After Deletion Verification

Since the user account is deleted, you'll need to verify from another admin account or Firebase Console:

**Option 1: Firebase Console (Recommended)**
1. Open Firebase Console
2. Go to **Firestore Database**
3. Check `users` collection - the user document should NOT exist
4. Go to **Storage**
5. Check `profile_images` folder - the user's image should NOT exist
6. Go to **Authentication**
7. The user should NOT appear in the users list

**Option 2: Using Test Utility (from another admin account)**
```typescript
import { testAccountDeletion } from '@/src/utils/testAccountDeletion';

// Call this after deletion with the deleted user's ID
await testAccountDeletion('deleted-user-id');
```

This will output:
```
============================================================
🧪 STARTING ACCOUNT DELETION TEST
============================================================
User ID: deleted-user-id
Timestamp: 2024-XX-XXTXX:XX:XX.XXXZ
============================================================

🔍 Starting verification for user: deleted-user-id
✅ Firestore document successfully deleted
✅ Storage profile image deleted or never existed

============================================================
📋 TEST RESULTS:
============================================================
✅ Firestore document: DELETED
✅ Storage profile image: DELETED (or never existed)
============================================================
🎉 TEST PASSED: All user data successfully deleted!
============================================================
```

## Re-authentication Flow Test

If the user signed in more than 5 minutes ago, they'll need to re-authenticate:

1. **Click "Delete Account"**
2. **Confirm deletion**
3. **Error appears**: "For security reasons, please confirm your password"
4. **Password input appears**
5. **Enter password** and click "Confirm"
6. **Watch console logs**:
   ```
   🔐 Starting re-authentication and deletion process...
   🔑 Step 1: Re-authenticating user...
   ✅ Re-authentication successful
   🔄 Step 2: Cleaning up user data...
   [cleanup logs...]
   🔄 Step 3: Deleting Firebase Auth user...
   ✅ Firebase Auth user deleted successfully
   🚪 Account deletion complete, redirecting to login...
   ```

## Expected Results

### ✅ Success Indicators
- All console logs show ✅ success markers
- User is redirected to login screen
- Firestore document is deleted
- Storage image is deleted (if existed)
- Auth account is removed
- No error alerts appear

### ❌ Failure Indicators
- Console shows ❌ error markers
- Error alert appears with message
- User data still exists in Firebase Console
- User remains on profile screen
- "Check Data Status" shows data still exists

## Common Issues

### Issue: "Requires recent login" error
**Solution**: This is expected behavior. Re-authenticate by entering password when prompted.

### Issue: Storage deletion fails with permission error
**Solution**: Check Firebase Storage security rules. Admin users should have delete permissions.

### Issue: Firestore deletion fails
**Solution**: Check Firestore security rules. Users should be able to delete their own document.

### Issue: Auth deletion succeeds but data remains
**Solution**: This was the original bug! Make sure you're using the updated code with `cleanupUserData()` function.

## Security Rules Required

**Firestore Security Rules:**
```javascript
match /users/{userId} {
  // Allow users to delete their own document
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

**Storage Security Rules:**
```javascript
match /profile_images/{userId} {
  // Allow users to delete their own profile image
  allow delete: if request.auth != null && request.auth.uid == userId;
}
```

## Automated Testing

For automated testing, you can use the test utility functions:

```typescript
import {
  checkUserDataExists,
  testAccountDeletion,
  verifyUserDataDeleted
} from '@/src/utils/testAccountDeletion';

// Before deletion
const before = await checkUserDataExists(userId);
console.log('Before:', before);

// Perform deletion
await cleanupUserData(userId);
await deleteUser(user);

// After deletion (run from admin account)
const after = await verifyUserDataDeleted(userId);
console.log('After:', after);

// Full test
await testAccountDeletion(userId);
```

## Console Log Legend

- 🗑️ Starting deletion
- 🧹 Starting cleanup
- 📸 Profile image operation
- 📄 Firestore operation
- 🔄 General step
- 🔑 Authentication step
- ✅ Success
- ❌ Error
- ⚠️ Warning
- ℹ️ Info
- 🎉 Completion
- 🚪 Redirect
- 🧪 Testing
- 🔍 Verification
- 📋 Results
- 👤 User info
- 🔐 Security
