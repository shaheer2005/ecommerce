import { render, screen } from '@testing-library/react';
import App from './App';

test('renders application header and footer', () => {
  render(<App />);
  const titleElement = screen.getByText(/E-Shop Deluxe/i);
  expect(titleElement).toBeInTheDocument();
});
