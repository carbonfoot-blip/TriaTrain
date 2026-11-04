import { AthleteProfile, GarminBridgeConfig, TrainingPlan } from '../types/triathlon';

export interface TriaTrainCloudSnapshot {
  version: number;
  updatedAt: string;
  deviceHint?: string;
  currentWeekIndex: number;
  profile: AthleteProfile;
  plan: TrainingPlan;
}

const CLOUD_ANCHOR_DATE_START = '2020-01-01';
const CLOUD_ANCHOR_DATE_END = '2020-01-02';
const CLOUD_EXTERNAL_ID = 'triatrain_cloud_backup_v1';
const CLOUD_NOTE_NAME = '☁️ TriaTrain Cloud Sync (Profil & Programme)';
const CLOUD_PREFIX = 'TRIATRAIN_CLOUD_V1:';
const LAST_SYNC_STORAGE_KEY = 'triatrain_last_cloud_sync_at';

export function getLastCloudSyncTimestamp(): string | null {
  try {
    return localStorage.getItem(LAST_SYNC_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setLastCloudSyncTimestamp(iso: string): void {
  try {
    localStorage.setItem(LAST_SYNC_STORAGE_KEY, iso);
  } catch {
    // ignore
  }
}

/**
 * Encode une chaîne UTF-8 en Base64 compatible navigateur (iPhone Safari + PC Chrome/Edge)
 */
function encodeUtf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Décode une chaîne Base64 en UTF-8
 */
function decodeBase64ToUtf8(b64: string): string {
  const binary = atob(b64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Compresse en GZIP + Base64 si CompressionStream est supporté, sinon Base64 UTF-8 direct
 */
async function serializeSnapshot(snapshot: TriaTrainCloudSnapshot): Promise<string> {
  const json = JSON.stringify(snapshot);

  if (typeof CompressionStream !== 'undefined') {
    try {
      const inputBytes = new TextEncoder().encode(json);
      const cs = new CompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(inputBytes);
      writer.close();

      const compressedBuffer = await new Response(cs.readable).arrayBuffer();
      const compressedBytes = new Uint8Array(compressedBuffer);
      let binary = '';
      for (let i = 0; i < compressedBytes.length; i++) {
        binary += String.fromCharCode(compressedBytes[i]);
      }
      return `${CLOUD_PREFIX}GZIP:${btoa(binary)}`;
    } catch {
      // Fallback sur RAW base64
    }
  }

  return `${CLOUD_PREFIX}RAW:${encodeUtf8ToBase64(json)}`;
}

/**
 * Décompresse et parse le snapshot stocké dans la note Intervals.icu
 */
async function deserializeSnapshot(description: string): Promise<TriaTrainCloudSnapshot | null> {
  if (!description) return null;
  const idx = description.indexOf(CLOUD_PREFIX);
  if (idx === -1) return null;

  const payload = description.slice(idx + CLOUD_PREFIX.length).trim();

  if (payload.startsWith('GZIP:')) {
    const b64 = payload.slice(5).trim().split(/\s+/)[0];
    if (typeof DecompressionStream === 'undefined') {
      throw new Error('Votre navigateur ne supporte pas la décompression GZIP.');
    }
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    writer.write(bytes);
    writer.close();
    const decompressedBuffer = await new Response(ds.readable).arrayBuffer();
    const json = new TextDecoder().decode(decompressedBuffer);
    return JSON.parse(json) as TriaTrainCloudSnapshot;
  }

  if (payload.startsWith('RAW:')) {
    const b64 = payload.slice(4).trim().split(/\s+/)[0];
    const json = decodeBase64ToUtf8(b64);
    return JSON.parse(json) as TriaTrainCloudSnapshot;
  }

  return null;
}

interface IntervalsCalendarEvent {
  id: number;
  category: string;
  start_date_local: string;
  name?: string;
  description?: string;
  external_id?: string;
}

/**
 * Cherche l'événement NOTE de sauvegarde TriaTrain sur le calendrier Intervals.icu (2020-01-01)
 */
async function findExistingCloudBackupEvent(
  athleteId: string,
  authToken: string
): Promise<IntervalsCalendarEvent | null> {
  const url = `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
    athleteId
  )}/events?oldest=${CLOUD_ANCHOR_DATE_START}&newest=${CLOUD_ANCHOR_DATE_END}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Clé API ou ID Athlète Intervals.icu refusé (401/403).');
    }
    throw new Error(`Erreur Intervals.icu lors de la recherche Cloud (HTTP ${response.status}).`);
  }

  const events = (await response.json()) as IntervalsCalendarEvent[];
  if (!Array.isArray(events)) return null;

  const matches = events.filter(
    (ev) =>
      ev.external_id === CLOUD_EXTERNAL_ID ||
      (ev.name && ev.name.includes('TriaTrain Cloud Sync')) ||
      (ev.description && ev.description.includes(CLOUD_PREFIX))
  );

  if (matches.length === 0) return null;
  // Prendre le plus récent (id le plus élevé)
  matches.sort((a, b) => b.id - a.id);
  return matches[0];
}

/**
 * Pousse (Push) l'intégralité du profil, du programme, de la semaine en cours et des résultats
 * vers le Cloud Intervals.icu de l'athlète.
 */
export async function pushStateToIntervalsCloud(
  config: GarminBridgeConfig,
  profile: AthleteProfile,
  plan: TrainingPlan,
  currentWeekIndex: number
): Promise<{ updatedAt: string }> {
  const apiKey = config.intervalsApiKey.trim();
  const athleteId = config.intervalsAthleteId.trim() || '0';

  if (!apiKey) {
    throw new Error(
      'Veuillez renseigner votre Clé API Intervals.icu dans Profil > Montre & Cloud.'
    );
  }

  const authToken = btoa(`API_KEY:${apiKey}`);
  const nowIso = new Date().toISOString();

  const snapshot: TriaTrainCloudSnapshot = {
    version: 1,
    updatedAt: nowIso,
    currentWeekIndex,
    profile,
    plan,
  };

  const encodedPayload = await serializeSnapshot(snapshot);
  const completedCount = plan.weeks.reduce(
    (acc, w) => acc + w.workouts.filter((wo) => wo.status === 'completed').length,
    0
  );

  const noteDescription = [
    `Sauvegarde automatique multi-appareils TriaTrain (iPhone ↔ PC).`,
    `Athlète : ${profile.name} | Objectif : ${profile.raceObjective.raceName || profile.raceObjective.distance}`,
    `Début Semaine 1 : ${plan.weeks[0]?.startDate || '—'} | Séances complétées : ${completedCount}`,
    `Dernière mise à jour : ${new Date(nowIso).toLocaleString('fr-FR')}`,
    '',
    encodedPayload,
  ].join('\n');

  const existing = await findExistingCloudBackupEvent(athleteId, authToken);

  if (existing && existing.id) {
    const putUrl = `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
      athleteId
    )}/events/${existing.id}`;

    const putResp = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        category: 'NOTE',
        start_date_local: `${CLOUD_ANCHOR_DATE_START}T00:00:00`,
        name: CLOUD_NOTE_NAME,
        description: noteDescription,
        color: 'cyan',
        external_id: CLOUD_EXTERNAL_ID,
      }),
    });

    if (!putResp.ok) {
      throw new Error(`Erreur lors de la mise à jour Cloud Intervals.icu (HTTP ${putResp.status}).`);
    }
  } else {
    const postUrl = `https://intervals.icu/api/v1/athlete/${encodeURIComponent(
      athleteId
    )}/events`;

    const postResp = await fetch(postUrl, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        category: 'NOTE',
        start_date_local: `${CLOUD_ANCHOR_DATE_START}T00:00:00`,
        name: CLOUD_NOTE_NAME,
        description: noteDescription,
        color: 'cyan',
        external_id: CLOUD_EXTERNAL_ID,
      }),
    });

    if (!postResp.ok) {
      throw new Error(`Erreur lors de la création de la sauvegarde Cloud (HTTP ${postResp.status}).`);
    }
  }

  setLastCloudSyncTimestamp(nowIso);
  return { updatedAt: nowIso };
}

/**
 * Récupère (Pull) l'intégralité du profil, du programme, des settings et des résultats
 * depuis le Cloud Intervals.icu vers l'appareil actuel (PC ou iPhone).
 */
export async function pullStateFromIntervalsCloud(
  config: GarminBridgeConfig
): Promise<TriaTrainCloudSnapshot> {
  const apiKey = config.intervalsApiKey.trim();
  const athleteId = config.intervalsAthleteId.trim() || '0';

  if (!apiKey) {
    throw new Error(
      'Veuillez renseigner votre Clé API Intervals.icu pour récupérer vos données Cloud.'
    );
  }

  const authToken = btoa(`API_KEY:${apiKey}`);
  const existing = await findExistingCloudBackupEvent(athleteId, authToken);

  if (!existing || !existing.description) {
    throw new Error(
      'Aucune sauvegarde TriaTrain trouvée sur ce compte Intervals.icu. Sur votre iPhone, cliquez d’abord sur "Sauvegarder vers le Cloud (Push)".'
    );
  }

  const snapshot = await deserializeSnapshot(existing.description);
  if (!snapshot || !snapshot.profile || !snapshot.plan) {
    throw new Error('La sauvegarde Cloud trouvée est invalide ou incomplète.');
  }

  setLastCloudSyncTimestamp(snapshot.updatedAt || new Date().toISOString());
  return snapshot;
}
