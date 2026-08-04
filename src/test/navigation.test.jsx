import { describe, test, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import { assertEquals, assertTrue, assertNotNull, isDisplayed } from './testHelpers';

describe('Basic Navigation Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test('should render login page when user is not authenticated', () => {
    render(<App />);

    const title = screen.getByText('AquaStock');
    assertNotNull(title, 'App title should be present');
    assertTrue(isDisplayed(title), 'App title should be displayed');

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    assertNotNull(loginButton, 'Sign in button should be present');
    assertTrue(isDisplayed(loginButton), 'Sign in button should be displayed');
  });

  test('should navigate between views when logged in as admin', async () => {
    const mockAdmin = { id: 1, name: 'Admin User', email: 'admin@aquastock.com', role: 'admin' };
    localStorage.setItem('inventario_token', 'mock-token');
    localStorage.setItem('inventario_user', JSON.stringify(mockAdmin));

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.endsWith('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAdmin }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(<App />);

    await waitFor(() => {
      const dashboardHeader = screen.getByRole('heading', { level: 1, name: /dashboard/i });
      assertNotNull(dashboardHeader, 'Dashboard header should exist');
      assertTrue(isDisplayed(dashboardHeader), 'Dashboard header should be displayed');
    });

    // Navigate to Customers view via sidebar button
    const customersBtn = screen.getByRole('button', { name: /customers/i });
    assertNotNull(customersBtn, 'Customers navigation button should exist');
    fireEvent.click(customersBtn);

    await waitFor(() => {
      const customersHeader = screen.getByRole('heading', { level: 1, name: /customers/i });
      assertNotNull(customersHeader, 'Customers header should exist after navigation');
      assertTrue(isDisplayed(customersHeader), 'Customers view header should be displayed');
      assertEquals(customersHeader.textContent, 'Customers', 'View header text should equal "Customers"');
    });

    // Navigate to Delivery Vans view
    const vansBtn = screen.getByRole('button', { name: /delivery vans/i });
    assertNotNull(vansBtn, 'Delivery Vans button should exist');
    fireEvent.click(vansBtn);

    await waitFor(() => {
      const vansHeader = screen.getByRole('heading', { level: 1, name: /delivery vans/i });
      assertNotNull(vansHeader, 'Delivery Vans header should exist');
      assertTrue(isDisplayed(vansHeader), 'Delivery Vans view header should be displayed');
    });
  });

  test('should block restricted view navigation based on user role', async () => {
    const mockDriver = { id: 2, name: 'Driver User', email: 'driver@aquastock.com', role: 'driver' };
    localStorage.setItem('inventario_token', 'mock-token');
    localStorage.setItem('inventario_user', JSON.stringify(mockDriver));

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.endsWith('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockDriver }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      });
    });

    render(<App />);

    await waitFor(() => {
      const dashboardHeader = screen.getByRole('heading', { level: 1, name: /dashboard/i });
      assertNotNull(dashboardHeader);
    });

    // Attempting to navigate to users (restricted for driver)
    const sidebar = screen.getByRole('navigation', { name: /main navigation/i });
    assertTrue(isDisplayed(sidebar), 'Sidebar navigation should be displayed');

    // Users option shouldn't even be rendered for driver, or navigate guard will block it
    const usersBtn = screen.queryByRole('button', { name: /users/i });
    assertEquals(usersBtn, null, 'Users button should be hidden for driver role');
  });
});
