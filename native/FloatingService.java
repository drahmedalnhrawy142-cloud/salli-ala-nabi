package com.sallialanabi.app;

import android.animation.ValueAnimator;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.WindowManager;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;
import androidx.core.app.ServiceCompat;

import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * الأيقونة العايمة: زرار دايري بصورة اللوحة الذهبية فوق كل التطبيقات.
 * كل دوسة = صلاة واحدة على النبي ﷺ، وتتحسب في العدّاد العام وفي عدّاد التطبيق.
 */
public class FloatingService extends Service {

    static final String PREFS = "salli_float";
    static final String ACTION_STOP = "com.sallialanabi.app.FLOAT_STOP";
    private static final String CHANNEL_ID = "salli_float_channel";
    private static final int NOTIFICATION_ID = 4101;
    private static final Object LOCK = new Object();

    /** نسخة الخدمة الشغالة حاليًا (عشان الـ Plugin يحدّث الحلقة). */
    static volatile FloatingService running;

    private WindowManager wm;
    private SharedPreferences prefs;
    private BubbleView bubble;
    private WindowManager.LayoutParams bubbleParams;
    private TextView closeTarget;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final ExecutorService network = Executors.newSingleThreadExecutor();
    private final Runnable fadeTask = new Runnable() {
        @Override
        public void run() {
            if (bubble != null) bubble.animate().alpha(0.5f).setDuration(400).start();
        }
    };

    // ---------------------------------------------------------------- lifecycle

    @Override
    public void onCreate() {
        super.onCreate();
        running = this;
        wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            prefs.edit().putBoolean("float_enabled", false).apply();
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                buildNotification(),
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);

        if (!Settings.canDrawOverlays(this)) {
            stopForeground(true);
            stopSelf();
            return START_NOT_STICKY;
        }

        if (bubble == null) showBubble();
        flushGlobal();
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        removeView(bubble);
        removeView(closeTarget);
        bubble = null;
        closeTarget = null;
        network.shutdown();
        running = null;
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // ------------------------------------------------------------- notification

    private Notification buildNotification() {
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID, "زرار الصلاة على النبي ﷺ", NotificationManager.IMPORTANCE_LOW);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) nm.createNotificationChannel(channel);
        }

        Intent stop = new Intent(this, FloatingService.class).setAction(ACTION_STOP);
        PendingIntent stopIntent = PendingIntent.getService(
                this, 1, stop, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Intent launch = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent openIntent = PendingIntent.getActivity(
                this, 2, launch, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        return new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(getApplicationInfo().icon)
                .setContentTitle("صلّي على النبي ﷺ")
                .setContentText("الزرار العايم شغّال")
                .setContentIntent(openIntent)
                .addAction(0, "إيقاف", stopIntent)
                .setOngoing(true)
                .build();
    }

    // ------------------------------------------------------------------ bubble

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(
                TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private int screenW() {
        return getResources().getDisplayMetrics().widthPixels;
    }

    private int screenH() {
        return getResources().getDisplayMetrics().heightPixels;
    }

    private WindowManager.LayoutParams newParams(int w, int h, boolean touchable) {
        int flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS;
        if (!touchable) flags |= WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                w, h,
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
                flags,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.TOP | Gravity.START;
        return lp;
    }

    private void showBubble() {
        int size = dp(64);
        bubble = new BubbleView(this);
        bubbleParams = newParams(size, size, true);
        bubbleParams.x = prefs.getInt("pos_x", screenW() - size);
        bubbleParams.y = prefs.getInt("pos_y", screenH() / 3);
        bubble.setOnTouchListener(new DragListener());
        refreshFromPrefs();
        wm.addView(bubble, bubbleParams);
        scheduleFade();
    }

    /** تحديث الحلقة من القيم المحفوظة (بيندهي الـ Plugin بعد ما التطبيق يحدّث الهدف). */
    void refreshFromPrefs() {
        handler.post(new Runnable() {
            @Override
            public void run() {
                if (bubble == null) return;
                bubble.setProgress(readToday(), prefs.getInt("goal", 100));
            }
        });
    }

    private void scheduleFade() {
        handler.removeCallbacks(fadeTask);
        handler.postDelayed(fadeTask, 3000);
    }

    private void removeView(View v) {
        if (v == null) return;
        try {
            wm.removeView(v);
        } catch (Exception ignored) {
        }
    }

    // -------------------------------------------------------------------- touch

    private class DragListener implements View.OnTouchListener {
        private float downX, downY;
        private int startX, startY;
        private boolean dragging;
        private final int slop = ViewConfiguration.get(FloatingService.this).getScaledTouchSlop();

        @Override
        public boolean onTouch(View v, MotionEvent e) {
            switch (e.getActionMasked()) {
                case MotionEvent.ACTION_DOWN:
                    downX = e.getRawX();
                    downY = e.getRawY();
                    startX = bubbleParams.x;
                    startY = bubbleParams.y;
                    dragging = false;
                    handler.removeCallbacks(fadeTask);
                    bubble.animate().alpha(1f).setDuration(120).start();
                    return true;

                case MotionEvent.ACTION_MOVE: {
                    float dx = e.getRawX() - downX;
                    float dy = e.getRawY() - downY;
                    if (!dragging && Math.hypot(dx, dy) > slop) {
                        dragging = true;
                        showCloseTarget();
                    }
                    if (dragging) {
                        bubbleParams.x = (int) (startX + dx);
                        bubbleParams.y = (int) (startY + dy);
                        wm.updateViewLayout(bubble, bubbleParams);
                        highlightClose(isOverClose());
                    }
                    return true;
                }

                case MotionEvent.ACTION_UP:
                    if (dragging) {
                        boolean close = isOverClose();
                        hideCloseTarget();
                        if (close) {
                            prefs.edit().putBoolean("float_enabled", false).apply();
                            stopForeground(true);
                            stopSelf();
                        } else {
                            snapToEdge();
                        }
                    } else {
                        onTap();
                        scheduleFade();
                    }
                    return true;

                case MotionEvent.ACTION_CANCEL:
                    hideCloseTarget();
                    scheduleFade();
                    return true;

                default:
                    return false;
            }
        }
    }

    private void snapToEdge() {
        int size = bubbleParams.width;
        int maxY = Math.max(0, screenH() - size - dp(24));
        bubbleParams.y = Math.max(0, Math.min(bubbleParams.y, maxY));
        final int from = bubbleParams.x;
        final int to = (from + size / 2 < screenW() / 2) ? 0 : screenW() - size;

        ValueAnimator anim = ValueAnimator.ofInt(from, to);
        anim.setDuration(180);
        anim.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator a) {
                if (bubble == null) return;
                bubbleParams.x = (Integer) a.getAnimatedValue();
                try {
                    wm.updateViewLayout(bubble, bubbleParams);
                } catch (Exception ignored) {
                }
            }
        });
        anim.start();

        prefs.edit().putInt("pos_x", to).putInt("pos_y", bubbleParams.y).apply();
        scheduleFade();
    }

    // ------------------------------------------------------------- close target

    private void showCloseTarget() {
        if (closeTarget != null) return;
        int size = dp(64);
        closeTarget = new TextView(this);
        closeTarget.setText("✕");
        closeTarget.setTextColor(Color.WHITE);
        closeTarget.setTextSize(24);
        closeTarget.setGravity(Gravity.CENTER);
        closeTarget.setBackground(circleDrawable(Color.argb(190, 20, 30, 50)));

        WindowManager.LayoutParams lp = newParams(size, size, false);
        lp.x = (screenW() - size) / 2;
        lp.y = screenH() - size - dp(96);
        wm.addView(closeTarget, lp);
    }

    private android.graphics.drawable.GradientDrawable circleDrawable(int color) {
        android.graphics.drawable.GradientDrawable d = new android.graphics.drawable.GradientDrawable();
        d.setShape(android.graphics.drawable.GradientDrawable.OVAL);
        d.setColor(color);
        return d;
    }

    private void highlightClose(boolean over) {
        if (closeTarget == null) return;
        closeTarget.setBackground(circleDrawable(
                over ? Color.argb(230, 200, 50, 50) : Color.argb(190, 20, 30, 50)));
        closeTarget.setScaleX(over ? 1.2f : 1f);
        closeTarget.setScaleY(over ? 1.2f : 1f);
    }

    private boolean isOverClose() {
        if (closeTarget == null || bubble == null) return false;
        float bx = bubbleParams.x + bubbleParams.width / 2f;
        float by = bubbleParams.y + bubbleParams.height / 2f;
        float cx = screenW() / 2f;
        float cy = screenH() - dp(64) / 2f - dp(96);
        return Math.hypot(bx - cx, by - cy) < dp(70);
    }

    private void hideCloseTarget() {
        removeView(closeTarget);
        closeTarget = null;
    }

    // ---------------------------------------------------------------------- tap

    private void onTap() {
        int goal = prefs.getInt("goal", 100);
        int today;
        synchronized (LOCK) {
            today = readToday() + 1;
            prefs.edit()
                    .putInt("today", today)
                    .putString("today_date", todayKey())
                    .putInt("pending_local", prefs.getInt("pending_local", 0) + 1)
                    .putInt("pending_global", prefs.getInt("pending_global", 0) + 1)
                    .apply();
        }

        bubble.setProgress(today, goal);
        boolean reachedGoal = goal > 0 && today == goal;
        vibrate(reachedGoal);
        pulse(reachedGoal);
        floatSalawat();
        flushGlobal();
    }

    private void pulse(boolean goal) {
        bubble.animate().cancel();
        float peak = goal ? 1.3f : 1.15f;
        bubble.setScaleX(1f);
        bubble.setScaleY(1f);
        bubble.animate().scaleX(peak).scaleY(peak).setDuration(110)
                .withEndAction(new Runnable() {
                    @Override
                    public void run() {
                        if (bubble != null) {
                            bubble.animate().scaleX(1f).scaleY(1f).setDuration(160).start();
                        }
                    }
                }).start();
        if (goal) {
            bubble.setGlow(true);
            handler.postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (bubble != null) bubble.setGlow(false);
                }
            }, 1400);
        }
    }

    /** علامة ﷺ بتطلع من الزرار وتختفي. */
    private void floatSalawat() {
        final TextView t = new TextView(this);
        t.setText("ﷺ");
        t.setTextColor(Color.parseColor("#FFE39A"));
        t.setTextSize(26);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setShadowLayer(14f, 0f, 0f, Color.parseColor("#FFB347"));

        WindowManager.LayoutParams lp = newParams(
                WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.WRAP_CONTENT, false);
        lp.x = bubbleParams.x + bubbleParams.width / 2 - dp(14);
        lp.y = Math.max(0, bubbleParams.y - dp(22));
        try {
            wm.addView(t, lp);
        } catch (Exception e) {
            return;
        }
        t.animate().translationY(-dp(80)).alpha(0f).setDuration(900)
                .withEndAction(new Runnable() {
                    @Override
                    public void run() {
                        removeView(t);
                    }
                }).start();
    }

    @SuppressWarnings("deprecation")
    private void vibrate(boolean strong) {
        if (!prefs.getBoolean("haptic", true)) return;
        Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
        if (v == null || !v.hasVibrator()) return;
        if (Build.VERSION.SDK_INT >= 26) {
            if (strong) {
                v.vibrate(VibrationEffect.createWaveform(
                        new long[]{0, 40, 60, 40, 60, 90}, -1));
            } else {
                v.vibrate(VibrationEffect.createOneShot(20, VibrationEffect.DEFAULT_AMPLITUDE));
            }
        } else {
            if (strong) {
                v.vibrate(new long[]{0, 40, 60, 40, 60, 90}, -1);
            } else {
                v.vibrate(20);
            }
        }
    }

    // ---------------------------------------------------------- counters / sync

    static String todayKey() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
    }

    private int readToday() {
        if (!todayKey().equals(prefs.getString("today_date", ""))) return 0;
        return prefs.getInt("today", 0);
    }

    /** يبعت الصلوات اللي لسه ماتحسبتش في العدّاد العام (واحدة واحدة، ويفضل يحاول لو النت قطع). */
    private void flushGlobal() {
        network.execute(new Runnable() {
            @Override
            public void run() {
                String url = prefs.getString("url", "");
                String key = prefs.getString("key", "");
                if (url.isEmpty() || key.isEmpty()) return;
                if (url.endsWith("/")) url = url.substring(0, url.length() - 1);

                while (true) {
                    if (prefs.getInt("pending_global", 0) <= 0) break;
                    if (!postIncrement(url, key)) break;
                    synchronized (LOCK) {
                        int left = prefs.getInt("pending_global", 0) - 1;
                        prefs.edit().putInt("pending_global", Math.max(0, left)).apply();
                    }
                }
            }
        });
    }

    private boolean postIncrement(String baseUrl, String key) {
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(baseUrl + "/rest/v1/rpc/increment_prayer_count")
                    .openConnection();
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

    // -------------------------------------------------------------- bubble view

    private static class BubbleView extends View {
        private final Paint paint = new Paint(
                Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG | Paint.DITHER_FLAG);
        private final Bitmap icon;
        private final RectF oval = new RectF();
        private final Path clip = new Path();
        private int today = 0;
        private int goal = 100;
        private boolean glow = false;

        BubbleView(Context context) {
            super(context);
            icon = BitmapFactory.decodeResource(getResources(), R.drawable.floating_icon);
        }

        void setProgress(int t, int g) {
            today = t;
            goal = g;
            invalidate();
        }

        void setGlow(boolean on) {
            glow = on;
            invalidate();
        }

        private float dp(float v) {
            return v * getResources().getDisplayMetrics().density;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            float w = getWidth();
            float h = getHeight();
            float cx = w / 2f;
            float cy = h / 2f;
            float ring = dp(4);
            float outer = Math.min(w, h) / 2f - ring / 2f - (glow ? 0 : 0);

            // خلفية داكنة
            paint.setStyle(Paint.Style.FILL);
            paint.setColor(Color.parseColor("#0B1B3A"));
            canvas.drawCircle(cx, cy, outer, paint);

            // صورة اللوحة داخل الدايرة
            float inner = outer - ring - dp(1);
            clip.reset();
            clip.addCircle(cx, cy, inner, Path.Direction.CW);
            canvas.save();
            canvas.clipPath(clip);
            if (icon != null) {
                RectF dst = new RectF(cx - inner, cy - inner, cx + inner, cy + inner);
                canvas.drawBitmap(icon, null, dst, paint);
            }
            canvas.restore();

            // مسار الحلقة
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(ring);
            paint.setStrokeCap(Paint.Cap.ROUND);
            paint.setColor(Color.argb(90, 255, 255, 255));
            oval.set(cx - outer, cy - outer, cx + outer, cy + outer);
            canvas.drawArc(oval, 0, 360, false, paint);

            // تقدم الهدف
            float frac = goal > 0 ? Math.min(1f, today / (float) goal) : 0f;
            if (frac > 0f) {
                paint.setColor(Color.parseColor("#FFD97A"));
                canvas.drawArc(oval, -90, 360f * frac, false, paint);
            }

            // لمعة عند الوصول للهدف
            if (glow) {
                paint.setStrokeWidth(dp(2));
                paint.setColor(Color.argb(200, 255, 227, 154));
                canvas.drawCircle(cx, cy, outer + dp(1), paint);
            }
        }
    }
}
