"""
يضيف كود الزرار العايم (أندرويد أصلي) لمشروع أندرويد اللي بيتولّد وقت البناء.
بيتشغّل في GitHub Actions بعد `npx cap add android`.
"""
import pathlib
import shutil
import sys

PKG = "com.sallialanabi.app"
NATIVE = pathlib.Path("native")
MAIN = pathlib.Path("android/app/src/main")

java_dir = MAIN / "java" / PKG.replace(".", "/")
if not java_dir.exists():
    sys.exit(f"Missing folder: {java_dir} (is the package name still {PKG}?)")

# 1) ملفات الجافا
for name in ("FloatingService.java", "FloatingPlugin.java", "MainActivity.java",
             "ReminderReceiver.java", "BootReceiver.java"):
    shutil.copyfile(NATIVE / name, java_dir / name)
    print("copied", name)

# 2) صورة الزرار
drawable = MAIN / "res" / "drawable-nodpi"
drawable.mkdir(parents=True, exist_ok=True)
logo = NATIVE / "floating_logo.png"
if not logo.exists():
    logo = NATIVE / "floating_icon.png"
shutil.copyfile(logo, drawable / "floating_icon.png")
print("copied", logo.name, "as floating_icon.png")

# 3) AndroidManifest.xml
manifest_path = MAIN / "AndroidManifest.xml"
text = manifest_path.read_text(encoding="utf-8")

permissions = [
    "android.permission.SYSTEM_ALERT_WINDOW",
    "android.permission.FOREGROUND_SERVICE",
    "android.permission.FOREGROUND_SERVICE_SPECIAL_USE",
    "android.permission.POST_NOTIFICATIONS",
    "android.permission.VIBRATE",
    "android.permission.RECEIVE_BOOT_COMPLETED",
]
lines = ""
for p in permissions:
    if p not in text:
        lines += f'    <uses-permission android:name="{p}" />\n'
if lines:
    if "<application" not in text:
        sys.exit("AndroidManifest.xml has no <application> tag")
    text = text.replace("<application", lines + "\n    <application", 1)

if "FloatingService" not in text:
    service = (
        '        <service\n'
        '            android:name=".FloatingService"\n'
        '            android:exported="false"\n'
        '            android:foregroundServiceType="specialUse">\n'
        '            <property\n'
        '                android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"\n'
        '                android:value="floating_prayer_button" />\n'
        '        </service>\n'
    )
    if "</application>" not in text:
        sys.exit("AndroidManifest.xml has no </application> tag")
    text = text.replace("</application>", service + "    </application>", 1)

# صوت وأيقونة التذكيرات
raw = MAIN / "res" / "raw"
raw.mkdir(parents=True, exist_ok=True)
shutil.copyfile(NATIVE / "salli_nasheed.mp3", raw / "salli_nasheed.mp3")
(MAIN / "res" / "drawable").mkdir(parents=True, exist_ok=True)
shutil.copyfile(NATIVE / "ic_stat_salli.xml", MAIN / "res" / "drawable" / "ic_stat_salli.xml")
print("copied reminder sound + icon")

if "ReminderReceiver" not in text:
    receivers = (
        '        <receiver android:name=".ReminderReceiver" android:exported="false" />\n'
        '        <receiver android:name=".BootReceiver" android:exported="true">\n'
        '            <intent-filter>\n'
        '                <action android:name="android.intent.action.BOOT_COMPLETED" />\n'
        '            </intent-filter>\n'
        '        </receiver>\n'
    )
    text = text.replace("</application>", receivers + "    </application>", 1)

manifest_path.write_text(text, encoding="utf-8")
print("manifest patched")

# 4) شاشة البداية بتاعة أندرويد 12+: خلفية سودا + بدون أيقونة صغيرة
#    (اللوجو الكبير بيظهر من جوه التطبيق نفسه بعدها على طول)
import re

res = MAIN / "res"
(res / "drawable").mkdir(parents=True, exist_ok=True)
(res / "drawable" / "splash_empty.xml").write_text(
    '<?xml version="1.0" encoding="utf-8"?>\n'
    '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
    '    android:width="24dp" android:height="24dp"\n'
    '    android:viewportWidth="24" android:viewportHeight="24">\n'
    '    <path android:fillColor="#00000000" android:pathData="M0,0h1v1h-1z" />\n'
    '</vector>\n',
    encoding="utf-8",
)
styles_path = res / "values" / "styles.xml"
st = styles_path.read_text(encoding="utf-8")
extra = (
    '        <item name="windowSplashScreenBackground">#000000</item>\n'
    '        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_empty</item>\n'
    '        <item name="android:windowSplashScreenBackground">#000000</item>\n'
    '        <item name="android:windowSplashScreenIconBackgroundColor">#000000</item>\n'
)
pattern = re.compile(r'(<style name="AppTheme\.NoActionBarLaunch"[^>]*>)(.*?)(</style>)', re.S)
m = pattern.search(st)
if m and "windowSplashScreenBackground" not in m.group(2):
    st = st[: m.end(1)] + "\n" + extra + st[m.end(1):]
    styles_path.write_text(st, encoding="utf-8")
    print("splash theme patched")
else:
    print("splash theme: not patched (style missing or already set)")
