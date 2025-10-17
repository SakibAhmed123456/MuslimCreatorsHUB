// Muslim Creators Hub — one-run server setup WITH auto-generated logo
// Requires Node 18+, discord.js v14, and canvas
// npm install discord.js dotenv canvas

import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
  ChannelType,
} from 'discord.js';
import { createCanvas, loadImage } from 'canvas';

const {
  DISCORD_TOKEN,
  GUILD_ID,
  FOUNDER_USER_ID,
} = process.env;

if (!DISCORD_TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* -------------------- Auto Logo Generator -------------------- */
async function makeLogoPng(size = 512) {
  // Palette
  const GREEN = '#0d3d2b';   // deep green
  const GOLD  = '#d4af37';   // elegant gold
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, size, size);

  // Subtle texture (noise)
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 4000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = Math.random() * 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#000'; ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Geometric motif (Rub el Hizb inspired)
  const cx = size / 2;
  const cy = size / 2.1;
  const outer = size * 0.28;
  const inner = outer * 0.55;

  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, size * 0.02);
  ctx.lineJoin = 'round';
  ctx.lineCap  = 'round';

  function drawStar(r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a1 = (Math.PI / 4) * i;
      const a2 = a1 + Math.PI / 4;
      const x1 = cx + r * Math.cos(a1);
      const y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2);
      const y2 = cy + r * Math.sin(a2);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  }
  // Double outline star
  drawStar(outer);
  drawStar(inner);

  // Square lattice overlay inside the star
  const grid = 4;
  const step = (inner * 1.3) / grid;
  ctx.beginPath();
  for (let i = -grid; i <= grid; i++) {
    ctx.moveTo(cx - step * grid, cy + i * step);
    ctx.lineTo(cx + step * grid, cy + i * step);
    ctx.moveTo(cx + i * step, cy - step * grid);
    ctx.lineTo(cx + i * step, cy + step * grid);
  }
  ctx.globalCompositeOperation = 'destination-over';
  ctx.stroke();

  ctx.globalCompositeOperation = 'source-over';

  // Titles: English + Arabic
  ctx.fillStyle = GOLD;
  // English
  ctx.font = `bold ${Math.floor(size * 0.09)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('MUSLIM', cx, size * 0.68);
  ctx.fillText('CREATORS HUB', cx, size * 0.78);

  // Arabic (مجتمع المسلمين المبدعين)
  ctx.font = `normal ${Math.floor(size * 0.075)}px "Noto Naskh Arabic", "Amiri", serif`;
  ctx.fillText('مجتمع المسلمين المبدعين', cx, size * 0.90);

  return canvas.toBuffer('image/png');
}

async function makeBannerPng(width = 1920, height = 480) {
  const GREEN = '#0d3d2b';
  const GOLD  = '#d4af37';
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = GREEN;
  ctx.fillRect(0, 0, width, height);

  // Geometric border pattern
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = Math.max(2, height * 0.02);
  const margin = height * 0.08;

  function pattern(cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a1 = (Math.PI / 4) * i;
      const a2 = a1 + Math.PI / 4;
      ctx.moveTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
      ctx.lineTo(cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }
    ctx.stroke();
  }

  const count = 10;
  for (let i = 0; i < count; i++) {
    const x = margin + i * ((width - margin * 2) / (count - 1));
    pattern(x, height / 2, height * 0.18);
  }

  // Title center
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.floor(height * 0.22)}px serif`;
  ctx.fillText('Muslim Creators Hub', width / 2, height / 2 - height * 0.08);

  ctx.font = `normal ${Math.floor(height * 0.16)}px "Noto Naskh Arabic", "Amiri", serif`;
  ctx.fillText('مجتمع المسلمين المبدعين', width / 2, height / 2 + height * 0.14);

  return canvas.toBuffer('image/png');
}
/* ------------------------------------------------------------- */

client.once('ready', async () => {
  try {
    console.log(`Logged in as ${client.user.tag}`);

    // Resolve target guild
    let guild = null;
    if (GUILD_ID) {
      guild = await client.guilds.fetch(GUILD_ID);
    } else {
      const all = await client.guilds.fetch();
      if (all.size !== 1) {
        console.error('Provide GUILD_ID in .env (bot is in multiple/zero guilds).');
        process.exit(1);
      }
      guild = await all.first().fetch();
    }

    // Rename the server (optional)
    if (guild.name !== 'Muslim Creators Hub') {
      await guild.setName('Muslim Creators Hub').catch(() => {});
    }

    // Safety & community defaults
    await guild.setVerificationLevel(2).catch(() => {});        // Medium
    await guild.setExplicitContentFilter(2).catch(() => {});    // Scan all members
    await guild.setPreferredLocale('en-GB').catch(() => {});

    // Create (or get) roles
    async function ensureRole(name, opts = {}) {
      const exists = guild.roles.cache.find(r => r.name === name);
      if (exists) return exists;
      return guild.roles.create({ name, ...opts });
    }

    const col = (hex) => hex;

    const roleFounder = await ensureRole('Founder', { color: col('#f1c40f'), hoist: true, mentionable: false, permissions: new PermissionsBitField([
      PermissionsBitField.Flags.Administrator,
    ])});

    const roleAdmin = await ensureRole('Admin', { color: col('#e67e22'), hoist: true, mentionable: false, permissions: new PermissionsBitField([
      PermissionsBitField.Flags.ManageGuild,
      PermissionsBitField.Flags.ManageChannels,
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ViewAuditLog,
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.BanMembers,
      PermissionsBitField.Flags.ModerateMembers,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ManageWebhooks,
    ])});

    const roleMod = await ensureRole('Moderator', { color: col('#3498db'), hoist: true, permissions: new PermissionsBitField([
      PermissionsBitField.Flags.ModerateMembers,
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.ManageWebhooks,
      PermissionsBitField.Flags.KickMembers,
      PermissionsBitField.Flags.ViewAuditLog,
    ])});

    const roleVerified = await ensureRole('Verified Creative', { color: col('#2ecc71'), hoist: true });
    const roleMember   = await ensureRole('Member', { color: col('#95a5a6') });
    const roleBot      = await ensureRole('Bot', { color: col('#9b59b6') });

    try { await roleBot.setPosition(roleAdmin.position - 1); } catch {}

    // Assign Founder role to you
    if (FOUNDER_USER_ID) {
      try {
        const founder = await guild.members.fetch(FOUNDER_USER_ID);
        await founder.roles.add(roleFounder);
      } catch {
        console.warn('Could not assign Founder role (check FOUNDER_USER_ID).');
      }
    }

    // Permissions helpers
    const everyone = guild.roles.everyone;

    const viewAll = [
      { id: everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory] },
    ];
    const staffCanWrite = [
      { id: roleAdmin.id, allow: [PermissionsBitField.Flags.SendMessages] },
      { id: roleMod.id,   allow: [PermissionsBitField.Flags.SendMessages] },
    ];
    const lockPost = [
      { id: everyone.id, deny: [PermissionsBitField.Flags.SendMessages] },
      ...staffCanWrite,
    ];
    const staffOnly = [
      { id: everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
      { id: roleAdmin.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageMessages] },
      { id: roleMod.id,   allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
    ];
    const showcases = [
      { id: everyone.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.ReadMessageHistory], deny: [PermissionsBitField.Flags.SendMessages] },
      { id: roleVerified.id, allow: [PermissionsBitField.Flags.SendMessages] },
      { id: roleAdmin.id, allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] },
      { id: roleMod.id,   allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] },
    ];

    // Categories
    async function ensureCategory(name, overwrites = []) {
      const cat = guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name === name
      );
      if (cat) return cat;
      return guild.channels.create({ name, type: ChannelType.GuildCategory, permissionOverwrites: overwrites });
    }
    async function ensureText(name, parent, overwrites = [], topic = '') {
      const ch = guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.name === name
      );
      if (ch) {
        if (parent && ch.parentId !== parent.id) await ch.setParent(parent.id);
        if (topic && ch.topic !== topic) await ch.setTopic(topic).catch(() => {});
        return ch;
      }
      return guild.channels.create({ name, type: ChannelType.GuildText, parent: parent?.id, topic, permissionOverwrites: overwrites });
    }
    async function ensureVoice(name, parent, overwrites = []) {
      const ch = guild.channels.cache.find(
        c => c.type === ChannelType.GuildVoice && c.name === name
      );
      if (ch) { if (parent && ch.parentId !== parent.id) await ch.setParent(parent.id); return ch; }
      return guild.channels.create({ name, type: ChannelType.GuildVoice, parent: parent?.id, permissionOverwrites: overwrites });
    }

    const catWelcome   = await ensureCategory('📢 Welcome & Info', viewAll);
    const catCreative  = await ensureCategory('🎨 Creative Lounge', viewAll);
    const catCommunity = await ensureCategory('💬 Community', viewAll);
    const catVoice     = await ensureCategory('🎙️ Voice', viewAll);
    const catStaff     = await ensureCategory('🛡️ Staff', staffOnly);

    const chWelcome   = await ensureText('welcome', catWelcome, lockPost, 'Start here: About the hub & how to participate');
    const chRules     = await ensureText('rules', catWelcome, lockPost, 'Community guidelines & etiquette');
    const chAnnounce  = await ensureText('announcements', catWelcome, lockPost, 'Official hub announcements');
    const chIntro     = await ensureText('introductions', catWelcome, viewAll, 'Introduce yourself to the community!');

    const chArt       = await ensureText('art-showcase', catCreative, showcases, 'Post original artwork (images permitted).');
    const chWriting   = await ensureText('writing-corner', catCreative, showcases, 'Share prose, poetry, essays.');
    const chMusic     = await ensureText('music-room', catCreative, showcases, 'Share compositions, vocals, nasheeds, sound design.');
    const chPhoto     = await ensureText('photography', catCreative, showcases, 'Share your photos and visual sets.');
    const chFilm      = await ensureText('film-and-media', catCreative, showcases, 'Shorts, edits, motion design, podcasts.');

    const chGeneral   = await ensureText('general-chat', catCommunity, viewAll, 'Daily conversation, support, feedback.');
    const chIslamic   = await ensureText('islamic-discussion', catCommunity, viewAll, 'Respectful, non-sectarian discussion & reminders.');
    const chMental    = await ensureText('mental-health', catCommunity, viewAll, 'Peer support; not a substitute for professional care.');
    const chNetwork   = await ensureText('networking', catCommunity, viewAll, 'Collaborations, commissions, opportunities.');
    const chQuran     = await ensureText('quran-and-reflection', catCommunity, viewAll, 'Share reflections and reminders.');

    const vcGeneral   = await ensureVoice('🎤 General VC', catVoice, viewAll);
    const vcChill     = await ensureVoice('🎧 Chill VC', catVoice, viewAll);
    const vcStudy     = await ensureVoice('📚 Study/Work VC', catVoice, viewAll);

    const chMod       = await ensureText('mod-chat', catStaff, staffOnly, 'Private staff coordination.');
    const chLogs      = await ensureText('server-logs', catStaff, staffOnly, 'System / moderation logs.');

    await guild.setSystemChannel(chWelcome).catch(() => {});
    await guild.setRulesChannel(chRules).catch(() => {});

    async function seedIfEmpty(channel, content) {
      const msgs = await channel.messages.fetch({ limit: 1 }).catch(() => null);
      if (!msgs || msgs.size === 0) { await channel.send(content).catch(() => {}); await sleep(400); }
    }

    await seedIfEmpty(chWelcome,
`**As-salāmu ʿalaykum — welcome to the Muslim Creators Hub!** 🌙
This is a public community for Muslim artists, writers, designers, filmmakers, musicians, photographers, and builders.

> “Allah is beautiful and loves beauty.” — (Sahih Muslim)

**Start here:**
• Read **#rules**  
• Say hi in **#introductions**  
• Share your work in the **🎨 Creative Lounge** channels  
• Need help? Ping the Mods or use **#mod-chat** (staff only)
`);

    await seedIfEmpty(chRules,
`## Community Guidelines
1) **Adab first** — be respectful, assume good intent, no harassment.  
2) **Halal & respectful content only** — no NSFW, profanity, or harmful material.  
3) **Constructive feedback** — celebrate wins, offer kind critique.  
4) **No sectarian debates** — keep Islamic discussions beneficial and non-divisive.  
5) **Attribution & permissions** — share only what you own or have rights to.  
6) **Mental health care** — peers can support, but this is not professional advice.  
7) **Self-promo** — welcome in **#networking** within reason; no spam.  

Violations may lead to message removal, mutes, or bans at staff discretion.
`);

    await seedIfEmpty(chAnnounce, `Server is live! Share the invite and introduce yourself in **#introductions** ✨`);
    await seedIfEmpty(chIntro, `Drop your name, what you create, and one goal for this month!`);

    // ---------- AUTO LOGO: generate & apply ----------
    try {
      console.log('Generating server logo…');
      const icon = await makeLogoPng(512);
      await guild.setIcon(icon);
      console.log('✅ Server icon applied.');

      // Try to set a banner (Community + appropriate boost tier required)
      console.log('Generating server banner…');
      const banner = await makeBannerPng(1920, 480);
      await guild.setBanner(banner).catch(() => {}); // silently ignore if not allowed
      console.log('✅ Banner attempt finished (ignored if not supported).');
    } catch (e) {
      console.warn('Could not generate/apply logo or banner:', e?.message || e);
    }
    // -----------------------------------------------

    // Create a permanent public invite for #welcome
    let invite;
    try {
      invite = await chWelcome.createInvite({
        maxAge: 0,
        maxUses: 0,
        unique: true,
        reason: 'Public invite for Muslim Creators Hub launch',
      });
    } catch (e) {
      console.warn('Could not create invite (check bot permissions).');
    }

    console.log('✅ Setup complete.');
    if (invite) {
      console.log('Public invite:', invite.url);
      await chAnnounce.send(`**Public Invite:** ${invite.url}`).catch(() => {});
    }

    setTimeout(() => process.exit(0), 1000);
  } catch (err) {
    console.error('Setup failed:', err);
    process.exit(1);
  }
});

client.login(DISCORD_TOKEN);
