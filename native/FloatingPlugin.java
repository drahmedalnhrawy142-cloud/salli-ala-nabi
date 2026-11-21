package com.sallialanabi.app;

import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;

import android.Manifest;
import android.os.Build;
import android.os.Bundle;
import android.content.pm.PackageManager;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import java.util.ArrayList;
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
        SharedPreferences.Editor ed = prefs().edit()
                .putInt("goal", call.getInt("goal", 100))
                .putInt("today", call.getInt("today", 0))
                .putString("today_date", FloatingService.todayKey());
        String u = call.getString("url", "");
        String k = call.getString("key", "");
        if (u != null && !u.isEmpty() && k != null && !k.isEmpty()) {
            ed.putString("url", u).putString("key", k);
        }
        ed.apply();
        SalliWidgetProvider.refreshAll(getContext());
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
        r.put("sound", p.getString("sound", "full"));
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
                .putString("sound", "short".equals(call.getString("sound", "full")) ? "short" : "full")
                .apply();
        ReminderReceiver.schedule(getContext());
        call.resolve();
    }

    @PluginMethod
    public void adhkarStatus(PluginCall call) {
        SharedPreferences p = remPrefs();
        JSObject r = new JSObject();
        r.put("morningOn", p.getBoolean("adhkar_m_on", false));
        r.put("morningMin", p.getInt("adhkar_m_min", 6 * 60));
        r.put("eveningOn", p.getBoolean("adhkar_e_on", false));
        r.put("eveningMin", p.getInt("adhkar_e_min", 17 * 60));
        call.resolve(r);
    }

    @PluginMethod
    public void adhkarSet(PluginCall call) {
        remPrefs().edit()
                .putBoolean("adhkar_m_on", call.getBoolean("morningOn", false))
                .putInt("adhkar_m_min", call.getInt("morningMin", 6 * 60))
                .putBoolean("adhkar_e_on", call.getBoolean("eveningOn", false))
                .putInt("adhkar_e_min", call.getInt("eveningMin", 17 * 60))
                .apply();
        AdhkarReceiver.scheduleAll(getContext());
        call.resolve();
    }

    // ===== التسميع الصوتي (SpeechRecognizer) =====
    private SpeechRecognizer sr;

    @PluginMethod
    public void speechPermission(PluginCall call) {
        boolean g = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                == PackageManager.PERMISSION_GRANTED;
        if (!g && getActivity() != null) {
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.RECORD_AUDIO}, 9002);
        }
        JSObject r = new JSObject();
        r.put("granted", g);
        call.resolve(r);
    }

    private void speechEmit(String text, boolean fin) {
        JSObject o = new JSObject();
        o.put("text", text);
        o.put("final", fin);
        notifyListeners("speechResult", o);
    }

    private void speechEnd(String err) {
        JSObject o = new JSObject();
        if (err != null) o.put("error", err);
        notifyListeners("speechEnd", o);
    }

    @PluginMethod
    public void speechStart(final PluginCall call) {
        if (getActivity() == null) {
            call.reject("no activity");
            return;
        }
        final String lang = call.getString("lang", "ar-SA");
        getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                try {
                    if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                        call.reject("unavailable");
                        return;
                    }
                    if (sr != null) {
                        sr.destroy();
                        sr = null;
                    }
                    sr = SpeechRecognizer.createSpeechRecognizer(getContext());
                    sr.setRecognitionListener(new RecognitionListener() {
                        private String first(Bundle b) {
                            ArrayList<String> l = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                            return (l == null || l.isEmpty()) ? "" : l.get(0);
                        }
                        @Override public void onReadyForSpeech(Bundle p) { }
                        @Override public void onBeginningOfSpeech() { }
                        @Override public void onRmsChanged(float v) { }
                        @Override public void onBufferReceived(byte[] b) { }
                        @Override public void onEndOfSpeech() { }
                        @Override public void onEvent(int t, Bundle p) { }
                        @Override public void onPartialResults(Bundle b) {
                            String t = first(b);
                            if (!t.isEmpty()) speechEmit(t, false);
                        }
                        @Override public void onResults(Bundle b) {
                            String t = first(b);
                            if (!t.isEmpty()) speechEmit(t, true);
                            speechEnd(null);
                        }
                        @Override public void onError(int e) {
                            // 7 لا كلام مطابق، 6 انتهت مهلة الصمت: عادي ونعيد الاستماع. 9 إذن الميكروفون ناقص
                            speechEnd(e == 9 ? "permission" : (e == 7 || e == 6) ? null : "error" + e);
                        }
                    });
                    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
                    i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                    i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                    i.putExtra("android.speech.extra.SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS", 3500L);
                    i.putExtra("android.speech.extra.SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS", 3500L);
                    sr.startListening(i);
                    call.resolve();
                } catch (Exception ex) {
                    call.reject(String.valueOf(ex.getMessage()));
                }
            }
        });
    }

    @PluginMethod
    public void speechStop(final PluginCall call) {
        if (getActivity() != null) {
            getActivity().runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    if (sr != null) {
                        sr.destroy();
                        sr = null;
                    }
                    call.resolve();
                }
            });
        } else call.resolve();
    }

    @PluginMethod
    public void gardenStatus(PluginCall call) {
        SharedPreferences p = remPrefs();
        JSObject r = new JSObject();
        r.put("on", p.getBoolean("garden_on", false));
        r.put("min", p.getInt("garden_min", 20 * 60));
        call.resolve(r);
    }

    /** تذكير البستان: on + الدقيقة من اليوم + آخر يوم ذكر فيه (yyyy-MM-dd). كل معامل اختياري فيُحفظ ما وصل فقط. */
    @PluginMethod
    public void gardenSet(PluginCall call) {
        SharedPreferences.Editor e = remPrefs().edit();
        if (call.hasOption("on")) e.putBoolean("garden_on", call.getBoolean("on", false));
        if (call.hasOption("min")) e.putInt("garden_min", call.getInt("min", 20 * 60));
        if (call.hasOption("last")) e.putString("garden_last", call.getString("last", ""));
        e.apply();
        GardenReceiver.scheduleAll(getContext());
        call.resolve();
    }

    /** آية عند فتح قفل الهاتف: on + mode ("seq" | "rand"). يرجّع حالة إذن العرض فوق التطبيقات. */
    @PluginMethod
    public void unlockAyahSet(PluginCall call) {
        SharedPreferences.Editor e = getContext().getSharedPreferences(UnlockAyahService.PREFS, Context.MODE_PRIVATE).edit();
        if (call.hasOption("on")) e.putBoolean("on", call.getBoolean("on", false));
        if (call.hasOption("mode")) e.putString("mode", call.getString("mode", "seq"));
        e.apply();
        UnlockAyahService.apply(getContext());
        JSObject r = new JSObject();
        r.put("overlay", Settings.canDrawOverlays(getContext()));
        call.resolve(r);
    }

    @PluginMethod
    public void unlockAyahStatus(PluginCall call) {
        SharedPreferences p = getContext().getSharedPreferences(UnlockAyahService.PREFS, Context.MODE_PRIVATE);
        JSObject r = new JSObject();
        r.put("on", p.getBoolean("on", false));
        r.put("mode", p.getString("mode", "seq"));
        r.put("overlay", Settings.canDrawOverlays(getContext()));
        call.resolve(r);
    }

    /** إشعارات بمواعيد محددة: group ("virtue" | "adhan") + items [{at (ms), title, text}] تستبدل قائمة المجموعة بالكامل. */
    @PluginMethod
    public void eventsSet(PluginCall call) {
        String g = call.getString("group", "");
        try {
            org.json.JSONArray arr = call.getArray("items");
            EventReceiver.set(getContext(), g, arr);
            call.resolve();
        } catch (Exception e) {
            call.reject("bad items");
        }
    }

    /** لو المستخدم فتح التطبيق بعد إشعار أذكار: يرجّع "m" أو "e" ويصفّرها. */
    @PluginMethod
    public void adhkarPending(PluginCall call) {
        SharedPreferences p = remPrefs();
        String v = p.getString("adhkar_pending", "");
        if (!v.isEmpty()) p.edit().putString("adhkar_pending", "").apply();
        JSObject r = new JSObject();
        r.put("pending", v);
        call.resolve(r);
    }

    /** تذكير بعد كل صلاة: on + قائمة "epoch|اسم;..." من صفحة التطبيق. */
    @PluginMethod
    public void prayerAfterSet(PluginCall call) {
        remPrefs().edit()
                .putBoolean("pa_on", call.getBoolean("on", false))
                .putString("pa_list", call.getString("list", ""))
                .apply();
        PrayerAfterReceiver.scheduleNext(getContext());
        call.resolve();
    }

    @PluginMethod
    public void prayerAfterStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("on", remPrefs().getBoolean("pa_on", false));
        call.resolve(r);
    }

    /** العدّ بأزرار الصوت (والتطبيق مفتوح). */
    @PluginMethod
    public void volumeSet(PluginCall call) {
        prefs().edit().putBoolean("vol_on", call.getBoolean("on", false)).apply();
        call.resolve();
    }

    @PluginMethod
    public void volumeStatus(PluginCall call) {
        JSObject r = new JSObject();
        r.put("on", prefs().getBoolean("vol_on", false));
        call.resolve(r);
    }

    @PluginMethod
    public void reminderTest(PluginCall call) {
        ReminderReceiver.show(getContext(), "اللهم صلِّ وسلِّم وبارك على سيدنا محمد ﷺ");
        call.resolve();
    }


    // ===== هدف الزرار العايم (مستقل): ١٠٠ / ١٠٠٠ ... أو ٠ = لانهائي، ويتصفّر عند الوصول =====
    @PluginMethod
    public void floatConfig(PluginCall call) {
        int target = Math.max(0, call.getInt("target", 100));
        prefs().edit().putInt("fl_target", target).apply();
        FloatingService s = FloatingService.running;
        if (s != null) s.refreshFromPrefs();
        call.resolve();
    }

    @PluginMethod
    public void floatReset(PluginCall call) {
        prefs().edit().putInt("fl_count", 0).apply();
        FloatingService s = FloatingService.running;
        if (s != null) s.refreshFromPrefs();
        call.resolve();
    }

    @PluginMethod
    public void floatState(PluginCall call) {
        SharedPreferences p = prefs();
        JSObject r = new JSObject();
        r.put("count", p.getInt("fl_count", 0));
        r.put("target", p.getInt("fl_target", 100));
        call.resolve(r);
    }

    /** الزرار العايم الثاني («الذكر»): enabled / target / dhikr — أي منها اختياري. */
    @PluginMethod
    public void float2Config(PluginCall call) {
        SharedPreferences.Editor e = prefs().edit();
        if (call.hasOption("enabled")) e.putBoolean("d2_enabled", call.getBoolean("enabled", true));
        if (call.hasOption("target")) e.putInt("d2_target", Math.max(0, call.getInt("target", 33)));
        if (call.hasOption("dhikr")) {
            String d = call.getString("dhikr", "سبحان الله");
            if (d != null && !d.trim().isEmpty() && d.length() <= 60) e.putString("d2_dhikr", d.trim());
        }
        if (call.getBoolean("reset", false)) e.putInt("d2_count", 0);
        e.apply();
        FloatingService s = FloatingService.running;
        if (s != null) s.refreshFromPrefs();
        call.resolve();
    }

    @PluginMethod
    public void float2State(PluginCall call) {
        SharedPreferences p = prefs();
        JSObject r = new JSObject();
        r.put("enabled", p.getBoolean("d2_enabled", true));
        r.put("count", p.getInt("d2_count", 0));
        r.put("target", p.getInt("d2_target", 33));
        r.put("dhikr", p.getString("d2_dhikr", "سبحان الله"));
        r.put("total", p.getInt("d2_total", 0));
        call.resolve(r);
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

    // ===== مشاركة وحفظ بطاقة الصلاة =====
    private byte[] decodePng(PluginCall call) {
        String data = call.getString("data", "");
        return android.util.Base64.decode(data, android.util.Base64.DEFAULT);
    }

    @PluginMethod
    public void shareImage(PluginCall call) {
        try {
            byte[] bytes = decodePng(call);
            String text = call.getString("text", "");
            java.io.File dir = new java.io.File(getContext().getCacheDir(), "share");
            if (!dir.exists()) dir.mkdirs();
            java.io.File f = new java.io.File(dir, "salli-ala-nabi.png");
            java.io.FileOutputStream out = new java.io.FileOutputStream(f);
            out.write(bytes);
            out.close();
            android.net.Uri uri = androidx.core.content.FileProvider.getUriForFile(
                    getContext(), getContext().getPackageName() + ".salliprovider", f);
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("image/png");
            send.putExtra(Intent.EXTRA_STREAM, uri);
            if (text != null && !text.isEmpty()) send.putExtra(Intent.EXTRA_TEXT, text);
            send.setClipData(android.content.ClipData.newRawUri("", uri));
            send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent chooser = Intent.createChooser(send, "مشاركة البطاقة");
            chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(chooser);
            call.resolve();
        } catch (Exception e) {
            call.reject("share failed: " + e.getMessage());
        }
    }

    @PluginMethod
    public void saveImage(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT < 29) {
                call.reject("unsupported");
                return;
            }
            byte[] bytes = decodePng(call);
            android.content.ContentValues v = new android.content.ContentValues();
            v.put(android.provider.MediaStore.Images.Media.DISPLAY_NAME,
                    "salli-ala-nabi-" + System.currentTimeMillis() + ".png");
            v.put(android.provider.MediaStore.Images.Media.MIME_TYPE, "image/png");
            v.put(android.provider.MediaStore.Images.Media.RELATIVE_PATH, "Pictures/SalliAlaNabi");
            android.net.Uri u = getContext().getContentResolver().insert(
                    android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI, v);
            if (u == null) {
                call.reject("insert failed");
                return;
            }
            java.io.OutputStream o = getContext().getContentResolver().openOutputStream(u);
            if (o == null) {
                call.reject("stream failed");
                return;
            }
            o.write(bytes);
            o.close();
            call.resolve();
        } catch (Exception e) {
            call.reject("save failed: " + e.getMessage());
        }
    }
}
