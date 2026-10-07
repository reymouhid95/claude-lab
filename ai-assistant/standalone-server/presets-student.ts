/**
 * Presets de shots vidéo adaptés pour les étudiants Swiss Umef.
 * Basés sur les 20 presets de PromptLens, personnalisés par niveau d'étude.
 */
import type { Preset } from "../../types";

/**
 * Presets de base (communs à tous les niveaux)
 * Issus du core de PromptLens + adaptations légères
 */
export const CORE_STUDENT_PRESETS: Preset[] = [
  {
    id: "presentation",
    name: "Présentation",
    shotSize: "Plan moyen",
    cameraAngle: "Être",
    focalLength: "35 mm",
    lighting: "Lumière clé + remplissage",
    mood: "Professionnel",
    generationPrompt:
      "Une scène de présentation vidéo avec un sujet au centre du cadre, lumière clé principale et lumière de remplissage atténuée pour éviter les ombres dures, arrière-plan flou suggérant un environnement de travail ou académique. Idéal pour présenter un projet, un TP ou une idée de startup.",
  },
  {
    id: "gros-plan-interview",
    name: "Gros plan interview",
    shotSize: "Gros plan",
    cameraAngle: "Face, hauteur des yeux",
    focalLength: "85 mm",
    lighting: "Lumière douce latérale, une source",
    mood: "Interrogé",
    generationPrompt:
      "Gros plan d'un visage face caméra, lumière douce venant d'un côté, arrière-plan flou, grain de pellicule léger. Parfait pour des interviews enregistrées, des témoignages d'étudiants ou des présentations de projets de fin d'études.",
  },
  {
    id: "plan-large-environnement",
    name: "Plan large environnement",
    shotSize: "Plan large",
    cameraAngle: "Face, hauteur poitrine",
    focalLength: "24 mm",
    lighting: "Lumière du jour, ombres marquées",
    mood: "Espace",
    generationPrompt:
      "Plan large d'un personnage dans un espace vaste (studio, laboratoire, amphi), lumière du jour traversant les fenêtres, ombres géométriques au sol. Utile pour montrer l'espace de travail, les installations de l'école ou le contexte d'apprentissage.",
  },
  {
    id: "plan-travail",
    name: "Plan de travail",
    shotSize: "Plan taille",
    cameraAngle: "Face, légèrement trois-quarts",
    focalLength: "50 mm",
    lighting: "Lumière naturelle diffuse",
    mood: "Travail",
    generationPrompt:
      "Plan taille d'un étudiant en train de travailler sur un ordinateur ou des notes, lumière de fenêtre diffuse, arrière-plan de bureau légèrement flou. Idéal pour les tutoriels, les démo de code ou les présentations de résultats de recherche.",
  },
  {
    id: "shot-atelier",
    name: "Shot atelier",
    shotSize: "Plan taille",
    cameraAngle: "Face, légèrement trois-quarts",
    focalLength: "50 mm",
    lighting: "Lumière d'atelier, sources multiples",
    mood: "Travail",
    generationPrompt:
      "Plan taille d'un étudiant en train de travailler sur un projet de production vidéo, lumière d'atelier avec plusieurs sources visibles, ambiance lumineuse dynamique. Parfait pour les démonstrations pratiques et les ateliers hands-on.",
  },
];

/**
 * Presets par niveau d'étude
 * Personnalisés selon les priorités et le contexte de chaque filière
 */
export const LEVEL_PRESETS: Record<string, Preset[]> = {
  master1: [
    // Pour Master 1 IA & Cybersécurité : focus sur l'aspect "analytique/documentation"
    {
      id: "analyse-cyber",
      name: "Analyse cybersécurité",
      shotSize: "Plan moyen",
      cameraAngle: "Face",
      focalLength: "50 mm",
      lighting: "Lumière plate, deux sources",
      mood: "Analytique",
      generationPrompt:
        "Plan média d'un étudiant présentant une analyse de vulnérabilité ou un rapport de sécurité informatique, lumière uniforme sans ombres marquées, arrière-plan épuré avec éventuellement un schéma de threat modeling visible. Idéal pour les présentations de mémoires ou de projets de recherche en cybersécurité.",
    },
    {
      id: "script-recherche",
      name: "Script recherche",
      shotSize: "Plan moyen",
      cameraAngle: "Trois-quarts",
      focalLength: "35 mm",
      lighting: "Lumière clé + retour",
      mood: "Structuré",
      generationPrompt:
        "Plan média d'un étudiant lisant ou présentant un script de recherche en cybersécurité, éclairage équilibré permettant de lire des notes sur le côté, arrière-plan modéré. Utile pour les présentations de méthodologie ou de preuve de concept.",
    },
  ],
  master2: [
    // Pour Master 2 Cybersécurité : focus sur l'aspect technique/expertise
    {
      id: "threat-intel",
      name: "Threat Intelligence",
      shotSize: "Plan moyen",
      cameraAngle: "Face, légèrement surélévée",
      focalLength: "50 mm",
      lighting: "Lumière dure latérale, ombres définies",
      mood: "Expert",
      generationPrompt:
        "Plan média d'un expert en cybersécurité présentant des résultats de Threat Intelligence, éclairage dramatique avec ombres marquées qui symbolisent le côté 'sombre' du cyberespace, arrière-plan avec icônes de vecteurs d'attaque subtiles. Pour les conférences, présentations de recherche avancée.",
    },
    {
      id: "zero-trust",
      name: "Zero-Trust Architecture",
      shotSize: "Plan moyen",
      cameraAngle: "Face",
      focalLength: "35 mm",
      lighting: "Lumière froide, setup technique",
      mood: "Technique",
      generationPrompt:
        "Plan média présentant l'architecture Zero-Trust en cybersécurité, éclairage froid/blanc typique des environnements techniques, arrière-plan avec schémas de réseau, zéro confiance visuelle. Idéal pour les présentations de architectures de sécurité avancées.",
    },
  ],
  licence: [
    // Pour Licence Multimédia : focus sur la créativité et production
    {
      id: "storyboard-plan",
      name: "Plan storyboard",
      shotSize: "Plan moyen",
      cameraAngle: "Face",
      focalLength: "35 mm",
      lighting: "Lumière naturelle fenêtre",
      mood: "Créatif",
      generationPrompt:
        "Plan média d'un étudiant présentant un plan de storyboard pour un court métrage, éclairage naturel doux venant d'une fenêtre, arrière-plan avec des esquisses ou des images de référence collées. Utile pour les présentations de projets créatifs et de scénarios.",
    },
    {
      id: "montage-preview",
      name: "Aperçu montage",
      shotSize: "Plan taille",
      cameraAngle: "Face",
      focalLength: "50 mm",
      lighting: "Lumière de studio constante",
      mood: "Production",
      generationPrompt:
        "Plan média d'un étudiant montrant les résultats d'un montage vidéo, éclairage de studio constant sans ombres marquées, arrière-plan avec chronologie de montage visible sur écran. Pour les démo de projets vidéo finalisés.",
    },
  ],
  alternance: [
    // Pour Alternance ATA SUARL : focus sur la production réelle
    {
      id: "studio-tournage",
      name: "Studio tournage",
      shotSize: "Plan moyen",
      cameraAngle: "Multi-angle (16mm/35mm)",
      focalLength: "24-50 mm",
      lighting: "Trois points lumière + éclairage dynamique",
      mood: "Production",
      generationPrompt:
        "Plan média d'un plateau de tournage ATA SUARL avec matériel professionnel, éclairage complet setup trois pointslumière, présence caméra et crew visible en arrière-plan. Idéal pour présenter des projets clients réels, des campagnes publicinaires ou des productions de studio.",
    },
    {
      id: "montage-final",
      name: "Montage final",
      shotSize: "Plan montage",
      cameraAngle: "Monteur vue",
      focalLength: "35 mm",
      lighting: "Lumière de monteur",
      mood: "Post-production",
      generationPrompt:
        "Plan média montrant un poste de montage vidéo avec logiciel d'édition ouvert, séquences vidéo en cours d'édition, couleur grading en cours, audio mixing visible. Pour présenter les résultats finis de projets de production ATA SUARL.",
    },
  ],
};

/**
 * Tous les presets combinés (core + par niveau)
 * Ordre : d'abord les presets communs, ensuite ceux du niveau spécifique
 */
export const ALL_PRESETS: Record<string, Preset[]> = {
  master1: [...CORE_STUDENT_PRESETS, ...LEVEL_PRESETS.master1],
  master2: [...CORE_STUDENT_PRESETS, ...LEVEL_PRESETS.master2],
  licence: [...CORE_STUDENT_PRESETS, ...LEVEL_PRESETS.licence],
  alternance: [...CORE_STUDENT_PRESETS, ...LEVEL_PRESETS.alternance],
};

/**
 * Fonction utilitaire : obtenir les presets pour un niveau donné
 */
export function getPresetsForLevel(level: string): Preset[] {
  return ALL_PRESETS[level] || ALL_PRESETS.master1;
}

/**
 * Fonction utilitaire : trouver un preset par ID
 */
export function findPresetById(level: string, presetId: string): Preset | undefined {
  const presets = getPresetsForLevel(level);
  return presets.find(p => p.id === presetId);
}