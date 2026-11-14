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
for name in ("FloatingService.java", "FloatingPlugin.java", "MainActivity.java"):
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

manifest_path.write_text(text, encoding="utf-8")
print("manifest patched")
