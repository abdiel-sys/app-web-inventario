import { describe, test, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoginView from '../views/LoginView';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { assertEquals, assertTrue, assertNotNull, isDisplayed } from './testHelpers';

describe('Visible Elements Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test('should display all required form elements on LoginView', () => {
    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const title = screen.getByRole('heading', { level: 1, name: /aquastock/i });
    assertNotNull(title, 'Title element should not be null');
    assertTrue(isDisplayed(title), 'Title element should be displayed');
    assertEquals(title.textContent, 'AquaStock', 'Title text should match expected');

    const emailInput = screen.getByLabelText(/email address/i);
    assertNotNull(emailInput, 'Email input should exist');
    assertTrue(isDisplayed(emailInput), 'Email input should be displayed');
    assertEquals(emailInput.getAttribute('type'), 'email', 'Input type should be email');

    const passwordInput = screen.getByLabelText(/^password$/i);
    assertNotNull(passwordInput, 'Password input should exist');
    assertTrue(isDisplayed(passwordInput), 'Password input should be displayed');

    const submitBtn = screen.getByRole('button', { name: /sign in/i });
    assertNotNull(submitBtn, 'Submit button should exist');
    assertTrue(isDisplayed(submitBtn), 'Submit button should be displayed');
  });

  test('should display sidebar navigation items and user badge', () => {
    const mockUser = { id: 1, name: 'Carlos Admin', role: 'admin' };
    window.localStorage.setItem('inventario_token', 'token-123');
    window.localStorage.setItem('inventario_user', JSON.stringify(mockUser));

    render(
      <AuthProvider>
        <Sidebar
          activeView="dashboard"
          onNavigate={() => {}}
          collapsed={false}
          onToggleCollapse={() => {}}
        />
      </AuthProvider>
    );

    const logoText = screen.getByText('AquaStock');
    assertNotNull(logoText, 'Logo text in sidebar should be present');
    assertTrue(isDisplayed(logoText), 'Logo text should be visible');

    const dashboardNav = screen.getByRole('button', { name: /dashboard/i });
    assertNotNull(dashboardNav, 'Dashboard nav item should exist');
    assertTrue(isDisplayed(dashboardNav), 'Dashboard nav item should be visible');

    const warehouseNav = screen.getByRole('button', { name: /warehouse stock/i });
    assertNotNull(warehouseNav, 'Warehouse nav item should exist');
    assertTrue(isDisplayed(warehouseNav), 'Warehouse nav item should be visible');
  });

  test('should display navbar title and toggle controls', () => {
    render(
      <AuthProvider>
        <Navbar sidebarCollapsed={false} activeView="Customer Deliveries" />
      </AuthProvider>
    );

    const activeViewTitle = screen.getByRole('heading', { level: 1, name: /customer deliveries/i });
    assertNotNull(activeViewTitle, 'Active view title should exist in Navbar');
    assertTrue(isDisplayed(activeViewTitle), 'Active view title should be displayed');
    assertEquals(activeViewTitle.textContent, 'Customer Deliveries', 'Navbar view title should match active view');
  });
});
