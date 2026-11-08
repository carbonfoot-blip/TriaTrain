# SPEC-010 : Préservation des Séances Complétées, Moteur d'Analyse Coach IA & Version 1.3

## 1. Objectifs Fonctionnels
1. **Préservation des entraînements complétés / importés (Profil & Semaine Type)** :
   - Toute modification du profil (FC max, FC repos, FTP Vélo, CSS Nage, VMA / allures course, objectif) ou de la Semaine Type recalcule les allures/zones et les séances futures planifiées **sans jamais écraser ni supprimer les séances déjà complétées (`status === 'completed'`) ou importées depuis Garmin / Intervals.icu (`Boolean(garminActivity)`)**.
2. **Moteur d'Analyse d'Entraînement & Coach IA (Bilan Lundi AM & Sur Demande)** :
   - S'affiche automatiquement le **lundi matin** à l'ouverture (une seule fois pour la journée si des entraînements ont été réalisés) ou **sur demande** à tout moment via le bouton `🧠 Bilan & Conseils Coach` du tableau de bord.
   - Analyse les entraînements récents (semaine écoulée, semaine en cours et progression globale), félicite ou encourage l'athlète, indique précisément où il se situe par rapport à son objectif (`Readiness Score %` et statut), et fournit des recommandations concrètes sur 4 axes : **Volume**, **Intensité & Cardio**, **Éducatifs (Drills)** et **Ajustements d'entraînements**.
3. **Version 1.3** :
   - Mise à jour de `WhatsNewModal.tsx` et du pied de page avec la **Version 1.3**.

