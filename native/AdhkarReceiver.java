package com.sallialanabi.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.util.Calendar;

/** تذكير أذكار الصباح وأذكار المساء في وقت ثابت يحدده المستخدم. */
public class AdhkarReceiver extends BroadcastReceiver {

    static final String ACTION_M = "com.sallialanabi.app.ADHKAR_M";
    static final String ACTION_E = "com.sallialanabi.app.ADHKAR_E";

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String action = intent == null ? null : intent.getAction();
        boolean morning = ACTION_M.equals(action);
        boolean evening = ACTION_E.equals(action);
        if (!morning && !evening) return;
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        String key = morning ? "adhkar_m_on" : "adhkar_e_on";
        if (!p.getBoolean(key, false)) return;

        p.edit().putString("adhkar_pending", morning ? "m" : "e").apply();
        ReminderReceiver.show(
                ctx,
                morning ? "أذكار الصباح" : "أذكار المساء",
                morning
                        ? "ابدأ يومك بذكر الله والصلاة على نبيه ﷺ"
                        : "اختم يومك بذكر الله والصلاة على نبيه ﷺ",
                morning ? 4102 : 4103);
        scheduleAll(ctx);
    }

    private static PendingIntent pending(Context ctx, boolean morning) {
        Intent i = new Intent(ctx, AdhkarReceiver.class).setAction(morning ? ACTION_M : ACTION_E);
        return PendingIntent.getBroadcast(
                ctx, morning ? 78 : 79, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    private static void scheduleOne(Context ctx, AlarmManager am, SharedPreferences p, boolean morning) {
        String on = morning ? "adhkar_m_on" : "adhkar_e_on";
        String at = morning ? "adhkar_m_min" : "adhkar_e_min";
        PendingIntent pi = pending(ctx, morning);
        am.cancel(pi);
        if (!p.getBoolean(on, false)) return;
        int minute = p.getInt(at, morning ? 6 * 60 : 17 * 60);

        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.MINUTE, minute);
        if (c.getTimeInMillis() <= System.currentTimeMillis() + 30_000L) {
            c.add(Calendar.DAY_OF_YEAR, 1);
        }
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pi);
    }

    public static void scheduleAll(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        scheduleOne(ctx, am, p, true);
        scheduleOne(ctx, am, p, false);
    }
}
