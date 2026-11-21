/**
 * Discord Webhook Recruiter & Visitor Notifier for Codeial
 * 
 * Strict 2-Notification Architecture:
 * 1. Immediate Landing Alert: Fired once when visitor opens the page (IP, location, source/ref, device).
 * 2. Consolidated Activity Digest: Fired once upon session exit/backgrounding (time on page,
 *    actual active viewing duration, scroll depth, and chronological activity timeline).
 * 
 * Zero spam: Exactly 2 notifications per visitor session.
 */

const DEFAULT_WEBHOOK_URL =
  'https://discord.com/api/webhooks/1572929130423390318/JU9VT9Rc7ttqn2B4kUzVznepaoPlsxGToWwwtHmu3AMCWkm3GecXIns01torYk-QeEjB';

const WEBHOOK_URL =
  process.env.REACT_APP_DISCORD_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

const CODEIAL_LOGO_URL =
  'https://ninjasfiles.s3.amazonaws.com/0000000000003454.png';

// Session State in memory
const session = {
  startTime: Date.now(),
  lastActiveStamp: Date.now(),
  activeMs: 0,
  hiddenMs: 0,
  isTabVisible: typeof document !== 'undefined' ? document.visibilityState !== 'hidden' : true,
  maxScroll: 0,
  scrollMilestones: new Set(),
  events: [],
  source: 'Direct / Recruiter Portfolio Visit',
  location: 'Location unavailable',
  isp: 'Network unavailable',
  ip: '',
  device: '',
  hasSentLanding: false,
  hasSentSummary: false,
};

/**
 * Format milliseconds into human-readable duration (e.g. "2m 14s", "45s")
 */
function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Format timestamp offset from session start (e.g. "[00:15]")
 */
function getEventTimestamp() {
  const elapsedSec = Math.max(0, Math.floor((Date.now() - session.startTime) / 1000));
  const mins = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const secs = String(elapsedSec % 60).padStart(2, '0');
  return `[${mins}:${secs}]`;
}

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
 * Extract source parameter from URL or fallback
 */
function detectSourceParam() {
  if (typeof window === 'undefined') return 'Direct';
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const raw =
      urlParams.get('ref') ||
      urlParams.get('source') ||
      urlParams.get('utm_source') ||
      sessionStorage.getItem('codeial_ref_source');

    if (raw && raw.trim()) {
      let clean = raw.trim();
      if (clean.length > 100) clean = clean.slice(0, 97) + '...';
      sessionStorage.setItem('codeial_ref_source', clean);
      return clean;
    }
  } catch (e) {}
  return 'Direct / Recruiter Portfolio Visit';
}

/**
 * Strict sanitizer to enforce Discord embed constraints:
 * - field name: 1-256 chars (never empty)
 * - field value: 1-1024 chars (never empty)
 * - title: max 256 chars
 * - description: max 2048 chars
 * - footer text: max 2048 chars
 */
function sanitizeEmbed(embed) {
  if (!embed || typeof embed !== 'object') return embed;

  const sanitized = { ...embed };

  if (sanitized.title && sanitized.title.length > 256) {
    sanitized.title = sanitized.title.slice(0, 253) + '...';
  }

  if (sanitized.description && sanitized.description.length > 2048) {
    sanitized.description = sanitized.description.slice(0, 2045) + '...';
  }

  if (sanitized.footer && sanitized.footer.text && sanitized.footer.text.length > 2048) {
    sanitized.footer = {
      ...sanitized.footer,
      text: sanitized.footer.text.slice(0, 2045) + '...',
    };
  }

  if (Array.isArray(sanitized.fields)) {
    sanitized.fields = sanitized.fields.map((field) => {
      let name = (field.name !== undefined && field.name !== null ? String(field.name) : 'Detail').trim();
      let value = (field.value !== undefined && field.value !== null ? String(field.value) : 'N/A').trim();

      if (!name) name = 'Detail';
      if (!value) value = 'N/A';

      if (name.length > 256) {
        name = name.slice(0, 253) + '...';
      }
      if (value.length > 1024) {
        value = value.slice(0, 1021) + '...';
      }

      return {
        ...field,
        name,
        value,
      };
    });
  }

  return sanitized;
}

/**
 * Helper to execute Discord Webhook POST safely with keepalive
 */
async function postToDiscord(embed) {
  if (!WEBHOOK_URL) return;
  try {
    const safeEmbed = sanitizeEmbed(embed);
    const payload = JSON.stringify({ embeds: [safeEmbed] });
    if (typeof fetch !== 'undefined') {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      });
    }
  } catch (err) {
    console.warn('Discord webhook dispatch error:', err);
  }
}

/**
 * Log a user action or interaction into the session timeline
 */
export function logUserActivity(action) {
  if (!action || typeof action !== 'string') return;

  let cleanAction = action.trim();
  if (!cleanAction) return;

  if (cleanAction.length > 120) {
    cleanAction = cleanAction.slice(0, 117) + '...';
  }

  const timestamp = getEventTimestamp();
  const entry = `${timestamp} ${cleanAction}`;

  // Prevent immediate duplicate log spam
  const lastEvent = session.events[session.events.length - 1];
  if (lastEvent && (lastEvent.endsWith(` ${cleanAction}`) || lastEvent === cleanAction)) {
    return;
  }

  session.events.push(entry);

  // Keep events list bounded
  if (session.events.length > 50) {
    session.events.shift();
  }
}

/**
 * 1. Immediate Landing Notification (Notification 1 of 2)
 */
export async function notifyVisitorLanding() {
  if (typeof window === 'undefined') return;

  // Ensure landing is logged only once per session
  const LANDING_KEY = 'codeial_discord_landing_notified';
  if (sessionStorage.getItem(LANDING_KEY)) {
    session.hasSentLanding = true;
    return;
  }
  sessionStorage.setItem(LANDING_KEY, 'true');
  session.hasSentLanding = true;

  session.source = detectSourceParam();
  session.device = getDeviceInfo();
  logUserActivity(`Landed on feed (${window.location.pathname})`);

  // Fetch IP and Geolocation asynchronously
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://ipwho.is/', { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.success !== false) {
        const city = data.city || '';
        const region = data.region || '';
        const countryCode = data.country_code || data.country || '';
        const parts = [city, region].filter(Boolean).join(', ');
        session.location = parts ? `${parts} (${countryCode})` : countryCode || 'Unknown';
        session.isp = data.connection?.isp || data.connection?.org || data.isp || 'Unknown ISP';
        session.ip = data.ip || '';
        
        sessionStorage.setItem('codeial_geo_location', session.location);
        sessionStorage.setItem('codeial_geo_isp', session.isp);
        sessionStorage.setItem('codeial_geo_ip', session.ip);
      }
    }
  } catch (e) {
    console.warn('Geolocation lookup skipped:', e);
  }

  const timeFormatted = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'medium',
  });

  const embed = {
    title: '🚨 Recruiter / Visitor Landed on Codeial!',
    description: `A visitor just opened Codeial with **ref / source:** \`${session.source}\`.`,
    color: 0xff5f6d, // Sunset coral
    fields: [
      { name: '🎯 Source / Ref', value: `\`${session.source}\``, inline: true },
      { name: '📍 Location', value: session.location, inline: true },
      { name: '🏢 ISP / Org', value: session.isp, inline: false },
      { name: '📱 Device / Platform', value: session.device, inline: true },
      { name: '⏰ Landed At (IST)', value: `${timeFormatted} IST`, inline: true },
    ],
    thumbnail: { url: CODEIAL_LOGO_URL },
    footer: { text: 'Codeial Recruiter Analytics • Landing Notification (1 of 2)', icon_url: CODEIAL_LOGO_URL },
    timestamp: new Date().toISOString(),
  };

  if (session.ip) {
    embed.fields.push({ name: '🌐 IP Address', value: `\`${session.ip}\``, inline: true });
  }

  await postToDiscord(embed);
}

/**
 * 2. Consolidated Session Activity Summary (Notification 2 of 2)
 */
export async function sendSessionSummary(reason = 'Session ended') {
  if (typeof window === 'undefined') return;

  const SUMMARY_KEY = 'codeial_discord_summary_sent';
  if (session.hasSentSummary || sessionStorage.getItem(SUMMARY_KEY)) {
    return;
  }
  session.hasSentSummary = true;
  sessionStorage.setItem(SUMMARY_KEY, 'true');

  // Update active viewing times
  const now = Date.now();
  if (session.isTabVisible) {
    session.activeMs += now - session.lastActiveStamp;
  } else {
    session.hiddenMs += now - session.lastActiveStamp;
  }
  session.lastActiveStamp = now;
  const totalMs = now - session.startTime;

  // Restore cached geolocation if session memory missed it
  if (session.location === 'Location unavailable') {
    session.location = sessionStorage.getItem('codeial_geo_location') || 'Location unavailable';
    session.isp = sessionStorage.getItem('codeial_geo_isp') || 'Network unavailable';
    session.ip = sessionStorage.getItem('codeial_geo_ip') || '';
  }
  if (!session.source || session.source === 'Direct / Recruiter Portfolio Visit') {
    session.source = detectSourceParam();
  }
  if (!session.device) {
    session.device = getDeviceInfo();
  }

  logUserActivity(reason);

  // Engagement assessment
  let engagementStatus = '⚡ Bounced (<10s)';
  if (session.activeMs >= 45000) {
    engagementStatus = '🌟 High Engagement (Active >45s)';
  } else if (session.activeMs >= 15000) {
    engagementStatus = '✅ Engaged View (Active 15-45s)';
  } else if (session.activeMs >= 5000) {
    engagementStatus = '👀 Brief Inspection (5-15s)';
  }

  // Format activity event logs (Discord field limit: 1024 chars)
  let formattedEvents = session.events.slice(-15).join('\n');
  if (!formattedEvents) {
    formattedEvents = 'No interactions recorded (Passive viewing)';
  }
  if (formattedEvents.length > 900) {
    formattedEvents = formattedEvents.substring(0, 900) + '\n... (truncated)';
  }

  const embed = {
    title: '📊 Recruiter Activity & Engagement Digest',
    description: `Consolidated session report for visitor from **${session.source}** (${session.location}).`,
    color: 0x10b981, // Emerald Green
    fields: [
      {
        name: '⏱️ Time on Page',
        value: `**Total:** ${formatDuration(totalMs)}\n**Active Focus:** ${formatDuration(session.activeMs)}\n**Backgrounded:** ${formatDuration(session.hiddenMs)}`,
        inline: true,
      },
      {
        name: '📜 Scroll Depth',
        value: `**Max Scrolled:** ${session.maxScroll}%\n${session.maxScroll >= 60 ? '✅ Read through posts' : '⚡ Quick glance'}`,
        inline: true,
      },
      {
        name: '👁️ Actually Viewed?',
        value: engagementStatus,
        inline: true,
      },
      {
        name: `🖱️ User Activity Timeline (${session.events.length} total events)`,
        value: `\`\`\`text\n${formattedEvents}\n\`\`\``,
        inline: false,
      },
      {
        name: '📱 Device & Network',
        value: `${session.device}\n${session.location} • ${session.isp}`,
        inline: false,
      },
    ],
    thumbnail: { url: CODEIAL_LOGO_URL },
    footer: {
      text: 'Codeial Recruiter Analytics • Consolidated Digest (2 of 2)',
      icon_url: CODEIAL_LOGO_URL,
    },
    timestamp: new Date().toISOString(),
  };

  await postToDiscord(embed);
}

/**
 * Initialize automatic listeners for scrolling, tab visibility, and exit events
 */
let isInitialized = false;

export function initActivityTracker() {
  if (typeof window === 'undefined' || isInitialized) return;
  isInitialized = true;

  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    session.isTabVisible = false;
  }

  session.source = detectSourceParam();
  session.device = getDeviceInfo();

  // 1. Scroll depth tracking with milestones
  let scrollTimeout = null;
  const handleScroll = () => {
    if (scrollTimeout) return;
    scrollTimeout = setTimeout(() => {
      scrollTimeout = null;
      const scrollHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      ) - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollTop = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      let currentScroll = Math.min(100, Math.max(0, Math.round((scrollTop / scrollHeight) * 100)));

      // If within 5px of bottom, mark as 100%
      if (scrollTop + window.innerHeight >= (document.documentElement.scrollHeight - 5)) {
        currentScroll = 100;
      }

      if (currentScroll > session.maxScroll) {
        session.maxScroll = currentScroll;
      }

      // Check milestones
      [25, 50, 75, 100].forEach((milestone) => {
        if (currentScroll >= milestone && !session.scrollMilestones.has(milestone)) {
          session.scrollMilestones.add(milestone);
          logUserActivity(
            milestone === 100
              ? 'Scrolled to bottom of feed (100%)'
              : `Scrolled ${milestone}% down feed`
          );
        }
      });
    }, 200);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  // 2. Tab Visibility Tracking (Active focus vs Background tab)
  let hiddenTimer = null;
  const handleVisibilityChange = () => {
    const now = Date.now();
    if (document.visibilityState === 'hidden') {
      session.isTabVisible = false;
      session.activeMs += now - session.lastActiveStamp;
      session.lastActiveStamp = now;
      logUserActivity('Tab switched to background');

      // If tab remains hidden for 25 seconds, flush the session summary
      hiddenTimer = setTimeout(() => {
        if (!session.hasSentSummary) {
          sendSessionSummary('Visitor left tab in background');
        }
      }, 25000);
    } else {
      if (hiddenTimer) {
        clearTimeout(hiddenTimer);
        hiddenTimer = null;
      }
      session.isTabVisible = true;
      session.hiddenMs += now - session.lastActiveStamp;
      session.lastActiveStamp = now;
      logUserActivity('Tab returned to active focus');
    }
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // 3. Tab exit / unload triggers (Reliable dispatch via keepalive)
  const handleExit = () => {
    sendSessionSummary('Visitor closed or left page');
  };
  window.addEventListener('pagehide', handleExit);
  window.addEventListener('beforeunload', handleExit);

  // 4. Fallback: If visitor stays for 5 minutes of continuous browsing, send digest checkpoint
  setTimeout(() => {
    if (!session.hasSentSummary) {
      sendSessionSummary('5-minute continuous session milestone reached');
    }
  }, 300000);
}
