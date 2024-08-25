import webpush from 'web-push';

const vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY
}

webpush.setVapidDetails(
    'https://creamynuts.oneminus.in',
    vapidKeys.publicKey,
    vapidKeys.privateKey
)

export const options = {
    headers: {
      Authorization: `key=${process.env.AUTH_KEY}`
    }
};
  