package com.sallialanabi.app;

import android.content.Context;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FloatingPlugin.class);
        super.onCreate(savedInstanceState);
    }

    /** لو العدّ بأزرار الصوت مفعّل: الزرار بيعدّ صلاة بدل ما يغيّر الصوت. */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if ((code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN)
                && getSharedPreferences(FloatingService.PREFS, Context.MODE_PRIVATE).getBoolean("vol_on", false)) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0 && getBridge() != null) {
                final WebView wv = getBridge().getWebView();
                if (wv != null) {
                    wv.post(() -> wv.evaluateJavascript(
                            "window.dispatchEvent(new CustomEvent('volume-key'))", null));
                }
            }
            return true;
        }
        return super.dispatchKeyEvent(event);
    }
}
