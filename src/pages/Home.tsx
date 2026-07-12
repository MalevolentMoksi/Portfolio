import { useState } from 'react';
import useDocumentMeta from '@/hooks/useDocumentMeta';
import { useTranslation } from 'react-i18next';
import ContactForm from '@/components/ContactForm';

const SKILLS_LAYOUT_MODES = ['cards', 'tabs', 'tree', 'radar', 'carousel', 'petals'] as const;
type SkillsLayoutMode = (typeof SKILLS_LAYOUT_MODES)[number];
const rawSkillsLayoutMode = import.meta.env.VITE_SKILLS_LAYOUT_MODE as SkillsLayoutMode | undefined;
const SKILLS_LAYOUT_MODE: SkillsLayoutMode = SKILLS_LAYOUT_MODES.includes(
  rawSkillsLayoutMode as SkillsLayoutMode
)
  ? (rawSkillsLayoutMode as SkillsLayoutMode)
  : 'cards';
const DEFAULT_SKILL_TAB = 'web';
const DEFAULT_EXPANDED_SKILL_NODES = [
  'web',
  'web-javascript',
  'web-react',
  'web-php',
  'backend',
  'backend-c-family',
  'backend-sql',
  'tools',
  'tools-linux',
  'testing',
  'testing-javascript',
  'testing-java',
  'testing-cpp',
];

const formatSkillCount = (count: any) => String(count).padStart(2, '0');

const getActiveSkillCategory = (categories: any, activeTab: any) =>
  categories.find((category: any) => category.id === activeTab) ?? categories[0];

const SkillCategoryIcon = ({ categoryId, className = 'bot-feature-icon' }: any) => {
  switch (categoryId) {
    case 'web':
      return (
        <svg
          className={className}
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'backend':
      return (
        <svg
          className={className}
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h.01M15 9h.01M9 15h6" />
        </svg>
      );
    case 'tools':
      return (
        <svg
          className={className}
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
          <polyline points="7 10 10 13 17 6" strokeWidth="2" />
        </svg>
      );
    case 'testing':
      return (
        <svg
          className={className}
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    default:
      return null;
  }
};

const SkillTagList = ({ skills, className = 'bot-skills-tags' }: any) => (
  <div className={className}>
    {skills.map((skill: any) => (
      <span key={skill} className="bot-skill-tag">
        {skill}
      </span>
    ))}
  </div>
);

const SkillCategoryCard = ({ category }: any) => (
  <div className="bot-feature-card skills-category-card" role="listitem">
    <SkillCategoryIcon categoryId={category.id} />
    <div>
      <div className="skills-card-heading">
        <strong>{category.title}</strong>
        <span className="skills-card-count">{formatSkillCount(category.skills.length)}</span>
      </div>
      <SkillTagList skills={category.skills} />
    </div>
  </div>
);

const SkillsCards = ({ categories }: any) => (
  <div className="skills-showcase skills-showcase--cards">
    <div className="skills-cards" role="list">
      {categories.map((category: any) => (
        <SkillCategoryCard key={category.id} category={category} />
      ))}
    </div>
  </div>
);

const SkillsTabs = ({ categories, activeTab, onTabChange, label }: any) => {
  const activeCategory = getActiveSkillCategory(categories, activeTab);

  const selectTab = (categoryId: any) => {
    onTabChange(categoryId);
    // Roving tabindex : le focus suit la selection lors de la navigation flechee
    document.getElementById(`skills-tab-${categoryId}`)?.focus();
  };

  const handleTabKeyDown = (event: any, currentIndex: any) => {
    const lastIndex = categories.length - 1;

    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return;
    }

    event.preventDefault();

    if (event.key === 'Home') {
      selectTab(categories[0].id);
      return;
    }

    if (event.key === 'End') {
      selectTab(categories[lastIndex].id);
      return;
    }

    const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
    const nextIndex = (currentIndex + direction + categories.length) % categories.length;
    selectTab(categories[nextIndex].id);
  };

  return (
    <div className="skills-showcase skills-showcase--tabs">
      <div className="skills-tabs" role="tablist" aria-label={label}>
        {categories.map((category: any, index: any) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            id={`skills-tab-${category.id}`}
            className="skills-tab-button"
            aria-selected={activeCategory.id === category.id}
            aria-controls={`skills-panel-${category.id}`}
            tabIndex={activeCategory.id === category.id ? 0 : -1}
            onClick={() => onTabChange(category.id)}
            onKeyDown={(event: any) => handleTabKeyDown(event, index)}
          >
            <SkillCategoryIcon categoryId={category.id} className="skills-tab-icon" />
            <span className="skills-tab-label">{category.title}</span>
            <span className="skills-tab-count">{formatSkillCount(category.skills.length)}</span>
          </button>
        ))}
      </div>

      <section
        key={activeCategory.id}
        id={`skills-panel-${activeCategory.id}`}
        className="skills-tab-panel"
        role="tabpanel"
        aria-labelledby={`skills-tab-${activeCategory.id}`}
      >
        <div className="skills-tab-panel-header">
          <div className="skills-tab-panel-icon-shell">
            <SkillCategoryIcon categoryId={activeCategory.id} className="skills-tab-panel-icon" />
          </div>
          <div className="skills-tab-panel-title-group">
            <strong>{activeCategory.title}</strong>
            <span className="skills-tab-panel-count">
              {formatSkillCount(activeCategory.skills.length)}
            </span>
          </div>
        </div>

        <div className="skills-tab-meter" aria-hidden="true">
          {activeCategory.skills.map((skill: any, index: any) => (
            <span key={skill} className="skills-tab-meter-bar" style={{ '--skill-index': index }} />
          ))}
        </div>

        <SkillTagList skills={activeCategory.skills} className="bot-skills-tags skills-tab-tags" />
      </section>
    </div>
  );
};

const SkillsRadar = ({ categories, activeTab, onTabChange }: any) => {
  const activeCategory = getActiveSkillCategory(categories, activeTab);
  const chartSize = 320;
  const center = chartSize / 2;
  const radius = 112;
  const maxSkills = Math.max(...categories.map((category: any) => category.skills.length));

  const getPoint = (index: any, valueRatio: any) => {
    const angleInRadians = (index / categories.length) * Math.PI * 2 - Math.PI / 2;
    const pointRadius = radius * valueRatio;

    return {
      x: center + Math.cos(angleInRadians) * pointRadius,
      y: center + Math.sin(angleInRadians) * pointRadius,
    };
  };

  const radarPoints = categories
    .map((category: any, index: any) => {
      const { x, y } = getPoint(index, category.skills.length / maxSkills);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="skills-showcase skills-showcase--radar">
      <div className="skills-radar-layout">
        <div className="skills-radar-panel">
          <svg
            className="skills-radar-chart"
            viewBox={`0 0 ${chartSize} ${chartSize}`}
            role="img"
            aria-label={activeCategory.title}
          >
            {[0.25, 0.5, 0.75, 1].map((level) => (
              <polygon
                key={level}
                className="skills-radar-grid"
                points={categories
                  .map((_: any, index: any) => {
                    const { x, y } = getPoint(index, level);
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            ))}

            {categories.map((category: any, index: any) => {
              const edgePoint = getPoint(index, 1);
              const valuePoint = getPoint(index, category.skills.length / maxSkills);
              const isActive = category.id === activeCategory.id;

              return (
                <g key={category.id}>
                  <line
                    className="skills-radar-axis"
                    x1={center}
                    y1={center}
                    x2={edgePoint.x}
                    y2={edgePoint.y}
                  />
                  <circle
                    className={`skills-radar-dot ${isActive ? 'is-active' : ''}`}
                    cx={valuePoint.x}
                    cy={valuePoint.y}
                    r={isActive ? 7 : 5}
                  />
                </g>
              );
            })}

            <polygon className="skills-radar-area" points={radarPoints} />
          </svg>
        </div>

        <div className="skills-radar-sidebar">
          <div className="skills-radar-legend" role="list">
            {categories.map((category: any) => {
              const isActive = category.id === activeCategory.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  className={`skills-radar-legend-item ${isActive ? 'is-active' : ''}`}
                  onClick={() => onTabChange(category.id)}
                >
                  <SkillCategoryIcon
                    categoryId={category.id}
                    className="skills-radar-legend-icon"
                  />
                  <span className="skills-radar-legend-copy">
                    <strong>{category.title}</strong>
                    <span>{formatSkillCount(category.skills.length)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <article className="skills-radar-detail">
            <div className="skills-radar-detail-head">
              <div className="skills-radar-detail-icon-shell">
                <SkillCategoryIcon
                  categoryId={activeCategory.id}
                  className="skills-radar-detail-icon"
                />
              </div>
              <div className="skills-radar-detail-title-group">
                <strong>{activeCategory.title}</strong>
                <span className="skills-radar-detail-count">
                  {formatSkillCount(activeCategory.skills.length)}
                </span>
              </div>
            </div>
            <SkillTagList
              skills={activeCategory.skills}
              className="bot-skills-tags skills-radar-tags"
            />
          </article>
        </div>
      </div>
    </div>
  );
};

const SkillsCarousel = ({ categories, activeTab, onTabChange }: any) => {
  const activeIndex = categories.findIndex((category: any) => category.id === activeTab);
  const resolvedActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeCategory = categories[resolvedActiveIndex];
  const previousIndex = (resolvedActiveIndex - 1 + categories.length) % categories.length;
  const nextIndex = (resolvedActiveIndex + 1) % categories.length;

  return (
    <div className="skills-showcase skills-showcase--carousel">
      <div className="skills-carousel-stage">
        <button
          type="button"
          className="skills-carousel-arrow"
          aria-label={categories[previousIndex].title}
          onClick={() => onTabChange(categories[previousIndex].id)}
        >
          <span aria-hidden="true">&#8249;</span>
        </button>

        <article key={activeCategory.id} className="skills-carousel-card">
          <div className="skills-carousel-card-header">
            <div className="skills-carousel-icon-shell">
              <SkillCategoryIcon categoryId={activeCategory.id} className="skills-carousel-icon" />
            </div>
            <div className="skills-carousel-title-group">
              <strong>{activeCategory.title}</strong>
              <span className="skills-carousel-count">
                {formatSkillCount(activeCategory.skills.length)}
              </span>
            </div>
          </div>

          <SkillTagList
            skills={activeCategory.skills}
            className="bot-skills-tags skills-carousel-tags"
          />
        </article>

        <button
          type="button"
          className="skills-carousel-arrow"
          aria-label={categories[nextIndex].title}
          onClick={() => onTabChange(categories[nextIndex].id)}
        >
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>

      <div className="skills-carousel-nav" role="tablist" aria-label="Skills carousel navigation">
        {categories.map((category: any) => (
          <button
            key={category.id}
            type="button"
            role="tab"
            className={`skills-carousel-chip ${category.id === activeCategory.id ? 'is-active' : ''}`}
            aria-selected={category.id === activeCategory.id}
            onClick={() => onTabChange(category.id)}
          >
            <SkillCategoryIcon categoryId={category.id} className="skills-carousel-chip-icon" />
            <span className="skills-carousel-chip-label">{category.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const SkillsPetals = ({ categories, activeTab, onTabChange }: any) => {
  const activeCategory = getActiveSkillCategory(categories, activeTab);

  return (
    <div className="skills-showcase skills-showcase--petals">
      <div className="skills-petals-layout">
        <div className="skills-petals-orbit">
          <div className="skills-petals-hub">
            <span className="skills-petals-kicker">
              {formatSkillCount(activeCategory.skills.length)}
            </span>
            <strong>{activeCategory.title}</strong>
          </div>

          {categories.map((category: any, index: any) => (
            <button
              key={category.id}
              type="button"
              className={`skills-petal-button ${category.id === activeCategory.id ? 'is-active' : ''}`}
              style={{ '--petal-angle': `${-90 + index * 90}deg` }}
              onClick={() => onTabChange(category.id)}
            >
              <SkillCategoryIcon categoryId={category.id} className="skills-petal-icon" />
              <span className="skills-petal-label">{category.title}</span>
              <span className="skills-petal-count">{formatSkillCount(category.skills.length)}</span>
            </button>
          ))}
        </div>

        <article className="skills-petals-detail">
          <div className="skills-petals-detail-header">
            <div className="skills-petals-detail-icon-shell">
              <SkillCategoryIcon
                categoryId={activeCategory.id}
                className="skills-petals-detail-icon"
              />
            </div>
            <div className="skills-petals-detail-title-group">
              <strong>{activeCategory.title}</strong>
              <span className="skills-petals-detail-count">
                {formatSkillCount(activeCategory.skills.length)}
              </span>
            </div>
          </div>

          <SkillTagList
            skills={activeCategory.skills}
            className="bot-skills-tags skills-petals-tags"
          />
        </article>
      </div>
    </div>
  );
};

const SkillTreeNode = ({ node, expandedNodeIds, onToggle }: any) => {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expandedNodeIds.includes(node.id);

  return (
    <div
      className={`skills-tree-node ${hasChildren ? 'is-branch' : 'is-leaf'} ${isExpanded ? 'is-open' : ''}`}
    >
      {hasChildren ? (
        <button
          type="button"
          className="skills-tree-node-trigger"
          aria-expanded={isExpanded}
          onClick={() => onToggle(node.id)}
        >
          <span className="skills-tree-node-chevron" aria-hidden="true" />
          {node.iconCategoryId ? (
            <SkillCategoryIcon categoryId={node.iconCategoryId} className="skills-tree-node-icon" />
          ) : (
            <span className="skills-tree-node-pip" aria-hidden="true" />
          )}
          <span className="skills-tree-node-label">{node.label}</span>
          <span className="skills-tree-node-count">
            {String(node.children.length).padStart(2, '0')}
          </span>
        </button>
      ) : (
        <div className="skills-tree-node-leaf">
          <span className="skills-tree-node-pip" aria-hidden="true" />
          <span className="skills-tree-node-label">{node.label}</span>
        </div>
      )}

      {hasChildren ? (
        <div className="skills-tree-children">
          <div className="skills-tree-children-inner">
            {node.children.map((childNode: any) => (
              <SkillTreeNode
                key={childNode.id}
                node={childNode}
                expandedNodeIds={expandedNodeIds}
                onToggle={onToggle}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const SkillsTree = ({ categories, expandedNodeIds, onToggle }: any) => (
  <div className="skills-showcase skills-showcase--tree">
    <div className="skills-tree-grid" role="list">
      {categories.map((category: any) => (
        <article key={category.id} className="skills-tree-cluster" role="listitem">
          <SkillTreeNode
            node={{
              id: category.id,
              label: category.title,
              iconCategoryId: category.id,
              children: category.tree,
            }}
            expandedNodeIds={expandedNodeIds}
            onToggle={onToggle}
          />
        </article>
      ))}
    </div>
  </div>
);

const Home = () => {
  const { t } = useTranslation();
  const [activeSkillTab, setActiveSkillTab] = useState(DEFAULT_SKILL_TAB);
  const [expandedSkillNodes, setExpandedSkillNodes] = useState(DEFAULT_EXPANDED_SKILL_NODES);
  const timelineItems = t('home.timeline.items', { returnObjects: true }) as Array<{
    year: string;
    title: string;
    place: string;
    desc: string;
  }>;
  useDocumentMeta(t('home.metaTitle'), t('home.metaDescription'));

  const skillCategories = [
    {
      id: 'web',
      title: t('home.skills.cards.web.title'),
      skills: [
        'HTML / CSS',
        'JavaScript',
        'TypeScript',
        'Node.js',
        'PHP',
        'Symfony',
        'React',
        'Vite',
      ],
      tree: [
        { id: 'web-html-css', label: 'HTML / CSS' },
        {
          id: 'web-javascript',
          label: 'JavaScript',
          children: [
            {
              id: 'web-react',
              label: 'React',
              children: [
                { id: 'web-jsx', label: 'JSX' },
                { id: 'web-hooks', label: 'Hooks' },
              ],
            },
            { id: 'web-vite', label: 'Vite' },
            { id: 'web-nodejs', label: 'Node.js' },
          ],
        },
        {
          id: 'web-typescript',
          label: 'TypeScript',
        },
        {
          id: 'web-php',
          label: 'PHP',
          children: [{ id: 'web-symfony', label: 'Symfony' }],
        },
      ],
    },
    {
      id: 'backend',
      title: t('home.skills.cards.backend.title'),
      skills: ['Java', 'Python', 'C', 'C++', 'SQLite', 'PostgreSQL'],
      tree: [
        { id: 'backend-java', label: 'Java' },
        { id: 'backend-python', label: 'Python' },
        {
          id: 'backend-c-family',
          label: 'C / C++',
          children: [
            { id: 'backend-c', label: 'C' },
            { id: 'backend-cpp', label: 'C++' },
          ],
        },
        {
          id: 'backend-sql',
          label: 'SQL',
          children: [{ id: 'backend-postgresql', label: 'PostgreSQL' }],
        },
      ],
    },
    {
      id: 'tools',
      title: t('home.skills.cards.tools.title'),
      skills: [
        'Git',
        'Linux',
        'Bash',
        'JavaFX',
        'Docker',
        'VS Code',
        'IntelliJ IDEA',
        'PHPStorm',
        'Android Studio',
      ],
      tree: [
        { id: 'tools-git', label: 'Git' },
        {
          id: 'tools-linux',
          label: 'Linux',
          children: [
            { id: 'tools-bash', label: 'Bash' },
            { id: 'tools-docker', label: 'Docker' },
          ],
        },
        { id: 'tools-javafx', label: 'JavaFX' },
        { id: 'tools-vscode', label: 'VS Code' },
        { id: 'tools-intellij', label: 'IntelliJ IDEA' },
        { id: 'tools-phpstorm', label: 'PHPStorm' },
        { id: 'tools-android-studio', label: 'Android Studio' },
      ],
    },
    {
      id: 'testing',
      title: t('home.skills.cards.testing.title'),
      skills: ['Mocha', 'Cypress', 'JUnit', 'GTest'],
      tree: [
        {
          id: 'testing-javascript',
          label: 'JavaScript',
          children: [
            { id: 'testing-mocha', label: 'Mocha' },
            { id: 'testing-cypress', label: 'Cypress' },
          ],
        },
        {
          id: 'testing-java',
          label: 'Java',
          children: [{ id: 'testing-junit', label: 'JUnit' }],
        },
        {
          id: 'testing-cpp',
          label: 'C++',
          children: [{ id: 'testing-gtest', label: 'GTest' }],
        },
      ],
    },
  ];

  const toggleSkillNode = (nodeId: any) => {
    setExpandedSkillNodes((currentNodeIds) =>
      currentNodeIds.includes(nodeId)
        ? currentNodeIds.filter((currentNodeId) => currentNodeId !== nodeId)
        : [...currentNodeIds, nodeId]
    );
  };

  const renderSkillsLayout = () => {
    switch (SKILLS_LAYOUT_MODE) {
      case 'radar':
        return (
          <SkillsRadar
            categories={skillCategories}
            activeTab={activeSkillTab}
            onTabChange={setActiveSkillTab}
          />
        );
      case 'carousel':
        return (
          <SkillsCarousel
            categories={skillCategories}
            activeTab={activeSkillTab}
            onTabChange={setActiveSkillTab}
          />
        );
      case 'petals':
        return (
          <SkillsPetals
            categories={skillCategories}
            activeTab={activeSkillTab}
            onTabChange={setActiveSkillTab}
          />
        );
      case 'tabs':
        return (
          <SkillsTabs
            categories={skillCategories}
            activeTab={activeSkillTab}
            onTabChange={setActiveSkillTab}
            label={t('home.skills.title')}
          />
        );
      case 'tree':
        return (
          <SkillsTree
            categories={skillCategories}
            expandedNodeIds={expandedSkillNodes}
            onToggle={toggleSkillNode}
          />
        );
      case 'cards':
      default:
        return <SkillsCards categories={skillCategories} />;
    }
  };

  return (
    <>
      {/* === À propos === */}
      <section id="about" aria-labelledby="about-title">
        <h2 id="about-title">{t('home.about.title')}</h2>
        <article className="about-card">
          <p>
            {t('home.about.descriptionPrefix')} <strong>{t('home.about.program')}</strong>{' '}
            {t('home.about.descriptionMid')} <strong>{t('home.about.specialization')}</strong>.{' '}
            {t('home.about.descriptionSuffix')}
          </p>
          <div className="about-badges" role="list" aria-label={t('home.about.badgesAria')}>
            <span className="about-badge" role="listitem">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              {t('home.about.program')}
            </span>
            <span className="about-badge" role="listitem">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              {t('home.about.year')}
            </span>
            <span className="about-badge" role="listitem">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {t('home.about.school')}
            </span>
            <span className="about-badge" role="listitem">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              {t('home.about.specialization')}
            </span>
            <span className="about-badge" role="listitem">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              {t('home.about.internship')}
            </span>
          </div>
        </article>
      </section>

      {/* === Compétences === */}
      <section id="skills" aria-labelledby="skills-title">
        <h2 id="skills-title">{t('home.skills.title')}</h2>
        <p className="skills-intro">{t('home.skills.intro')}</p>
        {renderSkillsLayout()}
      </section>

      {/* === Parcours === */}
      <section id="achievements" aria-labelledby="achievements-title">
        <h2 id="achievements-title">{t('home.timeline.title')}</h2>
        <ol className="timeline" aria-label={t('home.timeline.aria')}>
          {timelineItems.map((item, index) => (
            <li key={`${item.year}-${index}`} className="timeline-item">
              <span className="timeline-year">{item.year}</span>
              <div className="timeline-content">
                <strong>{item.title}</strong>
                <span className="timeline-place">{item.place}</span>
                <p>{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* === Centres d'intérêt === */}
      <section id="hobbies" aria-labelledby="hobbies-title">
        <h2 id="hobbies-title">{t('home.hobbies.title')}</h2>
        <div className="hobbies-grid" role="list">
          <div className="hobby-card" role="listitem">
            <svg
              className="hobby-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="M2 2l7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
            <span>{t('home.hobbies.items.art')}</span>
          </div>

          <div className="hobby-card" role="listitem">
            <svg
              className="hobby-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <circle cx="7.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="16.5" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <path d="M12 9v6M9 12h6" strokeWidth="2.5" />
            </svg>
            <span>{t('home.hobbies.items.games')}</span>
          </div>

          <div className="hobby-card" role="listitem">
            <svg
              className="hobby-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
            <span>{t('home.hobbies.items.music')}</span>
          </div>

          <div className="hobby-card" role="listitem">
            <svg
              className="hobby-icon"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="17" x2="22" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
            </svg>
            <span>{t('home.hobbies.items.cinema')}</span>
          </div>
        </div>
      </section>

      <section id="contact" aria-labelledby="contact-title">
        <h2 id="contact-title">{t('home.contact.title')}</h2>
        <div className="contact-info">
          <ul>
            {/* <li>
              Email :
              <a href="#" className="email-glitch" aria-label="Adresse email masquée pour éviter le spam">
                <span className="local-part" data-text="##########"></span>@etu.univ-grenoble-alpes.fr
              </a>
            </li> */}
            <li>
              {t('home.contact.gitlabLabel')}{' '}
              <a
                href="https://gricad-gitlab.univ-grenoble-alpes.fr/morelloe"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('home.contact.gitlabAria')}
              >
                gricad-gitlab.univ-grenoble-alpes.fr/morelloe
              </a>
            </li>
            <li>
              {t('home.contact.linkedinLabel')}{' '}
              <a
                href="https://www.linkedin.com/in/enzo-morello-28a364392"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t('home.contact.linkedinAria')}
              >
                www.linkedin.com/in/enzo-morello-28a364392
              </a>
            </li>
          </ul>
        </div>
        <ContactForm />
      </section>
    </>
  );
};

export default Home;
