package com.sallialanabi.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/** تذكير بالصلاة على النبي ﷺ بعد كل صلاة. الأوقات بتجيلها من صفحة التطبيق (قائمة "وقت|اسم"). */
public class PrayerAfterReceiver extends BroadcastReceiver {

    static final String ACTION = "com.sallialanabi.app.PRAYER_AFTER";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !ACTION.equals(intent.getAction())) return;
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        if (p.getBoolean("pa_on", false)) {
            String name = intent.getStringExtra("name");
            if (name == null) name = "";
            ReminderReceiver.show(
                    ctx,
                    "بعد صلاة " + name,
                    "اختم صلاتك بالصلاة على نبيك ﷺ",
                    4104);
        }
        scheduleNext(ctx);
    }

    private static PendingIntent pending(Context ctx, String name) {
        Intent i = new Intent(ctx, PrayerAfterReceiver.class).setAction(ACTION);
        i.putExtra("name", name);
        return PendingIntent.getBroadcast(
                ctx, 80, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    /** يجدول أقرب وقت جاي من القائمة المحفوظة. */
    public static void scheduleNext(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        am.cancel(pending(ctx, ""));
        if (!p.getBoolean("pa_on", false)) return;
        String list = p.getString("pa_list", "");
        long now = System.currentTimeMillis() + 5_000L;
        long best = Long.MAX_VALUE;
        String bestName = "";
        for (String item : list.split(";")) {
            String[] kv = item.split("\\|");
            if (kv.length < 2) continue;
            try {
                long t = Long.parseLong(kv[0]);
                if (t > now && t < best) {
                    best = t;
                    bestName = kv[1];
                }
            } catch (NumberFormatException ignored) {
            }
        }
        if (best == Long.MAX_VALUE) return;
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, best, pending(ctx, bestName));
    }
}
