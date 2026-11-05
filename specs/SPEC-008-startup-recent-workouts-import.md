# SPEC-008 : Proposition d'Import des Entraînements Récents à l'Ouverture

## 1. Contexte & Besoin Utilisateur
À l'ouverture de l'application TriaTrain, uniquement si :
1. L'utilisateur possède déjà un plan d'entraînement actif (`triatrain_training_plan` enregistré),
2. La connexion **Intervals.icu** est configurée (`provider === 'intervals_icu'` et `intervalsApiKey` non vide), et
3. **Il n'y a pas déjà une entrée / un entraînement importé (ou complété) dans la journée d'aujourd'hui** (afin de ne pas solliciter l'utilisateur à chaque réouverture de l'application une fois sa séance du jour importée),

l'application propose à l'utilisateur d'importer ses entraînements récents (résultats), en affichant directement le sélecteur de dates initialisé par défaut à :
- **Début (`Du`) : Aujourd'hui** (`YYYY-MM-DD` en heure locale)
- **Fin (`Au`) : Aujourd'hui** (`YYYY-MM-DD` en heure locale)

afin qu'il puisse importer sa séance du jour en 1 clic ou choisir d'autres dates dès l'ouverture (avec également des raccourcis rapides : *Aujourd'hui*, *Hier & Aujourd'hui*, *Cette semaine*, *7 derniers jours*), ou fermer via *« Plus tard »*.

## 2. Solution Technique
1. **Détection à l'ouverture dans [`src/App.tsx`](file:///c:/Users/felix/.gemini/antigravity-ide/scratch/TriaTrain/src/App.tsx)** :
   - Dans le `useEffect` d'initialisation, vérifie `hasActivePlan`, `hasIntervalsConfigured` et `!alreadyHasEntryToday` (aucune séance du jour `wo.date === todayIso` déjà importée `wo.garminActivity` ou validée `wo.status === 'completed'`, ni aucune `garminActivity.startDateLocal === todayIso`).
   - Ouvre automatiquement [`GarminSyncModal`](file:///c:/Users/felix/.gemini/antigravity-ide/scratch/TriaTrain/src/components/GarminSyncModal.tsx) en mode `isStartupPrompt = true` uniquement si ces 3 conditions sont réunies.
2. **Mode d'import à l'ouverture dans [`src/components/GarminSyncModal.tsx`](file:///c:/Users/felix/.gemini/antigravity-ide/scratch/TriaTrain/src/components/GarminSyncModal.tsx)** :
   - Positionne automatiquement l'onglet sur `pull_results` (*Importer Sorties*).
   - Initialise `oldestDate` et `newestDate` à la date locale d'**aujourd'hui** (`todayIso`).
   - Affiche une bannière d'accueil *« 👋 Voulez-vous importer vos entraînements récents ? »* avec un bouton rapide *« Plus tard »* pour accéder directement au calendrier si souhaité.
   - Ajoute des raccourcis de dates (*📍 Aujourd'hui*, *⏪ Hier & Aujourd'hui*, *📅 Cette semaine*, *🗓️ 7 derniers jours*) en complément des deux champs `<input type="date" />`.
   - Permet d'associer les activités récupérées aux séances de **toutes les semaines du plan** couvertes par les dates choisies.
