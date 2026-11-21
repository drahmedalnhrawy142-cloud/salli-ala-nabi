package com.sallialanabi.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;
import android.provider.Settings;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.util.Random;

/** يسجّل استقبال «فتح قفل الهاتف» ويعرض آية من المصحف (بترتيبها أو عشوائيًا). يحتاج إذن «العرض فوق التطبيقات». */
public class UnlockAyahService extends Service {

    static final String PREFS = "salli_unlock_ayah";
    static final String ACTION_STOP = "com.sallialanabi.app.UNLOCK_AYAH_STOP";
    private static final String CHANNEL = "salli_unlock_ayah";
    private static final int NID = 4105;
    private static final int TOTAL = 6236;
    static volatile boolean running;
    private long lastShown = 0;

    private final BroadcastReceiver unlock = new BroadcastReceiver() {
        @Override
        public void onReceive(Context ctx, Intent intent) {
            if (intent == null || !Intent.ACTION_USER_PRESENT.equals(intent.getAction())) return;
            SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            if (!p.getBoolean("on", false) || !Settings.canDrawOverlays(ctx)) return;
            long now = System.currentTimeMillis();
            if (now - lastShown < 8000) return;
            lastShown = now;
            boolean rnd = "rand".equals(p.getString("mode", "seq"));
            int i;
            if (rnd) i = new Random().nextInt(TOTAL);
            else {
                i = p.getInt("idx", 0) % TOTAL;
                p.edit().putInt("idx", (i + 1) % TOTAL).apply();
            }
            Intent a = new Intent(ctx, UnlockAyahActivity.class);
            a.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS | Intent.FLAG_ACTIVITY_NO_ANIMATION);
            a.putExtra("i", i);
            a.putExtra("rnd", rnd);
            try {
                ctx.startActivity(a);
            } catch (Exception ignored) {
            }
        }
    };

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putBoolean("on", false).apply();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }
        ServiceCompat.startForeground(this, NID, buildNotification(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        if (!running) {
            registerReceiver(unlock, new IntentFilter(Intent.ACTION_USER_PRESENT));
            running = true;
        }
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        if (running) {
            try {
                unregisterReceiver(unlock);
            } catch (Exception ignored) {
            }
            running = false;
        }
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, "آية عند فتح الهاتف", NotificationManager.IMPORTANCE_MIN);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(ch);
        }
        Intent stop = new Intent(this, UnlockAyahService.class).setAction(ACTION_STOP);
        PendingIntent stopIntent = PendingIntent.getService(this, 3, stop, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
        return new NotificationCompat.Builder(this, CHANNEL)
                .setSmallIcon(getApplicationInfo().icon)
                .setContentTitle("آية عند فتح الهاتف")
                .setContentText("تظهر لك آية كلما فتحت قفل الهاتف")
                .addAction(0, "إيقاف", stopIntent)
                .setOngoing(true)
                .build();
    }

    static void apply(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        Intent i = new Intent(ctx, UnlockAyahService.class);
        if (p.getBoolean("on", false) && Settings.canDrawOverlays(ctx)) {
            androidx.core.content.ContextCompat.startForegroundService(ctx, i);
        } else {
            ctx.stopService(i);
        }
    }
}
