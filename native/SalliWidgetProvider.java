package com.sallialanabi.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** ويدجت الشاشة الرئيسية: عدّاد اليوم وزرار "صلّيت". */
public class SalliWidgetProvider extends AppWidgetProvider {

    static final String ACTION_PRAY = "com.sallialanabi.app.WIDGET_PRAY";
    private static final Object LOCK = new Object();

    @Override
    public void onUpdate(Context ctx, AppWidgetManager mgr, int[] ids) {
        for (int id : ids) mgr.updateAppWidget(id, build(ctx));
    }

    @Override
    public void onReceive(final Context ctx, Intent intent) {
        if (intent != null && ACTION_PRAY.equals(intent.getAction())) {
            pray(ctx);
            final PendingResult pr = goAsync();
            new Thread(new Runnable() {
                @Override
                public void run() {
                    try {
                        flush(ctx);
                    } finally {
                        pr.finish();
                    }
                }
            }).start();
            return;
        }
        super.onReceive(ctx, intent);
    }

    public static void refreshAll(Context ctx) {
        try {
            AppWidgetManager mgr = AppWidgetManager.getInstance(ctx);
            int[] ids = mgr.getAppWidgetIds(new ComponentName(ctx, SalliWidgetProvider.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews rv = build(ctx);
            for (int id : ids) mgr.updateAppWidget(id, rv);
        } catch (Exception ignored) {
        }
    }

    private static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(FloatingService.PREFS, Context.MODE_PRIVATE);
    }

    private static RemoteViews build(Context ctx) {
        SharedPreferences p = prefs(ctx);
        int today = FloatingService.todayKey().equals(p.getString("today_date", ""))
                ? p.getInt("today", 0) : 0;
        int goal = p.getInt("goal", 100);

        RemoteViews rv = new RemoteViews(ctx.getPackageName(), R.layout.salli_widget);
        rv.setTextViewText(R.id.w_count, String.valueOf(today));
        rv.setTextViewText(R.id.w_goal, goal > 0 ? "من " + goal + " اليوم" : "صلاتك اليوم");

        Intent pray = new Intent(ctx, SalliWidgetProvider.class).setAction(ACTION_PRAY);
        rv.setOnClickPendingIntent(R.id.w_btn, PendingIntent.getBroadcast(
                ctx, 91, pray, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));

        Intent launch = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        if (launch != null) {
            PendingIntent open = PendingIntent.getActivity(
                    ctx, 92, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            rv.setOnClickPendingIntent(R.id.w_title, open);
            rv.setOnClickPendingIntent(R.id.w_count, open);
            rv.setOnClickPendingIntent(R.id.w_goal, open);
        }
        return rv;
    }

    private static void pray(Context ctx) {
        SharedPreferences p = prefs(ctx);
        synchronized (LOCK) {
            int today = FloatingService.todayKey().equals(p.getString("today_date", ""))
                    ? p.getInt("today", 0) : 0;
            p.edit()
                    .putInt("today", today + 1)
                    .putString("today_date", FloatingService.todayKey())
                    .putInt("pending_local", p.getInt("pending_local", 0) + 1)
                    .putInt("pending_global", p.getInt("pending_global", 0) + 1)
                    .apply();
        }
        refreshAll(ctx);
    }

    /** يبعت الصلوات اللي لسه ماتحسبتش في العدّاد العام. */
    private static void flush(Context ctx) {
        SharedPreferences p = prefs(ctx);
        String url = p.getString("url", "");
        String key = p.getString("key", "");
        if (url.isEmpty() || key.isEmpty()) return;
        if (url.endsWith("/")) url = url.substring(0, url.length() - 1);
        while (p.getInt("pending_global", 0) > 0) {
            if (!post(url, key)) break;
            synchronized (LOCK) {
                int left = p.getInt("pending_global", 0) - 1;
                p.edit().putInt("pending_global", Math.max(0, left)).apply();
            }
        }
    }

    private static boolean post(String baseUrl, String key) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(baseUrl + "/rest/v1/rpc/increment_prayer_count").openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(8000);
            c.setReadTimeout(8000);
            c.setDoOutput(true);
            c.setRequestProperty("apikey", key);
            c.setRequestProperty("Authorization", "Bearer " + key);
            c.setRequestProperty("Content-Type", "application/json");
            OutputStream out = c.getOutputStream();
            out.write("{}".getBytes("UTF-8"));
            out.close();
            int code = c.getResponseCode();
            InputStream in = code >= 400 ? c.getErrorStream() : c.getInputStream();
            if (in != null) {
                byte[] buf = new byte[256];
                while (in.read(buf) != -1) { /* نستهلك الرد */ }
                in.close();
            }
            return code >= 200 && code < 300;
        } catch (Exception e) {
            return false;
        } finally {
            if (c != null) c.disconnect();
        }
    }
}
