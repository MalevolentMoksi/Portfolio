/**
 * Shared projects data (translation keys + static assets)
 */

import type { TFunction } from 'i18next';
import type {
  AcademicProjectBase,
  AcademicProject,
  PersonalProjectBase,
  PersonalProject,
} from '@/types';

const academicProjectsBase: AcademicProjectBase[] = [
  {
    id: 'sae301',
    path: '/projet-SAE3.01',
    typeKey: 'data.projects.academic.sae301.type',
    titleKey: 'data.projects.academic.sae301.title',
    categoryKey: 'data.projects.academic.sae301.category',
    descriptionKey: 'data.projects.academic.sae301.description',
    teamSizeKey: 'data.projects.academic.sae301.teamSize',
    image: '/assets/images/projects/AidemePresentation.png',
    tagKeys: ['react', 'php', 'sqlite', 'vite', 'apiRest', 'git'],
    technologies: [
      {
        name: 'React',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/react.svg',
      },
      {
        name: 'Vite',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/vite.svg',
      },
      {
        name: 'PHP',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/php.svg',
      },
      {
        name: 'SQLite',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/sqlite.svg',
      },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
    ],
  },
  {
    id: 'megasae',
    path: '/projet-MEGASAE',
    typeKey: 'data.projects.academic.megasae.type',
    titleKey: 'data.projects.academic.megasae.title',
    categoryKey: 'data.projects.academic.megasae.category',
    descriptionKey: 'data.projects.academic.megasae.description',
    teamSizeKey: 'data.projects.academic.megasae.teamSize',
    image: '/assets/images/projects/banquets-MEGASAE.jpg',
    tagKeys: ['java', 'javafx', 'maven', 'sql', 'git'],
    technologies: [
      { name: 'Java', icon: '/assets/images/logos/JavaAltLogo.svg' },
      { name: 'JavaFX', icon: '/assets/images/logos/JavaFXLogo.svg' },
      {
        name: 'Maven',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apachemaven.svg',
      },
      { name: 'JUnit 5', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/junit5.svg' },
      {
        name: 'SQLite',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/sqlite.svg',
      },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
      { name: 'Figma', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/figma.svg' },
    ],
  },
  {
    id: 'sae56',
    path: '/projet-SAE56',
    typeKey: 'data.projects.academic.sae56.type',
    titleKey: 'data.projects.academic.sae56.title',
    categoryKey: 'data.projects.academic.sae56.category',
    descriptionKey: 'data.projects.academic.sae56.description',
    teamSizeKey: 'data.projects.academic.sae56.teamSize',
    image: '/assets/images/projects/SopraSteriaIllustration.webp',
    tagKeys: ['html', 'css', 'javascript', 'figma', 'git'],
    technologies: [
      { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/html5.svg' },
      { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/css3.svg' },
      {
        name: 'JavaScript',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/javascript.svg',
      },
      { name: 'Figma', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/figma.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
    ],
  },
  {
    id: 'sae3',
    path: '/projet-SAE3',
    typeKey: 'data.projects.academic.sae3.type',
    titleKey: 'data.projects.academic.sae3.title',
    categoryKey: 'data.projects.academic.sae3.category',
    descriptionKey: 'data.projects.academic.sae3.description',
    teamSizeKey: 'data.projects.academic.sae3.teamSize',
    image: '/assets/images/projects/PosteTravailLinux.png',
    tagKeys: ['linux', 'bash', 'git', 'virtualbox'],
    technologies: [
      { name: 'Linux', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linux.svg' },
      {
        name: 'VirtualBox',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/virtualbox.svg',
      },
      {
        name: 'VS Code',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/visualstudiocode.svg',
      },
      {
        name: 'IntelliJ IDEA',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/intellijidea.svg',
      },
      { name: 'Bash', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gnubash.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
    ],
  },
  {
    id: 'sae12',
    path: '/projet-SAE12',
    typeKey: 'data.projects.academic.sae12.type',
    titleKey: 'data.projects.academic.sae12.title',
    categoryKey: 'data.projects.academic.sae12.category',
    descriptionKey: 'data.projects.academic.sae12.description',
    teamSizeKey: 'data.projects.academic.sae12.teamSize',
    image: '/assets/images/projects/algorithm.jpg',
    video: '/assets/videos/LoopingAlgorithmsVideo.mp4',
    tagKeys: ['java', 'algorithms', 'git'],
    technologies: [
      { name: 'Java', icon: '/assets/images/logos/JavaAltLogo.svg' },
      {
        name: 'IntelliJ IDEA',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/intellijidea.svg',
      },
    ],
  },
  {
    id: 'sae401',
    path: '/projet-SAE401',
    typeKey: 'data.projects.academic.sae401.type',
    titleKey: 'data.projects.academic.sae401.title',
    categoryKey: 'data.projects.academic.sae401.category',
    descriptionKey: 'data.projects.academic.sae401.description',
    teamSizeKey: 'data.projects.academic.sae401.teamSize',
    image: '/assets/images/projects/DatabaseIllustration.webp',
    tagKeys: ['android', 'java', 'php', 'symfony', 'postgresql', 'docker', 'cypress', 'git'],
    technologies: [
      { name: 'Android', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/android.svg' },
      { name: 'Java', icon: '/assets/images/logos/JavaAltLogo.svg' },
      { name: 'Symfony', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/symfony.svg' },
      { name: 'PHP', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/php.svg' },
      {
        name: 'PostgreSQL',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/postgresql.svg',
      },
      { name: 'Docker', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/docker.svg' },
      { name: 'Cypress', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/cypress.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
    ],
  },
  {
    id: 'sae4',
    path: '/projet-SAE4',
    typeKey: 'data.projects.academic.sae4.type',
    titleKey: 'data.projects.academic.sae4.title',
    categoryKey: 'data.projects.academic.sae4.category',
    descriptionKey: 'data.projects.academic.sae4.description',
    teamSizeKey: 'data.projects.academic.sae4.teamSize',
    image: '/assets/images/projects/DatabaseIllustration.webp',
    tagKeys: ['sql', 'postgresql', 'database'],
    technologies: [
      {
        name: 'PostgreSQL',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/postgresql.svg',
      },
      {
        name: 'SQL',
        icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/databricks.svg',
      },
    ],
  },
];

const personalProjectsBase: PersonalProjectBase[] = [
  {
    id: 'discord-bot',
    titleKey: 'data.projects.personal.discordBot.title',
    descriptionKey: 'data.projects.personal.discordBot.description',
    tagKeys: ['javascript', 'discord', 'python', 'sql', 'ai'],
    image: '/assets/images/projects/MoksisBazaarIllustration.png',
    link: 'https://github.com/MalevolentMoksi/Moksi-Bazaar',
  },
  {
    id: 'drawings',
    titleKey: 'data.projects.personal.drawings.title',
    descriptionKey: 'data.projects.personal.drawings.description',
    tagKeys: ['art', 'drawing', 'creation'],
    image: '/assets/images/drawings/',
  },
  {
    id: 'scratch-games',
    titleKey: 'data.projects.personal.scratchGames.title',
    descriptionKey: 'data.projects.personal.scratchGames.description',
    tagKeys: ['scratch', 'games', 'visualProgramming'],
    image: '/assets/images/scratch.png',
  },
];

const translate = (t: TFunction | undefined, key: string, defaultValue: string): string => {
  if (typeof t !== 'function') return defaultValue;
  return t(key, { defaultValue }) as string;
};

const resolveTag = (t: TFunction | undefined, key: string): string =>
  translate(t, `data.projects.tags.${key}`, key);

export const getAcademicProjects = (t?: TFunction): AcademicProject[] =>
  academicProjectsBase.map((project) => ({
    ...project,
    type: translate(t, project.typeKey, project.typeKey),
    title: translate(t, project.titleKey, project.titleKey),
    category: translate(t, project.categoryKey, project.categoryKey),
    description: translate(t, project.descriptionKey, project.descriptionKey),
    teamSize: translate(t, project.teamSizeKey, project.teamSizeKey),
    tags: project.tagKeys.map((key) => resolveTag(t, key)),
  }));

export const getPersonalProjects = (t?: TFunction): PersonalProject[] =>
  personalProjectsBase.map((project) => ({
    ...project,
    title: translate(t, project.titleKey, project.titleKey),
    description: translate(t, project.descriptionKey, project.descriptionKey),
    tags: project.tagKeys.map((key) => resolveTag(t, key)),
  }));

/**
 * Récupère tous les tags uniques de tous les projets
 */
export const getAllTags = (t?: TFunction): string[] => {
  const academicTags = getAcademicProjects(t).flatMap((p) => p.tags);
  const personalTags = getPersonalProjects(t).flatMap((p) => p.tags);
  const allTags = [...new Set([...academicTags, ...personalTags])];
  return allTags.sort();
};

/**
 * Filtre les projets académiques par tags
 */
export const filterAcademicProjects = (
  selectedTags: string[],
  t?: TFunction
): AcademicProject[] => {
  const academicProjects = getAcademicProjects(t);
  if (selectedTags.length === 0) return academicProjects;
  return academicProjects.filter((project) =>
    selectedTags.every((tag) => project.tags.includes(tag))
  );
};

/**
 * Filtre les projets personnels par tags
 */
export const filterPersonalProjects = (
  selectedTags: string[],
  t?: TFunction
): PersonalProject[] => {
  const personalProjects = getPersonalProjects(t);
  if (selectedTags.length === 0) return personalProjects;
  return personalProjects.filter((project) =>
    selectedTags.every((tag) => project.tags.includes(tag))
  );
};
