self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    // non-JSON payload; fall back to defaults
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Habits", {
      body: data.body || "Time to check in your habits.",
      tag: "habit-reminder",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((windows) => {
      const existing = windows.find((w) => "focus" in w);
      return existing ? existing.focus() : self.clients.openWindow("/");
    }),
  );
});
