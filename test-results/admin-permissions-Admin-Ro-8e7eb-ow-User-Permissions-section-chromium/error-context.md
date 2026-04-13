# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-permissions.spec.ts >> Admin Role Permissions >> 6. /dashboard/settings - should show User Permissions section
- Location: tests\e2e\admin-permissions.spec.ts:133:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /user permissions/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /user permissions/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - navigation [ref=e4]:
      - generic [ref=e5]:
        - img "BOB" [ref=e7]
        - generic [ref=e8]:
          - generic [ref=e9]: agsdev@allianceglobalsolutions.com
          - button [ref=e10] [cursor=pointer]:
            - img [ref=e11]
          - button [ref=e14] [cursor=pointer]:
            - img [ref=e15]
    - generic [ref=e17]:
      - complementary [ref=e18]:
        - navigation [ref=e19]:
          - link "Calls View all calls" [ref=e20] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e21]:
              - img [ref=e23]
              - generic [ref=e25]:
                - generic [ref=e26]: Calls
                - generic [ref=e27]: View all calls
          - link "Monitor Live monitoring" [ref=e28] [cursor=pointer]:
            - /url: /dashboard/monitor
            - generic [ref=e29]:
              - img [ref=e31]
              - generic [ref=e33]:
                - generic [ref=e34]: Monitor
                - generic [ref=e35]: Live monitoring
          - link "History Search calls" [ref=e36] [cursor=pointer]:
            - /url: /dashboard/history
            - generic [ref=e37]:
              - img [ref=e39]
              - generic [ref=e41]:
                - generic [ref=e42]: History
                - generic [ref=e43]: Search calls
          - link "QA Logs Override history" [ref=e44] [cursor=pointer]:
            - /url: /dashboard/qa-logs
            - generic [ref=e45]:
              - img [ref=e47]
              - generic [ref=e49]:
                - generic [ref=e50]: QA Logs
                - generic [ref=e51]: Override history
          - link "Agents Manage profiles" [ref=e52] [cursor=pointer]:
            - /url: /dashboard/agents
            - generic [ref=e53]:
              - img [ref=e55]
              - generic [ref=e57]:
                - generic [ref=e58]: Agents
                - generic [ref=e59]: Manage profiles
          - link "Settings Preferences" [ref=e60] [cursor=pointer]:
            - /url: /dashboard/settings
            - generic [ref=e61]:
              - img [ref=e63]
              - generic [ref=e66]:
                - generic [ref=e67]: Settings
                - generic [ref=e68]: Preferences
        - generic [ref=e70]:
          - img [ref=e72]
          - generic [ref=e74]:
            - generic [ref=e75]: BOB Agent
            - text: Qa
      - main [ref=e76]:
        - generic [ref=e77]:
          - generic [ref=e78]:
            - heading "Settings" [level=1] [ref=e79]
            - paragraph [ref=e80]: Manage your integrations and preferences
          - generic [ref=e81]:
            - heading "AI Analysis" [level=2] [ref=e82]
            - generic [ref=e84]:
              - generic [ref=e85]: OpenRouter API Key
              - textbox "Enter your OpenRouter API key" [ref=e86]
              - paragraph [ref=e87]: API key for AI-powered analysis
            - button "Save AI Settings" [ref=e88] [cursor=pointer]
          - generic [ref=e89]:
            - heading "Sync Settings" [level=2] [ref=e90]
            - generic [ref=e91]:
              - generic [ref=e92]:
                - generic [ref=e93]:
                  - paragraph [ref=e94]: Auto-sync Calls
                  - paragraph [ref=e95]: Automatically sync calls from CTM
                - button [ref=e96]
              - generic [ref=e99]:
                - generic [ref=e100]: Sync Interval (minutes)
                - button "Every hour" [ref=e102]:
                  - generic [ref=e103]: Every hour
                  - img [ref=e104]
            - button "Save Sync Settings" [ref=e106] [cursor=pointer]
          - generic [ref=e107]:
            - heading "Preferences" [level=2] [ref=e108]
            - generic [ref=e109]:
              - generic [ref=e110]:
                - generic [ref=e111]:
                  - paragraph [ref=e112]: Light Mode
                  - paragraph [ref=e113]: Clean white interface
                - button [ref=e114]
              - generic [ref=e117]:
                - generic [ref=e118]:
                  - paragraph [ref=e119]: Email Notifications
                  - paragraph [ref=e120]: Receive notifications for hot leads
                - button [ref=e121]
            - button "Save Preferences" [ref=e124] [cursor=pointer]
          - generic [ref=e125]:
            - heading "Danger Zone" [level=2] [ref=e126]
            - paragraph [ref=e127]: Clear all stored credentials. This action cannot be undone.
            - button "Clear All Credentials" [ref=e128] [cursor=pointer]
  - button "Open Next.js Dev Tools" [ref=e134] [cursor=pointer]:
    - img [ref=e135]
  - alert [ref=e138]
```

# Test source

```ts
  56  |     // Navigate to monitor page
  57  |     await page.goto('/dashboard/monitor')
  58  |     await page.waitForLoadState('domcontentloaded')
  59  | 
  60  |     // Verify page loaded
  61  |     expect(page.url()).toContain('/dashboard/monitor')
  62  | 
  63  |     // Verify no access denied error
  64  |     const errorText = await page.textContent('body')
  65  |     expect(errorText).not.toContain('Access Denied')
  66  |     expect(errorText).not.toContain('Unauthorized')
  67  |   })
  68  | 
  69  |   test('3. /dashboard/history - should be accessible with Bulk Analyze button', async ({ page }) => {
  70  |     // Login first
  71  |     await page.fill('input[type="email"]', ADMIN_EMAIL)
  72  |     await page.fill('input[type="password"]', ADMIN_PASSWORD)
  73  |     await page.click('button[type="submit"]')
  74  |     await page.waitForURL('**/dashboard**', { timeout: 30000 })
  75  | 
  76  |     // Navigate to history page
  77  |     await page.goto('/dashboard/history')
  78  |     await page.waitForLoadState('domcontentloaded')
  79  | 
  80  |     // Verify page loaded
  81  |     expect(page.url()).toContain('/dashboard/history')
  82  | 
  83  |     // Verify no access denied error
  84  |     const errorText = await page.textContent('body')
  85  |     expect(errorText).not.toContain('Access Denied')
  86  |     expect(errorText).not.toContain('Unauthorized')
  87  | 
  88  |     // Verify Bulk Analyze button is visible
  89  |     const bulkAnalyzeButton = page.getByRole('button', { name: /bulk analyze/i })
  90  |     await expect(bulkAnalyzeButton).toBeVisible()
  91  |   })
  92  | 
  93  |   test('4. /dashboard/agents - should be accessible', async ({ page }) => {
  94  |     // Login first
  95  |     await page.fill('input[type="email"]', ADMIN_EMAIL)
  96  |     await page.fill('input[type="password"]', ADMIN_PASSWORD)
  97  |     await page.click('button[type="submit"]')
  98  |     await page.waitForURL('**/dashboard**', { timeout: 30000 })
  99  | 
  100 |     // Navigate to agents page
  101 |     await page.goto('/dashboard/agents')
  102 |     await page.waitForLoadState('domcontentloaded')
  103 | 
  104 |     // Verify page loaded
  105 |     expect(page.url()).toContain('/dashboard/agents')
  106 | 
  107 |     // Verify no access denied error
  108 |     const errorText = await page.textContent('body')
  109 |     expect(errorText).not.toContain('Access Denied')
  110 |     expect(errorText).not.toContain('Unauthorized')
  111 |   })
  112 | 
  113 |   test('5. /dashboard/qa-logs - should be accessible', async ({ page }) => {
  114 |     // Login first
  115 |     await page.fill('input[type="email"]', ADMIN_EMAIL)
  116 |     await page.fill('input[type="password"]', ADMIN_PASSWORD)
  117 |     await page.click('button[type="submit"]')
  118 |     await page.waitForURL('**/dashboard**', { timeout: 30000 })
  119 | 
  120 |     // Navigate to qa-logs page
  121 |     await page.goto('/dashboard/qa-logs')
  122 |     await page.waitForLoadState('domcontentloaded')
  123 | 
  124 |     // Verify page loaded
  125 |     expect(page.url()).toContain('/dashboard/qa-logs')
  126 | 
  127 |     // Verify no access denied error
  128 |     const errorText = await page.textContent('body')
  129 |     expect(errorText).not.toContain('Access Denied')
  130 |     expect(errorText).not.toContain('Unauthorized')
  131 |   })
  132 | 
  133 |   test('6. /dashboard/settings - should show User Permissions section', async ({ page }) => {
  134 |     // Login first
  135 |     await page.fill('input[type="email"]', ADMIN_EMAIL)
  136 |     await page.fill('input[type="password"]', ADMIN_PASSWORD)
  137 |     await page.click('button[type="submit"]')
  138 |     await page.waitForURL('**/dashboard**', { timeout: 30000 })
  139 | 
  140 |     // Navigate to settings page
  141 |     await page.goto('/dashboard/settings')
  142 | 
  143 |     // Wait for page content to be visible (settings page may make API calls)
  144 |     await page.waitForSelector('h1:has-text("Settings")', { timeout: 10000 })
  145 | 
  146 |     // Verify page loaded
  147 |     expect(page.url()).toContain('/dashboard/settings')
  148 | 
  149 |     // Verify no access denied error
  150 |     const errorText = await page.textContent('body')
  151 |     expect(errorText).not.toContain('Access Denied')
  152 |     expect(errorText).not.toContain('Unauthorized')
  153 | 
  154 |     // Verify User Permissions section is visible (admin-only)
  155 |     const userPermissionsHeading = page.getByRole('heading', { name: /user permissions/i })
> 156 |     await expect(userPermissionsHeading).toBeVisible({ timeout: 10000 })
      |                                          ^ Error: expect(locator).toBeVisible() failed
  157 |   })
  158 | 
  159 |   test('7. Verify Bulk Analyze button visibility on history page', async ({ page }) => {
  160 |     // Login first
  161 |     await page.fill('input[type="email"]', ADMIN_EMAIL)
  162 |     await page.fill('input[type="password"]', ADMIN_PASSWORD)
  163 |     await page.click('button[type="submit"]')
  164 |     await page.waitForURL('**/dashboard**', { timeout: 30000 })
  165 | 
  166 |     // Navigate to history page
  167 |     await page.goto('/dashboard/history')
  168 |     await page.waitForLoadState('domcontentloaded')
  169 | 
  170 |     // Verify Bulk Analyze button exists and is visible
  171 |     const bulkAnalyzeButton = page.getByRole('button', { name: /bulk analyze/i })
  172 |     await expect(bulkAnalyzeButton).toBeVisible()
  173 | 
  174 |     // Verify Export CSV button is also visible
  175 |     const exportButton = page.getByRole('button', { name: /export csv/i })
  176 |     await expect(exportButton).toBeVisible()
  177 |   })
  178 | })
```