"""
يجهّز مشروع أندرويد (اللي اتولّد وقت البناء) لنسخة المتجر:
- رقم الإصدار (versionCode / versionName) من متغيّرات البيئة
- التوقيع بمفتاح الرفع لو الأسرار موجودة (غير كده بيبني نسخة غير موقّعة للتجربة فقط)
"""
import os
import pathlib
import re
import sys

gradle = pathlib.Path("android/app/build.gradle")
if not gradle.exists():
    sys.exit("android/app/build.gradle not found")
text = gradle.read_text(encoding="utf-8")

code = os.environ.get("VERSION_CODE", "1")
name = os.environ.get("VERSION_NAME", "1.0.0")

text, n1 = re.subn(r"versionCode\s*=?\s*\d+", f"versionCode {code}", text, count=1)
text, n2 = re.subn(r'versionName\s*=?\s*"[^"]*"', f'versionName "{name}"', text, count=1)
if not (n1 and n2):
    print(text)
    sys.exit("could not patch versionCode/versionName")

store = os.environ.get("KEYSTORE_PATH", "")
if store and os.path.exists(store):
    signing = (
        "    signingConfigs {\n"
        "        release {\n"
        f"            storeFile file('{pathlib.Path(store).resolve().as_posix()}')\n"
        "            storePassword System.getenv('KEYSTORE_PASSWORD')\n"
        "            keyAlias System.getenv('KEY_ALIAS')\n"
        "            keyPassword System.getenv('KEY_PASSWORD')\n"
        "        }\n"
        "    }\n\n"
    )
    text, n4 = re.subn(
        r"(buildTypes\s*\{\s*release\s*\{)",
        r"\1\n            signingConfig signingConfigs.release",
        text, count=1)
    text, n3 = re.subn(
        r"(\n\s*)buildTypes\s*\{",
        lambda m: "\n" + signing + "    buildTypes {", text, count=1)
    if not (n3 and n4):
        print(text)
        sys.exit("could not add signing config")
    print("signing config added")
else:
    print("NO KEYSTORE: building an UNSIGNED bundle (testing only)")

gradle.write_text(text, encoding="utf-8")
print(f"versionCode={code} versionName={name}")
