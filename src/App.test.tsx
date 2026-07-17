import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

function renderApp(initialPath = '/') {
  window.history.pushState({}, '', initialPath);
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

describe('App routing', () => {
  it('renders the Board page at /', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { name: 'Wishlist' })).toBeInTheDocument();
  });

  it('renders the Questions page at /questions', () => {
    renderApp('/questions');
    expect(screen.getByRole('heading', { name: 'Question Bank' })).toBeInTheDocument();
  });

  it('renders the Stats page at /stats', async () => {
    renderApp('/stats');
    expect(await screen.findByRole('heading', { name: 'Stats' })).toBeInTheDocument();
  });

  it('shows nav tabs for all three routes', () => {
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Board' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Questions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Stats' })).toBeInTheDocument();
  });
});
