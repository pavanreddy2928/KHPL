import { render, screen } from '@testing-library/react';
import App from './App';

test('renders KHPL heading', () => {
  render(<App />);
  const linkElement = screen.getByText(/Karnataka Hardball Premier League/i);
  expect(linkElement).toBeInTheDocument();
});