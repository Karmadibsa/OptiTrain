// ─── Grille tarifaire TER Grand Est – Abonnements 2024 ───────────────────────
//
// Source : grilles officielles TER Grand Est (ter.sncf.com/grand-est)
// ⚠️  Tarifs indicatifs – à vérifier et mettre à jour sur ter.sncf.com/grand-est
//
// Structure : { day: €/aller simple, week: €/abonnement hebdo, month: €/abonnement mensuel }
// Clé       : IDs triés alphabétiquement, séparés par '-' (lookup bidirectionnel)
//
const TARIFFS_DATA = {

  // ── Liaisons Lunéville ────────────────────────────────────────────────────
  'LUNEL-NANCY':  { day: 7.90,  week: 22.90,  month: 59.00  },
  'LUNEL-METZ':   { day: 15.80, week: 45.80,  month: 118.00 },
  'LUNEL-PAMOU':  { day: 10.80, week: 31.30,  month: 80.70  },
  'LUNEL-SARR':   { day: 10.80, week: 31.30,  month: 80.70  },

  // ── Liaisons Nancy ────────────────────────────────────────────────────────
  'METZ-NANCY':   { day: 11.60, week: 33.60,  month: 86.60  },
  'NANCY-PAMOU':  { day: 6.80,  week: 19.70,  month: 50.80  },
  'NANCY-SARR':   { day: 8.80,  week: 25.50,  month: 65.70  },
  'BARLEC-NANCY': { day: 12.80, week: 37.10,  month: 95.70  },
  'NANCY-STRAS':  { day: 23.60, week: 68.40,  month: 176.30 },
  'NANCY-THION':  { day: 14.40, week: 41.70,  month: 107.60 },
  'EPINA-NANCY':  { day: 11.60, week: 33.60,  month: 86.60  },
  'NANCY-REMIR':  { day: 14.40, week: 41.70,  month: 107.60 },
  'NANCY-SDIE':   { day: 15.80, week: 45.80,  month: 118.00 },

  // ── Liaisons Metz ─────────────────────────────────────────────────────────
  'METZ-PAMOU':   { day: 8.80,  week: 25.50,  month: 65.70  },
  'METZ-THION':   { day: 8.80,  week: 25.50,  month: 65.70  },
  'FORB-METZ':    { day: 11.60, week: 33.60,  month: 86.60  },
  'METZ-SARR':    { day: 14.20, week: 41.20,  month: 106.10 },
  'METZ-STRAS':   { day: 21.70, week: 62.90,  month: 162.10 },
  'BARLEC-METZ':  { day: 17.80, week: 51.60,  month: 133.00 },
  'METZ-VERDU':   { day: 16.90, week: 49.00,  month: 126.40 },

  // ── Liaisons Thionville ───────────────────────────────────────────────────
  'FORB-THION':   { day: 7.20,  week: 20.90,  month: 53.80  },
  'SARR-THION':   { day: 18.90, week: 54.80,  month: 141.20 },

  // ── Liaisons Strasbourg ───────────────────────────────────────────────────
  'COLM-STRAS':   { day: 14.20, week: 41.20,  month: 106.10 },
  'MULH-STRAS':   { day: 17.10, week: 49.60,  month: 127.80 },
  'HAGUE-STRAS':  { day: 8.10,  week: 23.50,  month: 60.50  },
  'SAVEN-STRAS':  { day: 7.20,  week: 20.90,  month: 53.80  },
  'SELES-STRAS':  { day: 11.60, week: 33.60,  month: 86.60  },
  'OBERN-STRAS':  { day: 8.10,  week: 23.50,  month: 60.50  },
  'MOLS-STRAS':   { day: 6.80,  week: 19.70,  month: 50.80  },
  'BISCK-STRAS':  { day: 6.80,  week: 19.70,  month: 50.80  },

  // ── Alsace interne ────────────────────────────────────────────────────────
  'COLM-MULH':    { day: 7.20,  week: 20.90,  month: 53.80  },
  'COLM-SELES':   { day: 7.20,  week: 20.90,  month: 53.80  },
  'MULH-SELES':   { day: 10.80, week: 31.30,  month: 80.70  },
  'COLM-HAGUE':   { day: 18.90, week: 54.80,  month: 141.20 },
};

// Lookup bidirectionnel (A→B = B→A)
function getTariff(idA, idB) {
  const key = [idA, idB].sort().join('-');
  return TARIFFS_DATA[key] || null;
}
