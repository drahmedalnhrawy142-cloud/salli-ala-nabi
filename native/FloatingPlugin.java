package com.sallialanabi.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;

import android.Manifest;
import android.os.Build;
import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** جسر بين صفحة التطبيق (الويب) والزرار العايم (أندرويد أصلي). */
@CapacitorPlugin(name = "FloatingButton")
public class FloatingPlugin extends Plugin {

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(FloatingService.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("permission", Settings.canDrawOverlays(getContext()));
        r.put("running", FloatingService.running != null);
        call.resolve(r);
    }

    @PluginMethod
    public void requestPermission(PluginCall call) {
        Intent i = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + getContext().getPackageName()));
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(i);
        call.resolve();
    }

    @PluginMethod
    public void start(PluginCall call) {
        if (!Settings.canDrawOverlays(getContext())) {
            call.reject("overlay permission missing");
            return;
        }
        String today = FloatingService.todayKey();
        prefs().edit()
                .putString("url", call.getString("url", ""))
                .putString("key", call.getString("key", ""))
                .putInt("goal", call.getInt("goal", 100))
                .putInt("today", call.getInt("today", 0))
                .putString("today_date", today)
                .putBoolean("haptic", call.getBoolean("haptic", true))
                .putBoolean("float_enabled", true)
                .apply();

        Intent i = new Intent(getContext(), FloatingService.class);
        ContextCompat.startForegroundService(getContext(), i);
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        prefs().edit().putBoolean("float_enabled", false).apply();
        getContext().stopService(new Intent(getContext(), FloatingService.class));
        call.resolve();
    }

    @PluginMethod
    public void setProgress(PluginCall call) {
        prefs().edit()
                .putInt("goal", call.getInt("goal", 100))
                .putInt("today", call.getInt("today", 0))
                .putString("today_date", FloatingService.todayKey())
                .apply();
        FloatingService s = FloatingService.running;
        if (s != null) s.refreshFromPrefs();
        call.resolve();
    }

    // ===== التذكيرات =====
    private SharedPreferences remPrefs() {
        return getContext().getSharedPreferences(ReminderReceiver.PREFS, Context.MODE_PRIVATE);
    }

    @PluginMethod
    public void reminderStatus(PluginCall call) {
        SharedPreferences p = remPrefs();
        JSObject r = new JSObject();
        r.put("enabled", p.getBoolean("enabled", false));
        r.put("startMin", p.getInt("start_min", 8 * 60));
        r.put("endMin", p.getInt("end_min", 22 * 60));
        r.put("intervalMin", p.getInt("interval_min", 120));
        r.put("permission", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        call.resolve(r);
    }

    @PluginMethod
    public void reminderRequestPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 33 && getActivity() != null) {
            ActivityCompat.requestPermissions(
                    getActivity(), new String[]{Manifest.permission.POST_NOTIFICATIONS}, 9001);
        }
        call.resolve();
    }

    @PluginMethod
    public void reminderSet(PluginCall call) {
        remPrefs().edit()
                .putBoolean("enabled", call.getBoolean("enabled", false))
                .putInt("start_min", call.getInt("startMin", 8 * 60))
                .putInt("end_min", call.getInt("endMin", 22 * 60))
                .putInt("interval_min", call.getInt("intervalMin", 120))
                .apply();
        ReminderReceiver.schedule(getContext());
        call.resolve();
    }

    @PluginMethod
    public void reminderTest(PluginCall call) {
        ReminderReceiver.show(getContext(), "اللهم صلِّ وسلِّم وبارك على سيدنا محمد ﷺ");
        call.resolve();
    }

    /** يرجّع عدد الصلوات اللي اتعملت من الزرار العايم ولسه التطبيق ماحسبهاش، ويصفّرها. */
    @PluginMethod
    public void getPending(PluginCall call) {
        SharedPreferences p = prefs();
        int count = p.getInt("pending_local", 0);
        if (count > 0) p.edit().putInt("pending_local", 0).apply();
        JSObject r = new JSObject();
        r.put("count", count);
        call.resolve(r);
    }
}
