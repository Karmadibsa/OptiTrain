# 🚄 OptiTrain

**L'optimisateur de budget transport pour apprentis malins.**

OptiTrain est une application web ultra-légère et esthétique conçue pour aider les étudiants et alternants à choisir la meilleure formule de transport (Train/TER) en fonction de leur emploi du temps.

🔗 **Démo en direct** : (Ajoute ton lien Vercel/Netlify ici si tu en as un)

## ✨ Fonctionnalités

- **Comparateur Intelligent** : Analyse votre planning mensuel et compare le coût d'un abonnement mensuel fixe vs un mélange flexible d'abonnements hebdomadaires et de tickets journaliers.
- **Règle de Gestion** :
  - *Flex (Hebdo)* : Si présence ≥ 2 jours/semaine.
  - *Ticket* : Si présence < 2 jours/semaine.
- **Interface Moderne** : Design "Glassmorphism", mode sombre, animations fluides et entièrement responsive.
- **Sauvegarde Automatique** : Vos tarifs et votre planning sont sauvegardés dans votre navigateur (LocalStorage).
- **Fun Facts** : Un petit convertisseur humoristique pour visualiser vos économies (en kebabs, cafés, etc.).

## 🛠️ Installation & Utilisation

1. **Cloner le projet**
   ```bash
   git clone https://github.com/Karmadibsa/OptiTrain.git
   cd OptiTrain
   ```

2. **Lancer l'application**
   Il suffit d'ouvrir le fichier `index.html` dans n'importe quel navigateur web moderne.
   
   Ou via un serveur local (recommandé pour le développement) :
   ```bash
   npx serve .
   ```

## 💻 Technologies

- **HTML5** : Structure sémantique.
- **CSS3** : Variables, Flexbox, Grid, Animations, Glassmorphism (pas de framework lourd).
- **JavaScript (Vanilla)** : Logique de calcul et manipulation du DOM.
- **Font** : Outfit (Google Fonts).

## 🚀 Contribuer

Les suggestions et Pull Requests sont les bienvenues !
1. Fork le projet
2. Crée ta branche (`git checkout -b feature/AmazingFeature`)
3. Commit tes changements (`git commit -m 'Add some AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvre une Pull Request

## 📄 Licence

Distribué sous la licence MIT. Voir `LICENSE` pour plus d'informations.

---
*Développé avec ❤️ (et un peu de caféine) pour les alternants fauchés.*
