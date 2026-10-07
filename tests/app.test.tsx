import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  it('should render the platform title', () => {
    render(<App />);
    expect(screen.getByText(/ENPHASE C&I FLEET HEALTH INTELLIGENCE/i)).toBeDefined();
  });

  it('should render the tagline', () => {
    render(<App />);
    expect(screen.getByText(/Severity.*Cases.*Installer Performance/i)).toBeDefined();
  });

  it('should render the Executive Summary page', () => {
    render(<App />);
    expect(screen.getByText(/Executive Summary/i)).toBeDefined();
  });
});
