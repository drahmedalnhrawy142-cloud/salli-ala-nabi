package com.sallialanabi.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** يرجّع جدولة التذكيرات بعد إعادة تشغيل الموبايل. */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        ReminderReceiver.schedule(ctx);
        AdhkarReceiver.scheduleAll(ctx);
        GardenReceiver.scheduleAll(ctx);
        EventReceiver.scheduleAll(ctx);
        UnlockAyahService.apply(ctx);
        PrayerAfterReceiver.scheduleNext(ctx);
        SalliWidgetProvider.refreshAll(ctx);
    }
}
