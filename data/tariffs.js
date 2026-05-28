// ─── Grille tarifaire TER Grand Est – Abonnements 2024 ───────────────────────
//
// Source : ter.sncf.com/grand-est → Tarifs & Abonnements
// ⚠️  À vérifier régulièrement car les prix SNCF peuvent évoluer.
//
// Structure par OD : { adult: {day, week, month}, young: {day, week, month} }
//   • adult = tarif plein
//   • young  = tarif -26 ans / étudiant (si connu, sinon YOUNG_DISCOUNT est appliqué)
//
// Clé = IDs triés alphabétiquement → lookup A→B == B→A
//

// Réduction jeune appliquée automatiquement si 'young' n'est pas renseigné manuellement
const YOUNG_DISCOUNT = 0.75; // 25 % de réduction par défaut – à ajuster selon les offres TER

const TARIFFS_DATA = {

  // ── Liaisons Lunéville ────────────────────────────────────────────────────
  // LUNEL-NANCY mensuel adulte confirmé : 93,90 €
  'LUNEL-NANCY': {
    adult: { day: 12.60, week: 36.40, month: 93.90 },
  },
  'LUNEL-METZ': {
    adult: { day: 25.10, week: 72.90, month: 187.80 },
  },
  'LUNEL-PAMOU': {
    adult: { day: 17.20, week: 49.80, month: 128.40 },
  },
  'LUNEL-SARR': {
    adult: { day: 17.20, week: 49.80, month: 128.40 },
  },

  // ── Liaisons Nancy ────────────────────────────────────────────────────────
  'METZ-NANCY': {
    adult: { day: 18.50, week: 53.50, month: 137.80 },
  },
  'NANCY-PAMOU': {
    adult: { day: 10.80, week: 31.40, month: 80.90 },
  },
  'NANCY-SARR': {
    adult: { day: 14.00, week: 40.60, month: 104.50 },
  },
  'BARLEC-NANCY': {
    adult: { day: 20.40, week: 59.00, month: 152.30 },
  },
  'NANCY-STRAS': {
    adult: { day: 37.60, week: 108.90, month: 280.70 },
  },
  'NANCY-THION': {
    adult: { day: 22.90, week: 66.40, month: 171.30 },
  },
  'EPINA-NANCY': {
    adult: { day: 18.50, week: 53.50, month: 137.80 },
  },
  'NANCY-REMIR': {
    adult: { day: 22.90, week: 66.40, month: 171.30 },
  },
  'NANCY-SDIE': {
    adult: { day: 25.10, week: 72.90, month: 187.80 },
  },

  // ── Liaisons Metz ─────────────────────────────────────────────────────────
  'METZ-PAMOU': {
    adult: { day: 14.00, week: 40.60, month: 104.50 },
  },
  'METZ-THION': {
    adult: { day: 14.00, week: 40.60, month: 104.50 },
  },
  'FORB-METZ': {
    adult: { day: 18.50, week: 53.50, month: 137.80 },
  },
  'METZ-SARR': {
    adult: { day: 22.60, week: 65.50, month: 168.80 },
  },
  'METZ-STRAS': {
    adult: { day: 34.50, week: 100.00, month: 257.90 },
  },
  'BARLEC-METZ': {
    adult: { day: 28.30, week: 82.10, month: 211.60 },
  },
  'METZ-VERDU': {
    adult: { day: 26.90, week: 77.90, month: 201.00 },
  },

  // ── Liaisons Thionville ───────────────────────────────────────────────────
  'FORB-THION': {
    adult: { day: 11.50, week: 33.20, month: 85.60 },
  },
  'SARR-THION': {
    adult: { day: 30.10, week: 87.20, month: 224.70 },
  },

  // ── Liaisons Strasbourg ───────────────────────────────────────────────────
  'COLM-STRAS': {
    adult: { day: 22.60, week: 65.50, month: 168.80 },
  },
  'MULH-STRAS': {
    adult: { day: 27.20, week: 78.90, month: 203.30 },
  },
  'HAGUE-STRAS': {
    adult: { day: 12.90, week: 37.40, month: 96.30 },
  },
  'SAVEN-STRAS': {
    adult: { day: 11.50, week: 33.20, month: 85.60 },
  },
  'SELES-STRAS': {
    adult: { day: 18.50, week: 53.50, month: 137.80 },
  },
  'OBERN-STRAS': {
    adult: { day: 12.90, week: 37.40, month: 96.30 },
  },
  'MOLS-STRAS': {
    adult: { day: 10.80, week: 31.40, month: 80.90 },
  },
  'BISCK-STRAS': {
    adult: { day: 10.80, week: 31.40, month: 80.90 },
  },

  // ── Alsace interne ────────────────────────────────────────────────────────
  'COLM-MULH': {
    adult: { day: 11.50, week: 33.20, month: 85.60 },
  },
  'COLM-SELES': {
    adult: { day: 11.50, week: 33.20, month: 85.60 },
  },
  'MULH-SELES': {
    adult: { day: 17.20, week: 49.80, month: 128.40 },
  },
  'COLM-HAGUE': {
    adult: { day: 30.10, week: 87.20, month: 224.70 },
  },
};

// Lookup avec profil – young utilise les prix renseignés OU applique YOUNG_DISCOUNT
function getTariff(idA, idB, profile = 'adult') {
  const key   = [idA, idB].sort().join('-');
  const entry = TARIFFS_DATA[key];
  if (!entry) return null;

  if (profile === 'young') {
    if (entry.young) return entry.young;
    const a = entry.adult;
    if (!a) return null;
    return {
      day:   +( a.day   * YOUNG_DISCOUNT ).toFixed(2),
      week:  +( a.week  * YOUNG_DISCOUNT ).toFixed(2),
      month: +( a.month * YOUNG_DISCOUNT ).toFixed(2),
    };
  }
  return entry.adult || null;
}
