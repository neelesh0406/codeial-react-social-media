/**
 * Discord Webhook Recruiter & Visitor Notifier for Codeial
 * Sends real-time notifications to Discord when someone visits Codeial.
 */

const DEFAULT_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1572929130423390318/JU9VT9Rc7ttqn2B4kUzVznepaoPlsxGToWwwtHmu3AMCWkm3GecXIns01torYk-QeEjB';

const WEBHOOK_URL =
  process.env.REACT_APP_DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

const CODEIAL_LOGO_URL =
  'https://ninjasfiles.s3.amazonaws.com/0000000000003454.png';

/**
 * Detect client device, operating system, and browser
 */
function getDeviceInfo() {
  if (typeof navigator === 'undefined') return 'Unknown Device';

  const ua = navigator.userAgent || '';
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const type = isMobile ? '📱 Mobile' : '💻 Desktop';

  let os = 'Unknown OS';
  if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua)) browser = 'Safari';

  return `${type} • ${os} (${browser})`;
}

/**
 * Main function to notify recruiter / visitor landing
 */
export async function notifyVisitorLanding() {
  if (typeof window === 'undefined') return;

  // Prevent multiple alerts within the same browser session
  const SESSION_KEY = 'codeial_discord_notified';
  if (sessionStorage.getItem(SESSION_KEY)) {
    return;
  }

  // Mark as notified immediately to prevent race conditions during React lifecycle
  sessionStorage.setItem(SESSION_KEY, 'true');

  try {
    // 1. Detect source from URL query parameter (?source=naukri, ?source=linkedin, etc.)
    const urlParams = new URLSearchParams(window.location.search);
    const rawSource =
      urlParams.get('source') ||
      urlParams.get('ref') ||
      urlParams.get('utm_source');

    const source = rawSource
      ? rawSource.trim()
      : 'Direct / Recruiter Portfolio Visit';

    // 2. Fetch IP and Geolocation data from ipwho.is
    let locationStr = 'Location unavailable';
    let ispStr = 'Network unavailable';
    let ipStr = '';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch('https://ipwho.is/', {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          const city = data.city || '';
          const region = data.region || '';
          const countryCode = data.country_code || data.country || '';

          const parts = [city, region].filter(Boolean).join(', ');
          locationStr = parts
            ? `${parts} (${countryCode})`
            : countryCode || 'Unknown';

          ispStr =
            data.connection?.isp ||
            data.connection?.org ||
            data.isp ||
            'Unknown ISP';

          if (data.ip) {
            ipStr = data.ip;
          }
        }
      }
    } catch (geoErr) {
      console.warn('Geolocation lookup skipped/failed:', geoErr);
    }

    const deviceInfo = getDeviceInfo();
    const timeFormatted = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'medium',
    });

    // 3. Format Discord Rich Embed
    const embed = {
      title: '🚨 Recruiter / Visitor Landed on Codeial!',
      description: `A visitor just opened Codeial from **${source}**.`,
      color: 0xff5f6d, // Codeial sunset coral
      fields: [
        {
          name: '🎯 Source',
          value: `\`${source}\``,
          inline: true,
        },
        {
          name: '📍 Location',
          value: locationStr,
          inline: true,
        },
        {
          name: '🏢 ISP / Org',
          value: ispStr,
          inline: false,
        },
        {
          name: '📱 Device / Platform',
          value: deviceInfo,
          inline: true,
        },
        {
          name: '⏰ Time (IST)',
          value: `${timeFormatted} IST`,
          inline: true,
        },
      ],
      thumbnail: {
        url: CODEIAL_LOGO_URL,
      },
      footer: {
        text: 'Codeial Recruiter Analytics',
        icon_url: CODEIAL_LOGO_URL,
      },
      timestamp: new Date().toISOString(),
    };

    if (ipStr) {
      embed.fields.push({
        name: '🌐 IP Address',
        value: `\`${ipStr}\``,
        inline: true,
      });
    }

    // 4. Send to Discord Webhook
    if (WEBHOOK_URL) {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          embeds: [embed],
        }),
      });
    }
  } catch (err) {
    // Fail silently so it never impacts user experience
    console.error('Failed to send Discord visitor notification:', err);
  }
}
