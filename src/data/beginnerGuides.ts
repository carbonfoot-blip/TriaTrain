export interface TransitionStep {
  id: string;
  order: number;
  title: string;
  action: string;
  criticalRule?: string;
  proTip: string;
}

export interface GearItem {
  id: string;
  category: 'swim' | 'bike' | 'run' | 'transition' | 'nutrition';
  name: string;
  essential: boolean;
  notes: string;
}

export interface NutritionGuide {
  distance: string;
  bikeCarbsPerHour: string;
  runCarbsPerHour: string;
  hydrationPerHour: string;
  keyAdvice: string[];
}

export const T1_STEPS: TransitionStep[] = [
  {
    id: 't1-1',
    order: 1,
    title: 'Sortie de l\'eau & Déshabillage',
    action: 'Dès la sortie de l\'eau, remontez les lunettes sur le front ou dans la main, baissez la fermeture éclair de la combinaison et retirez le haut jusqu\'à la taille tout en trottinant vers le parc à vélo.',
    proTip: 'Ne retirez pas le bonnet immédiatement s\'il fait froid, mais gardez les mains libres pour tirer sur la combi.',
  },
  {
    id: 't1-2',
    order: 2,
    title: 'Repérage de l\'emplacement vélo',
    action: 'Courrez vers votre allée identifiée au préalable (repérez un arbre ou une banderole distinctive).',
    proTip: 'Comptez le nombre d\'arceaux depuis l\'entrée du parc lors de la reconnaissance matinale.',
  },
  {
    id: 't1-3',
    order: 3,
    title: 'Retrait complet de la combinaison',
    action: 'Baissez la combinaison jusqu\'aux chevilles et sortez les pieds d\'un coup sec en appuyant avec le pied opposé sur la cheville.',
    proTip: 'Mettez un peu de BodyGlide ou d\'huile sur le bas des mollets pour que la néoprène glisse instantanément.',
  },
  {
    id: 't1-4',
    order: 4,
    title: 'Casque & Lunettes (RÈGLE ARBITRAGE STRICTE)',
    action: 'Mettez vos lunettes de soleil, puis enfilez votre casque et ATTACHEZ LA JUGULAIRE IMMÉDIATEMENT.',
    criticalRule: 'INTERDICTION FORMELLE de toucher à votre vélo tant que la jugulaire du casque n\'est pas fermée et verrouillée (Risque de carton ou disqualification immédiate).',
    proTip: 'Laissez votre casque ouvert posé à l\'envers sur votre guidon avec les sangles écartées et les lunettes déjà ouvertes dedans.',
  },
  {
    id: 't1-5',
    order: 5,
    title: 'Porte-dossard & Chaussures de vélo',
    action: 'Enfilez la ceinture porte-dossard (placée DANS LE DOS pour la partie vélo). Enfilez vos chaussures vélo.',
    proTip: 'Pour les débutants, chaussez-vous à votre emplacement plutôt que de tenter la montée acrobatique pieds nus sur les pédales.',
  },
  {
    id: 't1-6',
    order: 6,
    title: 'Décrochage du vélo et Ligne de montée',
    action: 'Décrochez le vélo et poussez-le par la selle ou le cintre en courant vers la sortie du parc jusqu\'à la LIGNE DE MONTÉE (Mount Line marquée au sol par les arbitres).',
    criticalRule: 'Vous ne devez monter sur le vélo qu\'APRÈS avoir franchi la ligne blanche de montée.',
    proTip: 'Regardez loin devant et engagez un braquet souple avant de poser le vélo le matin pour démarrer facilement.',
  },
];

export const T2_STEPS: TransitionStep[] = [
  {
    id: 't2-1',
    order: 1,
    title: 'Fin du parcours vélo & Ligne de descente',
    action: 'À l\'approche du parc, ralentissez, rétrogradez et descendez du vélo AVANT la ligne blanche de descente (Dismount Line).',
    criticalRule: 'Posez pied à terre impérativement AVANT la ligne sous peine de pénalité de temps (Stop & Go).',
    proTip: 'Déchaussez les pieds des chaussures si vous êtes à l\'aise, ou courez avec vos cales en trottinant sur les talons.',
  },
  {
    id: 't2-2',
    order: 2,
    title: 'Raccrochage du vélo',
    action: 'Poussez le vélo jusqu\'à votre emplacement exact et raccrochez-le par la selle ou les cocottes de frein.',
    criticalRule: 'Votre vélo doit être correctement suspendu avant de toucher à votre casque.',
    proTip: 'Prenez 2 secondes pour bien stabiliser le vélo afin qu\'il ne bascule pas sur les vélos voisins.',
  },
  {
    id: 't2-3',
    order: 3,
    title: 'Retrait du casque & Chaussettes/Chaussures',
    action: 'Détachez le casque et posez-le au sol. Enfilez vos chaussures de course à pied munies de lacets élastiques autobloquants.',
    proTip: 'Utilisez du talc à l\'intérieur des chaussures de running pour enfiler vos pieds mouillés ou transpirants en 1 seconde chrono.',
  },
  {
    id: 't2-4',
    order: 4,
    title: 'Ajustement du dossard, Visière et Gels',
    action: 'Pivotez la ceinture porte-dossard vers l\'AVANT (sur le ventre), mettez votre casquette/visière, attrapez vos gels et partez.',
    criticalRule: 'Le numéro de dossard DOIT être visible sur le ventre/poitrine pendant toute la course à pied.',
    proTip: 'Prenez une première gorgée d\'eau dès le premier ravitaillement pour relancer la digestion après l\'effort vélo.',
  },
];

export const GEAR_CHECKLIST: GearItem[] = [
  // Natation
  { id: 'g-1', category: 'swim', name: 'Trifonction (tenue unique 3-en-1)', essential: true, notes: 'Se porte sous la combinaison et toute la course' },
  { id: 'g-2', category: 'swim', name: 'Combinaison néoprène (wetsuit)', essential: true, notes: 'Obligatoire si eau < 16°C, autorisée jusqu\'à 24.5°C' },
  { id: 'g-3', category: 'swim', name: 'Lunettes de natation (verres fumés / clairs)', essential: true, notes: 'Prendre 2 paires (une claire, une teintée selon le soleil)' },
  { id: 'g-4', category: 'swim', name: 'Bonnet officiel de course', essential: true, notes: 'Fourni par l\'organisateur lors du retrait des dossards' },
  { id: 'g-5', category: 'swim', name: 'Stick anti-frottement (BodyGlide / Vaseline)', essential: false, notes: 'À appliquer sur le cou et les chevilles' },
  // Vélo
  { id: 'g-6', category: 'bike', name: 'Vélo révisé et pneus gonflés', essential: true, notes: 'Vérifier la pression le matin de course (6-7 bars selon pneus)' },
  { id: 'g-7', category: 'bike', name: 'Casque homologué avec jugulaire', essential: true, notes: 'Contrôlé obligatoirement à l\'entrée du parc' },
  { id: 'g-8', category: 'bike', name: 'Chaussures de vélo / cales', essential: true, notes: 'Serrages vérifiés' },
  { id: 'g-9', category: 'bike', name: 'Ceinture porte-dossard triathlon', essential: true, notes: 'Évite de trouer la trifonction avec des épingles' },
  { id: 'g-10', category: 'bike', name: 'Bidons d\'eau et boisson isotonique', essential: true, notes: '1 ou 2 bidons selon la distance' },
  { id: 'g-11', category: 'bike', name: 'Kit anti-crevaison (chambre + démonte-pneu + CO2)', essential: true, notes: 'Fixé sous la selle ou dans la sacoche cadre' },
  { id: 'g-12', category: 'bike', name: 'Compteur GPS / Montre connectée', essential: false, notes: 'Pour gérer son allure et sa puissance' },
  // Course
  { id: 'g-13', category: 'run', name: 'Chaussures de running avec lacets rapides', essential: true, notes: 'Lacets élastiques pour gagner 30 secondes en T2' },
  { id: 'g-14', category: 'run', name: 'Casquette ou visière respirante', essential: false, notes: 'Protection soleil et maintien de la tête au frais' },
  { id: 'g-15', category: 'run', name: 'Gels énergétiques / pâtes de fruits', essential: true, notes: 'Testés au préalable à l\'entraînement' },
  { id: 'g-16', category: 'run', name: 'Chaussettes techniques fines', essential: false, notes: 'Facultatif sur S, recommandé sur M et 70.3' },
  // Transition & Divers
  { id: 'g-17', category: 'transition', name: 'Serviette microfibre petite taille', essential: false, notes: 'Pour poser les pieds et essuyer le sable en T1' },
  { id: 'g-18', category: 'transition', name: 'Puce de chronométrage (à la cheville gauche)', essential: true, notes: 'Cheville GAUCHE pour ne pas la coincer dans la chaîne du vélo !' },
  { id: 'g-19', category: 'transition', name: 'Pièce d\'identité & Licence triathlon', essential: true, notes: 'Indispensable pour retirer le dossard le samedi' },
];

export const NUTRITION_GUIDES: Record<string, NutritionGuide> = {
  xs: {
    distance: 'Triathlon XS (Découverte)',
    bikeCarbsPerHour: '0 - 20g / heure',
    runCarbsPerHour: '0g',
    hydrationPerHour: '400 - 500 ml d\'eau',
    keyAdvice: [
      'Effort très court (< 1 heure) : les réserves corporelles de glycogène suffisent amplement.',
      'Buvez quelques gorgées d\'eau fraîche sur la première moitié du vélo.',
      'Ne prenez pas de gels qui risqueraient de provoquer des troubles digestifs inutiles.',
    ],
  },
  s: {
    distance: 'Triathlon S (Sprint - ~1h05 à 1h35)',
    bikeCarbsPerHour: '30 - 45g / heure',
    runCarbsPerHour: '0 - 15g (1 gorgée au ravito)',
    hydrationPerHour: '500 ml d\'eau avec électrolytes',
    keyAdvice: [
      'Prenez 1 bidon avec une boisson isotonique légère sur le vélo.',
      'Commencez à boire après 5 minutes de vélo dès que le rythme cardiaque s\'est stabilisé après l\'eau.',
      '1 gel énergétique liquide à mi-parcours vélo si besoin, rien d\'obligatoire sur les 5km à pied.',
    ],
  },
  m: {
    distance: 'Triathlon M (Olympique - ~2h15 à 3h15)',
    bikeCarbsPerHour: '50 - 65g / heure',
    runCarbsPerHour: '30 - 40g / heure',
    hydrationPerHour: '600 - 800 ml / heure avec sodium',
    keyAdvice: [
      'Le vélo est votre salle à manger : buvez toutes les 10-12 minutes et consommez 1 gel ou 1/2 barre toutes les 25 minutes.',
      'Finissez votre dernier apport solide au moins 10 minutes avant la fin du vélo.',
      'Sur les 10km à pied, prenez 1 gel au km 4-5 avec un verre d\'eau au ravitaillement.',
      'Testez TOUS vos gels et boissons lors des sorties longues du samedi.',
    ],
  },
  l: {
    distance: 'Triathlon L (Half 70.3 - ~4h30 à 6h30)',
    bikeCarbsPerHour: '60 - 85g / heure',
    runCarbsPerHour: '45 - 60g / heure',
    hydrationPerHour: '700 - 900 ml / heure (500-800mg Sodium)',
    keyAdvice: [
      'La 4ème discipline du 70.3 est la nutrition : si vous oubliez de manger à vélo, vous marcherez sur le semi-marathon.',
      'Préparez 2 bidons concentrés sur le vélo et récupérez de l\'eau claire aux ravitaillements.',
      'Privilégiez les glucides à double source (Glucose + Fructose ratio 2:1 ou 1:0.8) pour maximiser l\'absorption intestinale.',
      'Sur le semi-marathon, alternez eau, boisson énergétique et un peu de sel.',
    ],
  },
  xl: {
    distance: 'Triathlon XL (Ironman 140.6 - ~9h30 à 15h30)',
    bikeCarbsPerHour: '75 - 95g / heure',
    runCarbsPerHour: '50 - 70g / heure',
    hydrationPerHour: '750 - 1000 ml / heure avec électrolytes complets',
    keyAdvice: [
      'Régularité métronomique : programmez une alarme montre toutes les 15 minutes pour vous forcer à vous alimenter.',
      'Prévoyez du salé (tucs, bouillon, barres salées) pour éviter l\'écœurement du goût sucré après 4h de vélo.',
      'Gestion stricte du sodium pour éviter crampes et hyponatrémie.',
      'Sur le marathon, consommez des petites portions très fréquentes (fond de gobelet + morceaux de bananes/gels).',
    ],
  },
};
