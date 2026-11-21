package com.sallialanabi.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

/** تذكير يومي لطيف: لو لم يُذكر الله في التطبيق اليوم (آخر يوم يرسله التطبيق في garden_last) يظهر إشعار عتاب لطيف. */
public class GardenReceiver extends BroadcastReceiver {

    static final String ACTION = "com.sallialanabi.app.GARDEN";

    private static final String[] MSGS = {
            "بستانك اشتاق إليك… لم تذكر الله اليوم بعد. اغرس نخلة بتسبيحة.",
            "الورود في بستانك تنتظر من يسقيها بذكر الله. عُد إليه ولو بتسبيحات قليلة.",
            "أنهار بستانك هدأت قليلًا. كلمة طيبة تُجريها: سبحان الله وبحمده.",
            "أحب الأعمال إلى الله أدومها وإن قلّ. ابدأ الآن بتسبيحة في بستانك."
    };

    static String today() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (intent == null || !ACTION.equals(intent.getAction())) return;
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("garden_on", false)) return;
        String last = p.getString("garden_last", "");
        if (!today().equals(last)) {
            int i = Calendar.getInstance().get(Calendar.DAY_OF_YEAR) % MSGS.length;
            ReminderReceiver.show(ctx, "بستانك ينتظرك 🌴", MSGS[i], 4104);
        }
        scheduleAll(ctx);
    }

    private static PendingIntent pending(Context ctx) {
        Intent i = new Intent(ctx, GardenReceiver.class).setAction(ACTION);
        return PendingIntent.getBroadcast(ctx, 80, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    public static void scheduleAll(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        SharedPreferences p = ctx.getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
        PendingIntent pi = pending(ctx);
        am.cancel(pi);
        if (!p.getBoolean("garden_on", false)) return;
        int minute = p.getInt("garden_min", 20 * 60);
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 0);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        c.add(Calendar.MINUTE, minute);
        if (c.getTimeInMillis() <= System.currentTimeMillis() + 30_000L) c.add(Calendar.DAY_OF_YEAR, 1);
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), pi);
    }
}
