package com.sallialanabi.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

/** شاشة شفافة تعرض آية (صفحة ayah-card.html من أصول التطبيق) فوق أي تطبيق بعد فتح قفل الهاتف. */
public class UnlockAyahActivity extends Activity {

    @SuppressLint({"SetJavaScriptEnabled", "AddJavascriptInterface"})
    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        int i = getIntent().getIntExtra("i", 0);
        boolean rnd = getIntent().getBooleanExtra("rnd", false);
        WebView wv = new WebView(this);
        wv.setBackgroundColor(Color.TRANSPARENT);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowFileAccessFromFileURLs(true);
        s.setAllowUniversalAccessFromFileURLs(true);
        wv.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void close() {
                runOnUiThread(UnlockAyahActivity.this::finish);
            }
        }, "Android");
        setContentView(wv, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        wv.loadUrl("file:///android_asset/public/ayah-card.html?i=" + i + (rnd ? "&m=r" : ""));
    }
}
