/*
 * 梅園ポータル v2.1-3 Push通知受信用 Service Worker
 * - Firebase Cloud Messaging 受信専用。
 * - HTML / CSS / JavaScript / 画像のオフラインキャッシュは行わない。
 * - fetch イベントは登録しない。
 * - data-onlyメッセージはここで通知表示し、notice_id付きURLへ遷移する。
 */

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const notificationData = event.notification && event.notification.data
    ? event.notification.data
    : {};

  const noticeId = String(notificationData.notice_id || notificationData.noticeId || "").trim();
  const fallbackUrl = noticeId
    ? "https://umezono-systems.github.io/umezono-portal/?notice_id=" + encodeURIComponent(noticeId)
    : "https://umezono-systems.github.io/umezono-portal/";
  const targetUrl = String(notificationData.link || fallbackUrl);

  event.waitUntil(
    self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function (clientList) {
      for (let index = 0; index < clientList.length; index += 1) {
        const client = clientList[index];

        try {
          const clientUrl = new URL(client.url);
          const destinationUrl = new URL(targetUrl, self.location.origin);

          if (
            clientUrl.origin === destinationUrl.origin &&
            clientUrl.pathname === destinationUrl.pathname
          ) {
            return client.focus().then(function () {
              return client.navigate(destinationUrl.href);
            });
          }
        } catch (error) {
          // URL比較に失敗した場合は次のクライアントを確認する。
        }
      }

      return self.clients.openWindow(targetUrl);
    })
  );
});

importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.16.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAAXuQZKjuJ79Bxcu1hSpikpua6IKGf0jg",
  authDomain: "umezono-portal.firebaseapp.com",
  projectId: "umezono-portal",
  storageBucket: "umezono-portal.firebasestorage.app",
  messagingSenderId: "450417119881",
  appId: "1:450417119881:web:f4270279600577376dec58",
  measurementId: "G-8CHX343MXR"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  // notificationペイロードがある場合はFCM側の自動表示に任せる。
  if (payload && payload.notification) {
    return;
  }

  const data = payload && payload.data ? payload.data : {};
  const noticeId = String(data.notice_id || data.noticeId || "").trim();
  const title = String(data.title || "梅園ポータル");
  const body = String(data.body || "重要掲示が更新されました。");
  const link = String(
    data.link ||
    (noticeId
      ? "https://umezono-systems.github.io/umezono-portal/?notice_id=" + encodeURIComponent(noticeId)
      : "https://umezono-systems.github.io/umezono-portal/")
  );

  return self.registration.showNotification(title, {
    body: body,
    icon: "https://umezono-systems.github.io/umezono-app-assets/favicon_portal.png",
    badge: "https://umezono-systems.github.io/umezono-app-assets/favicon_portal.png",
    tag: noticeId ? "umezono-important-" + noticeId : "umezono-important",
    renotify: true,
    data: {
      link: link,
      notice_id: noticeId
    }
  });
});
