'use client';

import styles from './ContactSection.module.css';

const displayPhone = '01001483073';
const whatsappPhone = '201001483073';

export function ContactSection() {
  return (
    <section className={styles.section} id="contact" aria-labelledby="contact-heading">
      <div className={styles.panel}>
        <div className={styles.copy}>
          <span className={styles.eyebrow}>نحن هنا للتواصل</span>
          <h2 className={styles.heading} id="contact-heading">تواصل معنا</h2>
          <p className={styles.description}>للاستفسارات أو الملاحظات، يسعدنا تواصلك معنا.</p>
          <a className={styles.phone} href={`tel:${displayPhone}`} dir="ltr" aria-label={`اتصل على ${displayPhone}`}>
            {displayPhone}
          </a>
        </div>
        <a
          className={styles.whatsapp}
          href={`https://wa.me/${whatsappPhone}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل معنا على واتساب"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.34.16 11.91c0 2.1.55 4.15 1.6 5.96L.05 24l6.29-1.65a11.9 11.9 0 0 0 5.72 1.46h.01c6.57 0 11.91-5.34 11.92-11.91a11.85 11.85 0 0 0-3.47-8.42ZM12.07 21.8h-.01a9.88 9.88 0 0 1-5.03-1.37l-.36-.21-3.73.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.52-5.28c0-5.46 4.44-9.9 9.9-9.9a9.84 9.84 0 0 1 7 2.9 9.84 9.84 0 0 1 2.9 7c-.01 5.46-4.45 9.89-9.91 9.89Zm5.43-7.41c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.08 4.49.71.3 1.27.49 1.7.62.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
          </svg>
          <span>تواصل عبر واتساب</span>
          <span aria-hidden="true" className={styles.arrow}>←</span>
        </a>
      </div>
    </section>
  );
}
