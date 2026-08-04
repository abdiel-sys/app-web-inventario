import { describe, test, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';
import CustomersView from '../views/CustomersView';
import { AuthProvider } from '../context/AuthContext';
import { assertEquals, assertTrue, assertNotNull, isDisplayed } from './testHelpers';

describe('Form Successful Submission Tests', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  test('should handle successful login form submission', async () => {
    const mockUser = { id: 1, name: 'Admin', email: 'admin@aquastock.com', role: 'admin' };
    
    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.endsWith('/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              token: 'jwt-auth-token-123',
              user: mockUser,
            }),
        });
      }
      if (url.endsWith('/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockUser }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      });
    });

    render(<App />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    assertNotNull(emailInput, 'Email field exists');
    assertNotNull(passwordInput, 'Password field exists');
    assertNotNull(submitBtn, 'Submit button exists');

    fireEvent.change(emailInput, { target: { value: 'admin@aquastock.com' } });
    fireEvent.change(passwordInput, { target: { value: 'admin123' } });

    assertEquals(emailInput.value, 'admin@aquastock.com', 'Email value updated');
    assertEquals(passwordInput.value, 'admin123', 'Password value updated');

    fireEvent.click(submitBtn);

    await waitFor(() => {
      assertEquals(localStorage.getItem('inventario_token'), 'jwt-auth-token-123', 'Token saved in localStorage');
      const dashboardHeading = screen.getByRole('heading', { level: 1, name: /dashboard/i });
      assertNotNull(dashboardHeading, 'Dashboard heading should appear after login');
      assertTrue(isDisplayed(dashboardHeading), 'Dashboard should be displayed');
    });
  });

  test('should handle successful customer creation form submission', async () => {
    const mockCustomers = [
      { id: 1, name: 'Existing Customer', address: '123 Main St', phone: '555-0100', empty_jugs_held: 2 }
    ];

    global.fetch = vi.fn().mockImplementation((url, options) => {
      if (url.endsWith('/customers') && options?.method === 'POST') {
        const body = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              data: { id: 2, ...body },
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockCustomers }),
      });
    });

    render(
      <AuthProvider>
        <CustomersView />
      </AuthProvider>
    );

    await waitFor(() => {
      const addBtn = screen.getByRole('button', { name: /add customer/i });
      assertNotNull(addBtn, 'Add Customer button should exist');
      assertTrue(isDisplayed(addBtn), 'Add Customer button should be visible');
    });

    const addBtn = screen.getByRole('button', { name: /add customer/i });
    fireEvent.click(addBtn);

    const modalTitle = screen.getByRole('heading', { level: 3, name: /add customer/i });
    assertNotNull(modalTitle, 'Modal title should be rendered');
    assertTrue(isDisplayed(modalTitle), 'Modal title should be displayed');

    const nameInput = screen.getByLabelText(/full name/i);
    const addressInput = screen.getByLabelText(/address/i);
    const phoneInput = screen.getByLabelText(/phone/i);

    fireEvent.change(nameInput, { target: { value: 'New Test Customer' } });
    fireEvent.change(addressInput, { target: { value: '456 Water Ave' } });
    fireEvent.change(phoneInput, { target: { value: '555-9999' } });

    assertEquals(nameInput.value, 'New Test Customer', 'Name matches typed input');
    assertEquals(addressInput.value, '456 Water Ave', 'Address matches typed input');

    const saveBtn = screen.getByRole('button', { name: /^save$/i });
    assertNotNull(saveBtn, 'Save button present in modal');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      const modalAfterSave = screen.queryByRole('heading', { level: 3, name: /add customer/i });
      assertEquals(modalAfterSave, null, 'Modal should close on successful submission');
    });
  });
});
