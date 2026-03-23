import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Loading from '@/components/Loading';

describe('Loading Component', () => {
  it('renders correctly', () => {
    render(<Loading />);
    const statusContainer = screen.getByRole('status');
    expect(statusContainer).toBeInTheDocument();
    
    const textElement = screen.getByText('Chargement...');
    expect(textElement).toBeInTheDocument();
  });
});
