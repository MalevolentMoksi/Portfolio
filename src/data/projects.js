/**
 * Shared Projects Data
 * Contient tous les projets (académiques et personnels) avec leurs tags
 */

export const academicProjects = [
  {
    id: 'megasae',
    path: '/projet-MEGASAE',
    type: 'Projet',
    title: 'Application d\'organisation de banquets',
    category: 'Projet cardinal',
    description: 'Développement à partir de zéro d\'une application qui pourrait planifier des événements dans des salles pour un utilisateur.',
    teamSize: 'En hexanome (6 personnes)',
    image: '/assets/images/banquets-MEGASAE.webp',
    tags: ['Java', 'JavaFX', 'Maven', 'SQL', 'Git'],
    technologies: [
      { name: 'Java', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openjdk.svg' },
      { name: 'JavaFX', icon: '/assets/images/JavaFX.svg' },
      { name: 'Maven', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apachemaven.svg' },
      { name: 'JUnit 5', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/junit5.svg' },
      { name: 'SQLite', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/sqlite.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
      { name: 'Figma', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/figma.svg' },
    ],
  },
  {
    id: 'sae56',
    path: '/projet-SAE56',
    type: 'Projet SAE',
    title: 'Recueil de besoins | Découverte de l\'environnement économique et écologique',
    category: 'SAE 5-6',
    description: 'La récolte d\'informations sur l\'entreprise ESN Sopra Steria afin d\'en faire un site a type informatif pour un public défini.',
    teamSize: 'En trinôme',
    image: '/assets/images/6508-sopra-lille-bata-ext-102.jpg',
    tags: ['HTML', 'CSS', 'JavaScript', 'Figma', 'Git'],
    technologies: [
      { name: 'HTML5', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/html5.svg' },
      { name: 'CSS3', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/css3.svg' },
      { name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/javascript.svg' },
      { name: 'Figma', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/figma.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
    ],
  },
  {
    id: 'sae3',
    path: '/projet-SAE3',
    type: 'Projet SAE',
    title: 'Installation d\'un poste pour le développement',
    category: 'SAE 3',
    description: 'Installation et schématisation d\'un poste Linux Debian.',
    teamSize: 'En monôme',
    image: '/assets/images/PosteTravailLinux.png',
    tags: ['Linux', 'Bash', 'Git', 'VirtualBox'],
    technologies: [
      { name: 'Linux', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/linux.svg' },
      { name: 'VirtualBox', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/virtualbox.svg' },
      { name: 'VS Code', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/visualstudiocode.svg' },
      { name: 'IntelliJ IDEA', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/intellijidea.svg' },
      { name: 'Bash', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gnubash.svg' },
      { name: 'GitLab', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gitlab.svg' },
    ],
  },
  {
    id: 'sae12',
    path: '/projet-SAE12',
    type: 'Projet SAE',
    title: 'Implémentation d\'un besoin client | Comparaison d\'approches algorithmiques',
    category: 'SAE 1.2',
    description: 'Codage, étude et comparaison d\'efficacité entre divers algorithmes de comparaisons en Java.',
    teamSize: 'En binôme',
    image: '/assets/images/algorithm.jpg',
    tags: ['Java', 'Algorithmes', 'Git'],
    technologies: [
      { name: 'Java', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openjdk.svg' },
      { name: 'IntelliJ IDEA', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/intellijidea.svg' },
    ],
  },
  {
    id: 'sae4',
    path: '/projet-SAE4',
    type: 'Projet SAE',
    title: 'Création d\'une base de données',
    category: 'SAE 4',
    description: 'Conception, implémentation et optimisation d\'une base de données relationnelle.',
    teamSize: 'En trinôme',
    image: '/assets/images/bases-de-donnees-1024x734.jpg',
    tags: ['SQL', 'PostgreSQL', 'Docker', 'Base de données'],
    technologies: [
      { name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/postgresql.svg' },
      { name: 'Docker', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/docker.svg' },
      { name: 'SQL', icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/databricks.svg' },
    ],
  },
];

export const personalProjects = [
  {
    id: 'discord-bot',
    title: 'Bot Discord "Moksi\'s Bazaar"',
    description: 'Un bot Discord entièrement développé en JavaScript (discord.js), qui offre plusieurs services et jeux réunis sur une même plateforme textuelle.',
    tags: ['JavaScript', 'Discord', 'Python', 'SQL', 'IA'],
    image: '/assets/images/discordBotIcon.png',
    link: 'https://github.com/MalevolentMoksi/Moksi-Bazaar',
  },
  {
    id: 'drawings',
    title: 'Illustrations & Dessins',
    description: 'Collection personnelle de dessins et illustrations créés avec divers médiums.',
    tags: ['Art', 'Dessin', 'Création'],
    image: '/assets/images/drawings/',
  },
  {
    id: 'scratch-games',
    title: 'Jeux Scratch',
    description: 'Petits jeux développés avec l\'environnement Scratch pour apprendre la programmation visuelle.',
    tags: ['Scratch', 'Jeux', 'Programmation visuelle'],
    image: '/assets/images/scratch.png',
  },
];

/**
 * Récupère tous les tags uniques de tous les projets
 */
export const getAllTags = () => {
  const academicTags = academicProjects.flatMap(p => p.tags);
  const personalTags = personalProjects.flatMap(p => p.tags);
  const allTags = [...new Set([...academicTags, ...personalTags])];
  return allTags.sort();
};

/**
 * Filtre les projets académiques par tags
 */
export const filterAcademicProjects = (selectedTags) => {
  if (selectedTags.length === 0) return academicProjects;
  return academicProjects.filter(project =>
    selectedTags.every(tag => project.tags.includes(tag))
  );
};

/**
 * Filtre les projets personnels par tags
 */
export const filterPersonalProjects = (selectedTags) => {
  if (selectedTags.length === 0) return personalProjects;
  return personalProjects.filter(project =>
    selectedTags.every(tag => project.tags.includes(tag))
  );
};
