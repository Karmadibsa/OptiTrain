// Liste des gares – MVP Grand Est + liaisons nationales courantes
// Ajouter des gares ici pour étendre la couverture
const STATIONS_DATA = [
  // ── Lorraine ──────────────────────────────────────────────────────────────
  { id: 'NANCY',  name: 'Nancy',                  region: 'Grand Est' },
  { id: 'METZ',   name: 'Metz-Ville',             region: 'Grand Est' },
  { id: 'THION',  name: 'Thionville',             region: 'Grand Est' },
  { id: 'FORB',   name: 'Forbach',                region: 'Grand Est' },
  { id: 'LUNEL',  name: 'Lunéville',              region: 'Grand Est' },
  { id: 'PAMOU',  name: 'Pont-à-Mousson',         region: 'Grand Est' },
  { id: 'SARR',   name: 'Sarrebourg',             region: 'Grand Est' },
  { id: 'BARLEC', name: 'Bar-le-Duc',             region: 'Grand Est' },
  { id: 'VERDU',  name: 'Verdun',                 region: 'Grand Est' },
  { id: 'EPINA',  name: 'Épinal',                 region: 'Grand Est' },
  { id: 'SDIE',   name: 'Saint-Dié-des-Vosges',  region: 'Grand Est' },
  { id: 'REMIR',  name: 'Remiremont',             region: 'Grand Est' },
  { id: 'VANDE',  name: 'Vandœuvre-lès-Nancy',    region: 'Grand Est' },
  { id: 'NANCVIL',name: 'Nancy-Ville',            region: 'Grand Est' },
  { id: 'LIVERD', name: 'Liverdun',               region: 'Grand Est' },
  // ── Alsace ────────────────────────────────────────────────────────────────
  { id: 'STRAS',  name: 'Strasbourg',             region: 'Grand Est' },
  { id: 'HAGUE',  name: 'Haguenau',               region: 'Grand Est' },
  { id: 'SAVEN',  name: 'Saverne',                region: 'Grand Est' },
  { id: 'SELES',  name: 'Sélestat',               region: 'Grand Est' },
  { id: 'COLM',   name: 'Colmar',                 region: 'Grand Est' },
  { id: 'MULH',   name: 'Mulhouse-Ville',         region: 'Grand Est' },
  { id: 'BISCK',  name: 'Bischwiller',            region: 'Grand Est' },
  { id: 'OBERN',  name: 'Obernai',                region: 'Grand Est' },
  { id: 'MOLS',   name: 'Molsheim',               region: 'Grand Est' },
  // ── Champagne-Ardenne ─────────────────────────────────────────────────────
  { id: 'REIMS',  name: 'Reims',                  region: 'Grand Est' },
  { id: 'CHVIL',  name: 'Charleville-Mézières',   region: 'Grand Est' },
  { id: 'TROYE',  name: 'Troyes',                 region: 'Grand Est' },
  { id: 'CHALONS',name: 'Châlons-en-Champagne',   region: 'Grand Est' },
  // ── Liaisons nationales ───────────────────────────────────────────────────
  { id: 'PAEST',  name: 'Paris-Est',              region: 'Île-de-France' },
  { id: 'PANORD', name: 'Paris-Nord',             region: 'Île-de-France' },
  { id: 'PAGLYO', name: 'Paris-Gare-de-Lyon',     region: 'Île-de-France' },
  { id: 'LYON',   name: 'Lyon-Part-Dieu',         region: 'Auvergne-Rhône-Alpes' },
  { id: 'LILLE',  name: 'Lille-Flandres',         region: 'Hauts-de-France' },
  { id: 'METZ2',  name: 'Metz-Nord',              region: 'Grand Est' },
];
