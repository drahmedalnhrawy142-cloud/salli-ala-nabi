package com.sallialanabi.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

/** إشعارات مجدولة بمواعيد يرسلها التطبيق (أيام الفضل، دخول وقت الصلاة). كل مجموعة قائمة مستقلة (≤ 60 موعدًا). */
public class EventReceiver extends BroadcastReceiver {

    static final String ACTION = "com.sallialanabi.app.EVENT";
    static final String[] GROUPS = {"virtue", "adhan"};
    private static final int BASE = 9000;
    private static final int MAX = 60;

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !ACTION.equals(intent.getAction())) return;
        String title = intent.getStringExtra("title");
        String text = intent.getStringExtra("text");
        int id = intent.getIntExtra("nid", 4300);
        if (title != null && text != null) ReminderReceiver.show(ctx, title, text, id);
    }

    private static PendingIntent pending(Context ctx, int code, String title, String text, int nid) {
        Intent i = new Intent(ctx, EventReceiver.class).setAction(ACTION);
        i.putExtra("title", title);
        i.putExtra("text", text);
        i.putExtra("nid", nid);
        return PendingIntent.getBroadcast(ctx, code, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    public static void set(Context ctx, String group, JSONArray items) {
        SharedPreferences.Editor e = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE).edit();
        e.putString("ev_" + group, items == null ? "[]" : items.toString());
        e.apply();
        scheduleGroup(ctx, group);
    }

    public static void scheduleAll(Context ctx) {
        for (String g : GROUPS) scheduleGroup(ctx, g);
    }

    private static void scheduleGroup(Context ctx, String group) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        int gi = 0;
        for (int k = 0; k < GROUPS.length; k++) if (GROUPS[k].equals(group)) gi = k;
        int base = BASE + gi * 100;
        for (int k = 0; k < MAX; k++) am.cancel(pending(ctx, base + k, "", "", 0));
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis() + 3_000L;
        boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
        try {
            JSONArray a = new JSONArray(p.getString("ev_" + group, "[]"));
            for (int k = 0; k < a.length() && k < MAX; k++) {
                JSONObject o = a.getJSONObject(k);
                long at = o.getLong("at");
                if (at <= now) continue;
                PendingIntent pi = pending(ctx, base + k, o.optString("title", ""), o.optString("text", ""), 4300 + gi * 100 + k);
                try {
                    if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                    else am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                } catch (SecurityException se) {
                    am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
                }
            }
        } catch (Exception ignored) {
        }
    }
}
