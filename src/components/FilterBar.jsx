import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getAllTags } from '@/data/projects.js';

/**
 * FilterBar Component
 * Permet de filtrer les projets par tags
 */
const FilterBar = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTags, setSelectedTags] = useState([]);
  const allTags = getAllTags(t);

  // Initialiser les tags sélectionnés et dépuis l'URL
  useEffect(() => {
    const tagsParam = searchParams.get('tags');
    if (tagsParam) {
      const tags = tagsParam.split(',');
      setSelectedTags(tags);
      onFilterChange(tags);
    }
  }, []);

  // Mettre à jour l'URL quando les tags changent
  useEffect(() => {
    if (selectedTags.length > 0) {
      setSearchParams({ tags: selectedTags.join(',') });
    } else {
      setSearchParams({});
    }
    onFilterChange(selectedTags);
  }, [selectedTags, setSearchParams, onFilterChange]);

  const handleTagToggle = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleClearAll = () => {
    setSelectedTags([]);
  };

  return (
    <nav className="filter-bar" aria-label={t('common.filterBar.aria')}>
      <div className="filter-header">
        <h3>{t('common.filterBar.title')}</h3>
        {selectedTags.length > 0 && (
          <button 
            className="btn-clear-filters"
            onClick={handleClearAll}
            aria-label={t('common.filterBar.clearAllAria')}
          >
            {t('common.filterBar.clear', { count: selectedTags.length })}
          </button>
        )}
      </div>

      <div className="filter-tags">
        {allTags.map(tag => (
          <label key={tag} className="filter-tag">
            <input
              type="checkbox"
              checked={selectedTags.includes(tag)}
              onChange={() => handleTagToggle(tag)}
              aria-label={t('common.filterBar.filterByTag', { tag })}
            />
            <span className="tag-label">{tag}</span>
          </label>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="filter-active-tags">
          <p className="filter-result-count">
            {t('common.filterBar.activeFilters', { count: selectedTags.length })}
          </p>
          <div className="active-tags-list">
            {selectedTags.map(tag => (
              <span 
                key={tag} 
                className="active-tag"
                onClick={() => handleTagToggle(tag)}
                role="button"
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTagToggle(tag);
                  }
                }}
                aria-label={t('common.filterBar.removeFilter', { tag })}
              >
                {tag}
                <span className="remove-tag">×</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default FilterBar;
