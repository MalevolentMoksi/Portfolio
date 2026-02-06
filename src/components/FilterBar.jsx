import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllTags } from '@/data/projects.js';

/**
 * FilterBar Component
 * Permet de filtrer les projets par tags
 */
const FilterBar = ({ onFilterChange }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTags, setSelectedTags] = useState([]);
  const allTags = getAllTags();

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
    <div className="filter-bar">
      <div className="filter-header">
        <h3>Filtrer par technologie</h3>
        {selectedTags.length > 0 && (
          <button 
            className="btn-clear-filters"
            onClick={handleClearAll}
            aria-label="Effacer tous les filtres"
          >
            ✕ Effacer ({selectedTags.length})
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
              aria-label={`Filtrer par ${tag}`}
            />
            <span className="tag-label">{tag}</span>
          </label>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="filter-active-tags">
          <p className="filter-result-count">
            Filtres actifs : {selectedTags.length}
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
                aria-label={`Supprimer le filtre ${tag}`}
              >
                {tag}
                <span className="remove-tag">×</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
