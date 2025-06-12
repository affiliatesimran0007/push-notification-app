# URGENT: Fix VAPID Key Mismatch

## The Problem
The VAPID keys are mismatched:
- Frontend uses: `BNV70f-uHInqVEOT9r2d6pVfK5WViCXdtoYjB87Nf8WUQZ6mDMSXEXGFQmJXl6bvGpvzL2jVSuPZUk-S9YS8rYc`
- Backend private key `Zth0A2DNkp9pBcmN_kwmyucFZU0Tqk3pbV-0CQ0RZqw` doesn't match this public key
- Error: "permission denied: invalid JWT provided"

## The Solution
Update Vercel with the ORIGINAL matching key pair from .env.local:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGv2Vm45eFGslcXFhakD-euIXAnOg6-bdqVWHoSw4gwvjvYYV1zBA_Q7uiNij5yvRqMwmDhpBYYSA1v5Z_GEv_k
VAPID_PRIVATE_KEY=g4-CwbusGW_nqMF30Bo2OfejBoVzTLZkM1PZ-YF0w98
VAPID_SUBJECT=mailto:admin@push-notification-app.com
```

## Steps to Fix:
1. Go to Vercel Dashboard
2. Update these environment variables with the values above
3. Redeploy

## Important Note:
This will require users to re-subscribe because the public key will change. All existing subscriptions with the old key will no longer work.

## Alternative (Not Recommended):
If you have many active users, you would need to find the original private key for `BNV70f...`. However, this key was never saved in the repository.