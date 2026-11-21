package com.sallialanabi.app;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebViewClient;
import java.io.InputStream;
import java.util.HashMap;
import android.webkit.WebSettings;
import android.webkit.WebView;

/** شاشة شفافة تعرض آية (صفحة ayah-card.html من أصول التطبيق) فوق أي تطبيق بعد فتح قفل الهاتف. */
public class UnlockAyahActivity extends Activity {

    private static final String HOST = "appassets.sallialanabi.local";

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "application/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".woff2")) return "font/woff2";
        if (p.endsWith(".woff")) return "font/woff";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".png")) return "image/png";
        return "application/octet-stream";
    }

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
        s.setAllowFileAccess(false);
        // نخدم صفحات التطبيق (المبنية بـ Next) من أصول التطبيق عبر نطاق محلي وهمي، فتعمل الخطوط والملفات بمساراتها المطلقة
        wv.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                if (!HOST.equals(req.getUrl().getHost())) return null;
                String path = req.getUrl().getPath();
                if (path == null || path.isEmpty()) path = "/";
                String[] tries = {path, path + ".html", path.endsWith("/") ? path + "index.html" : path + "/index.html"};
                for (String t : tries) {
                    try {
                        InputStream in = getAssets().open("public" + t);
                        return new WebResourceResponse(mime(t), "utf-8", in);
                    } catch (Exception ignored) {
                    }
                }
                return new WebResourceResponse("text/plain", "utf-8", 404, "Not Found", new HashMap<String, String>(), null);
            }
        });
        wv.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public void close() {
                runOnUiThread(UnlockAyahActivity.this::finish);
            }
        }, "Android");
        setContentView(wv, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        wv.loadUrl("https://" + HOST + "/ayah-card/?i=" + i + (rnd ? "&m=r" : ""));
    }
}
