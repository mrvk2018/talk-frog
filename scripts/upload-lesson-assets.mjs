/**
 * Пакетная оптимизация (WebP) и загрузка иллюстраций урока в Supabase Storage.
 *
 * Положите исходники в assets/upload-queue/lesson-3/ как 1.png … 8.jpg (номер = слот).
 * Требуется SUPABASE_SERVICE_ROLE_KEY или SUPABASE_SECRET_KEY в .env (anon не создаёт бакеты).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const BUCKET = 'lesson-assets';
const LESSON_FOLDER = 'lesson-3';
const QUEUE_DIR = path.join(ROOT, 'assets', 'upload-queue', LESSON_FOLDER);

const SLOT_TO_FILENAME = {
  1: 'hello.webp',
  2: 'hi.webp',
  3: 'goodbye.webp',
  4: 'bye-see-you.webp',
  5: 'good-morning.webp',
  6: 'good-afternoon.webp',
  7: 'good-evening.webp',
  8: 'good-night.webp',
};

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|tiff?|avif|heic)$/i;
const SLOT_FROM_NAME = /^(\d{1,2})\./i;

function loadDotEnv() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function getSupabaseAdmin() {
  loadDotEnv();
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_KEY?.trim();
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) {
    console.error('EXPO_PUBLIC_SUPABASE_URL не задан (см. .env).');
    process.exit(1);
  }

  const key = serviceKey || anonKey;
  if (!key) {
    console.error(
      'Нужен SUPABASE_SERVICE_ROLE_KEY или SUPABASE_SECRET_KEY в .env (для создания бакета и upsert).',
    );
    process.exit(1);
  }

  if (!serviceKey) {
    console.warn(
      '⚠ Используется EXPO_PUBLIC_SUPABASE_ANON_KEY — создание бакета может быть запрещено RLS.',
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function collectSourceBySlot() {
  if (!fs.existsSync(QUEUE_DIR)) {
    console.error(`Папка не найдена: ${QUEUE_DIR}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(QUEUE_DIR, { withFileTypes: true });
  const bySlot = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (entry.name === '.gitkeep') continue;
    if (!IMAGE_EXT.test(entry.name)) {
      console.warn(`Пропуск (не изображение): ${entry.name}`);
      continue;
    }

    const match = entry.name.match(SLOT_FROM_NAME);
    if (!match) {
      console.warn(`Пропуск (ожидается имя вида 3.png): ${entry.name}`);
      continue;
    }

    const slot = Number(match[1], 10);
    if (!SLOT_TO_FILENAME[slot]) {
      console.warn(`Пропуск (слот вне 1–8): ${entry.name}`);
      continue;
    }

    if (bySlot.has(slot)) {
      console.warn(`Дубликат слота ${slot}: ${entry.name} (уже есть ${bySlot.get(slot).name})`);
      continue;
    }

    bySlot.set(slot, { name: entry.name, fullPath: path.join(QUEUE_DIR, entry.name) });
  }

  return bySlot;
}

async function optimizeToWebp(sourcePath) {
  return sharp(sourcePath)
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}

async function ensurePublicBucket(supabase) {
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) throw new Error(`listBuckets: ${listErr.message}`);

  const exists = buckets?.some((b) => b.name === BUCKET);
  if (exists) {
    console.log(`Бакет «${BUCKET}» уже существует.`);
    return;
  }

  const { error: createErr } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/webp', 'image/png', 'image/jpeg'],
  });

  if (createErr) {
    throw new Error(`createBucket: ${createErr.message}`);
  }
  console.log(`Создан публичный бакет «${BUCKET}».`);
}

async function uploadWebp(supabase, storagePath, buffer) {
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buffer, {
    contentType: 'image/webp',
    upsert: true,
    cacheControl: '31536000',
  });
  if (error) throw new Error(`upload ${storagePath}: ${error.message}`);
}

function publicUrl(supabase, storagePath) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  const supabase = getSupabaseAdmin();
  const bySlot = collectSourceBySlot();

  const slots = Object.keys(SLOT_TO_FILENAME)
    .map(Number)
    .sort((a, b) => a - b);

  const present = slots.filter((s) => bySlot.has(s));
  if (present.length === 0) {
    console.log(`В ${QUEUE_DIR} нет файлов 1–8.* — положите исходники и запустите снова.`);
    console.log('Пример: 1.png → hello.webp, 2.jpg → hi.webp, …');
    process.exit(0);
  }

  console.log(`Найдено изображений: ${present.length} из ${slots.length}`);
  await ensurePublicBucket(supabase);

  const urls = [];

  for (const slot of present) {
    const src = bySlot.get(slot);
    const targetName = SLOT_TO_FILENAME[slot];
    const storagePath = `${LESSON_FOLDER}/${targetName}`;

    console.log(`[${slot}] ${src.name} → ${storagePath}`);
    const webp = await optimizeToWebp(src.fullPath);
    await uploadWebp(supabase, storagePath, webp);
    const url = publicUrl(supabase, storagePath);
    urls.push(url);
    console.log(`    ${url}`);
  }

  console.log('\nГотово. Публичные URL:');
  for (const u of urls) console.log(u);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});