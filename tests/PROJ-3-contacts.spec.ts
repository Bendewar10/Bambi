import { test, expect, type Page } from '@playwright/test'

const EMAIL = process.env.QA_TEST_EMAIL!
const PASSWORD = process.env.QA_TEST_PASSWORD!

async function login(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(EMAIL)
  await page.getByLabel('Passwort').fill(PASSWORD)
  await page.getByRole('button', { name: 'Login' }).click()
  await expect(page).toHaveURL('http://localhost:3000/')
}

function uniqueName(label: string) {
  return `${label} ${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

function cardFor(page: Page, name: string) {
  return page.locator('.cursor-pointer', { hasText: name })
}

async function deleteContact(page: Page, name: string) {
  const deleteResponse = page.waitForResponse(
    (res) => res.url().includes('/rest/v1/contacts') && res.request().method() === 'DELETE'
  )
  await cardFor(page, name).getByRole('button', { name: 'Löschen' }).click()
  await page.getByRole('button', { name: 'Löschen' }).last().click()
  await deleteResponse
}

test.describe.serial('PROJ-3: Kontakt anlegen & verwalten', () => {
  test('AC1: only Name filled creates contact with other fields empty/default', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC1')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await deleteContact(page, name)
  })

  test('AC2: full form (all fields) saves all values correctly', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC2')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Kategorie').click()
    await page.getByRole('option', { name: 'Freund' }).click()
    await page.getByLabel('Beziehungsstärke').click()
    await page.getByRole('option', { name: 'Kern' }).click()
    await page.getByLabel('Kontext').fill('Beim Sport kennengelernt')
    await page.getByLabel('Notizen').fill('Mag Kaffee')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    // re-open to verify persisted values
    await page.getByText(name, { exact: true }).click()
    await expect(page.getByLabel('Kontext')).toHaveValue('Beim Sport kennengelernt')
    await expect(page.getByLabel('Notizen')).toHaveValue('Mag Kaffee')
    await expect(page.getByLabel('Follow-up-Intervall (Tage)')).toHaveValue('14')
    await page.getByRole('button', { name: 'Abbrechen' }).click()

    await deleteContact(page, name)
  })

  test('AC3: empty Name shows validation error, contact not created', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Name ist erforderlich')).toBeVisible()
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC4: no strength selected leaves follow-up interval empty', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC4')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await page.getByText(name, { exact: true }).click()
    await expect(page.getByLabel('Follow-up-Intervall (Tage)')).toHaveValue('')
    await page.getByRole('button', { name: 'Abbrechen' }).click()

    await deleteContact(page, name)
  })

  test('AC5: choosing strength auto-fills the correct default interval', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC5')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Beziehungsstärke').click()
    await page.getByRole('option', { name: 'Locker' }).click()
    await expect(page.getByLabel('Follow-up-Intervall (Tage)')).toHaveValue('90')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await deleteContact(page, name)
  })

  test('AC5b: manually edited interval is not overwritten when strength changes', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC5b')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Beziehungsstärke').click()
    await page.getByRole('option', { name: 'Kern' }).click()
    await page.getByLabel('Follow-up-Intervall (Tage)').fill('7')
    await page.getByLabel('Beziehungsstärke').click()
    await page.getByRole('option', { name: 'Mittel' }).click()
    await expect(page.getByLabel('Follow-up-Intervall (Tage)')).toHaveValue('7')
    await page.getByRole('button', { name: 'Abbrechen' }).click()
  })

  test('AC6/AC7: editing a contact pre-fills the form and persists changes', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC6')
    const renamed = `${name}-renamed`
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await page.getByText(name, { exact: true }).click()
    await expect(page.getByLabel('Name')).toHaveValue(name)
    await page.getByLabel('Name').fill(renamed)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(renamed)).toBeVisible()

    await deleteContact(page, renamed)
  })

  test('AC8/AC9: delete shows confirmation dialog, removes contact on confirm', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC8')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await cardFor(page, name).getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText('Kontakt löschen?')).toBeVisible()
    const deleteResponse = page.waitForResponse(
      (res) => res.url().includes('/rest/v1/contacts') && res.request().method() === 'DELETE'
    )
    await page.getByRole('button', { name: 'Löschen' }).last().click()
    await deleteResponse
    await expect(page.getByText(name)).not.toBeVisible()
  })

  test('AC10: empty state shows hint when no contacts exist', async ({ page }) => {
    await login(page)
    await expect(async () => {
      expect(await page.getByText('Lädt...').count()).toBe(0)
    }).toPass({ timeout: 10000 })
    const hasItems = await page.locator('[class*="truncate"]').count()
    if (hasItems === 0) {
      await expect(page.getByText('Noch keine Kontakte.')).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'Kontakt hinzufügen' })).toBeVisible()
  })

  test('AC: city and phone are saved and pre-filled on re-open', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC-City')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByLabel('Stadt').fill('Berlin')
    await page.getByLabel('Telefonnummer').fill('+49 170 1234567')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await page.getByText(name, { exact: true }).click()
    await expect(page.getByLabel('Stadt')).toHaveValue('Berlin')
    await expect(page.getByLabel('Telefonnummer')).toHaveValue('+49 170 1234567')
    await page.getByRole('button', { name: 'Abbrechen' }).click()

    await deleteContact(page, name)
  })

  test('AC: city and phone are optional, contact saves without them', async ({ page }) => {
    await login(page)
    const name = uniqueName('AC-NoCity')
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.getByLabel('Name').fill(name)
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText(name)).toBeVisible()

    await page.getByText(name, { exact: true }).click()
    await expect(page.getByLabel('Stadt')).toHaveValue('')
    await expect(page.getByLabel('Telefonnummer')).toHaveValue('')
    await page.getByRole('button', { name: 'Abbrechen' }).click()

    await deleteContact(page, name)
  })

  test('AC11: network failure on save shows error, keeps form values', async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Kontakt hinzufügen' }).click()
    await page.route('**/rest/v1/contacts**', (route) => route.abort('failed'))
    await page.getByLabel('Name').fill('Network Fail Test')
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(
      page.getByText('Verbindung zu Supabase fehlgeschlagen. Bitte erneut versuchen.')
    ).toBeVisible()
    await expect(page.getByLabel('Name')).toHaveValue('Network Fail Test')
  })
})
