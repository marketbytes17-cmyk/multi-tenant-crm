import { test, expect } from '@playwright/test';

test.describe('MarketBytes CRM - End-to-End Suite', () => {

  test('1. Homepage layout and automatic redirect to login', async ({ page }) => {
    await page.goto('/');
    // Should automatically redirect to /login if unauthenticated
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);

    // Verify brand heading & login form elements
    await expect(page.getByText('MarketBytes CRM', { exact: false })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In to Portal' })).toBeVisible();
  });

  test('2. Super Admin Portal - Login, Navigation, and Form Submission', async ({ page }) => {
    await page.goto('/login');

    // Click Super Admin Quick Demo Login button
    await page.click('button:has-text("Super Admin"):near(:text("Quick Demo Login"))');
    await page.click('button:has-text("Sign In to Portal")');

    // Should redirect to Super Admin Dashboard
    await page.waitForURL('**/superadmin');
    await expect(page).toHaveURL(/\/superadmin/);
    await expect(page.getByRole('heading', { name: 'Super Admin Dashboard' })).toBeVisible();

    // Primary Navigation: Clients List
    await page.click('nav a:has-text("Clients")');
    await page.waitForURL('**/superadmin/clients');
    await expect(page.getByRole('heading', { name: 'Client Organizations' })).toBeVisible();

    // Primary Navigation: Client Admin Users
    await page.click('nav a:has-text("Client Admins")');
    await page.waitForURL('**/superadmin/users');
    await expect(page.getByRole('heading', { name: 'Client Admins & User Accounts' })).toBeVisible();

    // Primary Navigation: Global Reports
    await page.click('nav a:has-text("Reports")');
    await page.waitForURL('**/superadmin/reports');
    await expect(page.getByRole('heading', { name: 'System-Wide Performance Reports' })).toBeVisible();

    // Primary Navigation: Platform Settings & Form Submission
    await page.click('nav a:has-text("Settings")');
    await page.waitForURL('**/superadmin/settings');
    await expect(page.getByRole('heading', { name: 'Super Admin Settings' })).toBeVisible();

    // Submit Platform Settings Form
    await page.click('button:has-text("Save Platform Settings")');
    await expect(page.getByText('Platform settings updated successfully!')).toBeVisible();
  });

  test('3. Client Admin Portal - Login, Navigation, and Org Settings Update', async ({ page }) => {
    await page.goto('/login');

    // Click Client Admin Quick Demo Login button
    await page.click('button:has-text("Client Admin"):near(:text("Quick Demo Login"))');
    await page.click('button:has-text("Sign In to Portal")');

    // Should redirect to Client Dashboard
    await page.waitForURL('**/client');
    await expect(page).toHaveURL(/\/client/);
    await expect(page.getByRole('heading', { name: 'Client Workspace Dashboard' })).toBeVisible();

    // Primary Navigation: Leads Inbox
    await page.click('nav a:has-text("Leads Inbox")');
    await page.waitForURL('**/client/leads');
    await expect(page.getByRole('heading', { name: 'Leads Inbox' })).toBeVisible();

    // Primary Navigation: Team Management
    await page.click('nav a:has-text("Team")');
    await page.waitForURL('**/client/team');
    await expect(page.getByRole('heading', { name: 'Sales Team Representatives' })).toBeVisible();

    // Primary Navigation: Client Reports
    await page.click('nav a:has-text("Reports")');
    await page.waitForURL('**/client/reports');
    await expect(page.getByRole('heading', { name: 'Performance Reports' })).toBeVisible();

    // Primary Navigation: Organization Settings & Form Submission
    await page.click('nav a:has-text("Settings")');
    await page.waitForURL('**/client/settings');
    await expect(page.getByRole('heading', { name: 'Organization Settings' })).toBeVisible();

    // Update Org Settings & Submit
    await page.click('button:has-text("Save Organization Settings")');
    await expect(page.getByText('Organization settings saved!')).toBeVisible();
  });

  test('4. Sales Rep Portal - Login, Navigation, and Preferences Update', async ({ page }) => {
    await page.goto('/login');

    // Click Sales Rep Quick Demo Login button
    await page.click('button:has-text("Sales Rep"):near(:text("Quick Demo Login"))');
    await page.click('button:has-text("Sign In to Portal")');

    // Should redirect to Sales Rep Dashboard Workspace
    await page.waitForURL('**/rep');
    await expect(page).toHaveURL(/\/rep/);
    await expect(page.getByRole('heading', { name: 'Sales Representative Workspace' })).toBeVisible();

    // Primary Navigation: My Leads
    await page.click('nav a:has-text("My Leads")');
    await page.waitForURL('**/rep/leads');
    await expect(page.getByRole('heading', { name: 'My Assigned Leads' })).toBeVisible();

    // Primary Navigation: My Performance
    await page.click('nav a:has-text("My Performance")');
    await page.waitForURL('**/rep/performance');
    await expect(page.getByRole('heading', { name: 'My Sales Performance' })).toBeVisible();

    // Primary Navigation: Rep Settings & Form Submission
    await page.click('nav a:has-text("Settings")');
    await page.waitForURL('**/rep/settings');
    await expect(page.getByRole('heading', { name: 'Sales Representative Settings' })).toBeVisible();

    // Submit Preferences
    await page.click('button:has-text("Save Settings")');
    await expect(page.getByText('Profile & notification settings saved!')).toBeVisible();
  });

  test('5. TopBar Add Lead Modal and Stateful Notification Actions', async ({ page }) => {
    // Log in as Client Admin
    await page.goto('/login');
    await page.click('button:has-text("Client Admin"):near(:text("Quick Demo Login"))');
    await page.click('button:has-text("Sign In to Portal")');
    await page.waitForURL('**/client');

    // 1. TopBar "+ Add Lead" modal creation
    await page.click('button:has-text("Add Lead")');
    await expect(page.getByRole('heading', { name: 'Add New Lead' })).toBeVisible();

    await page.fill('input[placeholder="e.g. John Doe"]', 'Sarah Connor');
    await page.fill('input[placeholder="+1 (555) 000-0000"]', '+1 555-0199');
    await page.fill('input[placeholder="john@example.com"]', 'sarah@cyberdyne.org');
    await page.fill('textarea[placeholder*="enterprise"]', 'Interested in enterprise CRM rollout.');
    await page.click('button:has-text("Add to Leads Inbox")');

    await expect(page.getByText(/added successfully/i)).toBeVisible();

    // 2. Notification Bell dynamic interaction
    const bellBtn = page.locator('button:has(svg.lucide-bell)');
    await bellBtn.click();
    await expect(page.getByText('Notifications', { exact: true })).toBeVisible();
    
    // Mark all as read
    await page.click('button:has-text("Mark all read")');
    // Clear all notifications
    await page.click('button:has-text("Clear")');
    await expect(page.getByText('No new notifications')).toBeVisible();
    await bellBtn.click(); // Close dropdown
  });

  test('6. Password Update in Settings and Super Admin Client Deep Dive', async ({ page }) => {
    // 1. Client Admin Password Form test
    await page.goto('/login');
    await page.click('button:has-text("Client Admin"):near(:text("Quick Demo Login"))');
    await page.click('button:has-text("Sign In to Portal")');
    await page.waitForURL('**/client');

    await page.goto('/client/settings');
    await expect(page.getByRole('heading', { name: 'Organization Settings' })).toBeVisible();
    await page.fill('input[placeholder="••••••••"]', 'ClientAdmin2026!');
    await page.fill('input[placeholder="Minimum 8 characters"]', 'NewClientSecurePass123!');
    await page.fill('input[placeholder="Re-enter new password"]', 'NewClientSecurePass123!');
    await page.click('button:has-text("Update Password")');
    // Verifies the backend auth change-password endpoint is reached
    await expect(page.getByText(/admin password has been updated/)).toBeVisible();

    // Revert password back for test idempotence
    await page.fill('input[placeholder="••••••••"]', 'NewClientSecurePass123!');
    await page.fill('input[placeholder="Minimum 8 characters"]', 'ClientAdmin2026!');
    await page.fill('input[placeholder="Re-enter new password"]', 'ClientAdmin2026!');
    await page.click('button:has-text("Update Password")');
    await expect(page.getByText(/admin password has been updated/)).toBeVisible();

    // 2. Super Admin Client Detail dynamic tabs
    await page.goto('/login');
    await page.click('button:has-text("Super Admin"):near(:text("Quick Demo Login"))');
    await page.click('button:has-text("Sign In to Portal")');
    await page.waitForURL('**/superadmin');

    await page.goto('/superadmin/clients');
    await expect(page.getByRole('heading', { name: 'Client Organizations' })).toBeVisible();
    
    // Click "View Client Details" on the first organization
    await page.click('a[title="View Client Details"] >> nth=0');
    await page.waitForURL(/\/superadmin\/clients\/.+/);

    // Verify tabs switch and live data containers render
    await page.click('button:has-text("Leads")');
    await expect(page.locator('table').first()).toBeVisible();

    await page.click('button:has-text("Pipeline")');
    await expect(page.getByText('New', { exact: true })).toBeVisible();
    await expect(page.getByText('Contacted', { exact: true })).toBeVisible();

    await page.click('button:has-text("Team")');
    await expect(page.getByText('Assigned Sales Representatives')).toBeVisible();
  });

});
