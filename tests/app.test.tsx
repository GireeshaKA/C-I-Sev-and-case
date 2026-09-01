import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('should render the project title', () => {
    render(<App />);
    expect(screen.getByText(/Severity and Cases/i)).toBeDefined();
  });

  it('should render the tagline', () => {
    render(<App />);
    expect(screen.getByText(/Unified Site Health/i)).toBeDefined();
  });

  it('should render the Overview page title', () => {
    render(<App />);
    expect(screen.getByText(/Overview/i)).toBeDefined();
  });
});
