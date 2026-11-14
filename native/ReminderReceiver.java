package com.sallialanabi.app;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import java.util.Calendar;

/** يعرض إشعار التذكير بالصلاة على النبي ﷺ ويجدول اللي بعده. */
public class ReminderReceiver extends BroadcastReceiver {

    public static final String PREFS = "salli_reminder";
    static final String CHANNEL_ID = "salli_reminder_v1";
    static final String ACTION = "com.sallialanabi.app.REMINDER";

    private static final String[] MESSAGES = {
            "اللهم صلِّ وسلِّم وبارك على سيدنا محمد ﷺ",
            "من صلّى عليّ صلاةً صلّى الله عليه بها عشرًا ﷺ",
            "صلِّ على النبي ﷺ، واجعل لسانك رطبًا بذكره",
            "أكثروا من الصلاة عليّ يوم الجمعة وليلة الجمعة ﷺ",
            "اللهم صلِّ على محمد وعلى آل محمد كما صلّيت على إبراهيم",
            "لحظة صلاة على الحبيب المصطفى ﷺ",
            "البخيل من ذُكرتُ عنده فلم يصلِّ عليّ ﷺ",
            "صلّى الله عليك يا رسول الله ﷺ",
    };

    @Override
    public void onReceive(Context ctx, Intent intent) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("enabled", false)) return;
        int idx = p.getInt("msg_index", 0);
        p.edit().putInt("msg_index", (idx + 1) % MESSAGES.length).apply();
        show(ctx, MESSAGES[idx % MESSAGES.length]);
        schedule(ctx);
    }

    /** إشعار فوري للتجربة. */
    public static void show(Context ctx, String text) {
        NotificationManager nm = (NotificationManager) ctx.getSystemService(Context.NOTIFICATION_SERVICE);
        Uri sound = Uri.parse("android.resource://" + ctx.getPackageName() + "/raw/salli_nasheed");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && nm != null) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "تذكير الصلاة على النبي ﷺ", NotificationManager.IMPORTANCE_HIGH);
            ch.setSound(sound, new AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build());
            ch.enableVibration(true);
            nm.createNotificationChannel(ch);
        }
        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent open = PendingIntent.getActivity(
                ctx, 7, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_salli)
                .setContentTitle("صلّي على النبي ﷺ")
                .setContentText(text)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(text))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setAutoCancel(true)
                .setContentIntent(open);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) b.setSound(sound);
        try {
            NotificationManagerCompat.from(ctx).notify(4101, b.build());
        } catch (SecurityException ignored) {
            // إذن الإشعارات مش ممنوح
        }
    }

    private static PendingIntent pending(Context ctx) {
        Intent i = new Intent(ctx, ReminderReceiver.class).setAction(ACTION);
        return PendingIntent.getBroadcast(
                ctx, 77, i, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
    }

    public static void cancel(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(pending(ctx));
    }

    /** يحسب أقرب ميعاد جاي حسب الفترة والفاصل ويجدوله. */
    public static void schedule(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        if (!p.getBoolean("enabled", false)) {
            cancel(ctx);
            return;
        }
        int start = p.getInt("start_min", 8 * 60);
        int end = p.getInt("end_min", 22 * 60);
        int step = Math.max(15, p.getInt("interval_min", 120));
        if (end < start) end += 1440;

        long now = System.currentTimeMillis() + 30_000L;
        long next = -1;
        for (int day = -1; day <= 2 && next < 0; day++) {
            Calendar base = Calendar.getInstance();
            base.set(Calendar.HOUR_OF_DAY, 0);
            base.set(Calendar.MINUTE, 0);
            base.set(Calendar.SECOND, 0);
            base.set(Calendar.MILLISECOND, 0);
            base.add(Calendar.DAY_OF_YEAR, day);
            for (int t = start; t <= end; t += step) {
                Calendar c = (Calendar) base.clone();
                c.add(Calendar.MINUTE, t);
                if (c.getTimeInMillis() > now) {
                    next = c.getTimeInMillis();
                    break;
                }
            }
        }
        if (next < 0) return;
        am.cancel(pending(ctx));
        am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending(ctx));
    }
}
