// ─── Optitrain — Configuration ────────────────────────────────────────────────
//
// Mets à jour AFFILIATE_URL avec ton lien partenaire quand tu en auras un.
// Ce fichier est versionné : un simple git push suffit à mettre à jour Netlify.
//
// Programmes d'affiliation compatibles (inscription gratuite) :
//   • Awin         → https://www.awin.com (cherche "Trainline" ou "Oui.sncf")
//   • Tradedoubler → https://www.tradedoubler.com
//   • Effiliation  → https://www.effiliation.com
//
// Exemple d'URL affiliée Trainline (remplace XXXXXXX par ton ID) :
//   'https://www.trainline.fr/?utm_source=optitrain&utm_medium=affiliate&aid=XXXXXXX'
//
window.OPTITRAIN_CONFIG = {

  // Lien affiché sur tous les boutons CTA (tarifs, vérification, achat)
  // ↓ Remplace par ton URL affiliée ↓
  affiliateUrl:  'https://www.sncf-connect.com/app/fr-fr/information/abonnements-trajets-reguliers',

  // Nom affiché dans le bouton (ex: "Trainline", "SNCF Connect"…)
  affiliateName: 'SNCF Connect',
};
