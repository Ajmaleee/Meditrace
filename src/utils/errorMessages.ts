/**
 * Converts raw Firebase/Firestore error codes into human-readable messages.
 * Per the product brief: never show "FirebaseError: PERMISSION_DENIED" to a
 * user — translate it into something they can act on.
 */
export function toHumanReadableError(error: unknown): string {
  const code = extractErrorCode(error);

  switch (code) {
    case 'permission-denied':
      return 'You do not have permission to access this record.';
    case 'not-found':
      return 'The record you requested could not be found.';
    case 'unauthenticated':
      return 'Your session has expired. Please sign in again.';
    case 'unavailable':
      return 'MediTrace is temporarily unavailable. Check your connection and try again.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'The email or password you entered is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment before trying again.';
    case 'auth/network-request-failed':
      return 'A network error occurred. Check your connection and try again.';
    default:
      return 'Something went wrong. Please try again, and contact support if the problem continues.';
  }
}

function extractErrorCode(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return null;
}
