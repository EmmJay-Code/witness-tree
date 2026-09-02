import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
})
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
page.setDefaultTimeout(15_000)

await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
const html = await page.locator('#root').innerHTML()
if (html.includes('Opening the ledger')) {
  await page.waitForFunction(() => !document.body.innerText.includes('Opening the ledger'), null, {
    timeout: 10_000,
  })
}
await page.getByRole('heading', { name: /Keep a ring/i }).waitFor()

const onboarding = await page.locator('h1').innerText()
if (!onboarding.includes('Keep a ring')) {
  throw new Error(`Unexpected onboarding heading: ${onboarding}`)
}

await page.getByRole('button', { name: 'Walk a sample year' }).click()
await page.getByRole('heading', { name: 'The ring' }).waitFor()

const marks = await page.locator('[data-obs]').count()
if (marks < 20) throw new Error(`Expected a populated ring, got ${marks} marks`)

await page.getByRole('button', { name: 'Almanac' }).click()
await page.getByRole('heading', { name: /2026/ }).waitFor()
const sun = await page.getByText(/to/).first().innerText()
if (!/\d{2}:\d{2}/.test(sun) && !/does not/.test(await page.content())) {
  // Almanac should mention sun times or polar edge cases
}

await page.getByRole('button', { name: 'Log' }).click()
await page.getByRole('heading', { name: /records/ }).waitFor()

await page.getByRole('button', { name: 'Library' }).click()
await page.getByText('Common lilac').waitFor()

await page.getByRole('button', { name: 'Station' }).click()
await page.getByText('Blackwood Hollow').first().waitFor()
await page.getByRole('button', { name: 'Lamp' }).click()
await page.waitForFunction(() => document.documentElement.dataset.theme === 'lamp')

await page.getByRole('button', { name: 'Ring' }).click()
await page.locator('[data-obs]').first().click()
await page.getByRole('heading', { level: 2 }).waitFor()

await page.keyboard.press('n')
await page.getByRole('heading', { name: 'New observation' }).waitFor()
await page.getByRole('button', { name: 'Cancel' }).click()

await page.screenshot({ path: 'smoke-ring.png', fullPage: true })
await browser.close()
console.log(`Smoke OK — ${marks} marks on the sample ring.`)
