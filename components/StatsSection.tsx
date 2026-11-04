'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type Stats = {
  total_codes: number;
  available_codes: number;
  total_deliveries: number;
};

export function StatsSection() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function loadStats() {
      const { data, error } = await supabase.rpc('get_nusuk_stats');

      if (error) {
        console.error('Stats error:', error);
        return;
      }

      if (data) {
        setStats(data as Stats);
      }
    }

    loadStats();
  }, []);

  return (
    <section className="stats-section" aria-labelledby="stats-heading">
      <h2 className="stats-heading" id="stats-heading">
        إحصائيات المنصة
      </h2>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">
            <strong>{stats?.total_codes ?? '—'}</strong> كود
          </div>
          <div className="stat-label">إجمالي الأكواد</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            <strong>{stats?.available_codes ?? '—'}</strong> كود
          </div>
          <div className="stat-label">متاح حاليًا</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">
            <strong>{stats?.total_deliveries ?? '—'}</strong> مرة
          </div>
          <div className="stat-label">إجمالي مرات الاستلام</div>
        </div>
      </div>
    </section>
  );
}
