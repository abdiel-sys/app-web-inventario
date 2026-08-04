import { describe, test, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginView from '../views/LoginView';
import { AuthProvider } from '../context/AuthContext';
import { assertEquals, assertTrue, assertNotNull, isDisplayed } from './testHelpers';

describe('Form Failure Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test('should display error banner on login failure with invalid credentials', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.endsWith('/auth/login')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ message: 'Invalid email or password.' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      assertNotNull(alert, 'Alert notification element should exist');
      assertTrue(isDisplayed(alert), 'Alert element should be displayed on form failure');
      assertTrue(alert.textContent.includes('Invalid email or password.'), 'Error message should contain failure reason');
    });

    assertEquals(localStorage.getItem('inventario_token'), null, 'Token should remain null after failed login');
  });

  test('should display error message on network failure', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      return Promise.reject(new Error('Network error connecting to API'));
    });

    render(
      <AuthProvider>
        <LoginView />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'user@aquastock.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      assertNotNull(alert, 'Alert box should be displayed for network failures');
      assertTrue(isDisplayed(alert), 'Alert box is visible');
      assertTrue(alert.textContent.includes('Network error connecting to API'), 'Alert should display network error');
    });
  });
});
