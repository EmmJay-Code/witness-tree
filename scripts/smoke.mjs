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
await page.getByText('Sample', { exact: true }).first().waitFor()

await page.setViewportSize({ width: 390, height: 844 })
await page.getByRole('button', { name: 'Home', exact: true }).waitFor()
await page.locator('.spine-nav').getByRole('button', { name: 'Almanac' }).waitFor()
await page.setViewportSize({ width: 1280, height: 900 })

await page.locator('.spine-nav').getByRole('button', { name: 'Almanac' }).click()
await page.getByRole('heading', { name: /2026/ }).waitFor()

await page.locator('.spine-nav').getByRole('button', { name: 'Log' }).click()
await page.getByRole('heading', { name: /records/ }).waitFor()

await page.locator('.spine-nav').getByRole('button', { name: 'Library' }).click()
await page.getByText('Common lilac').waitFor()

await page.locator('.spine-nav').getByRole('button', { name: 'Station' }).click()
await page.getByText('Blackwood Hollow').first().waitFor()
await page.getByRole('button', { name: 'Lamp' }).click()
await page.waitForFunction(() => document.documentElement.dataset.theme === 'lamp')

await page.locator('.spine-nav').getByRole('button', { name: 'Ring' }).click()
await page.locator('[data-obs]').first().click()
await page.getByRole('heading', { level: 2 }).waitFor()

await page.keyboard.press('n')
await page.getByRole('heading', { name: 'New observation' }).waitFor()
await page.getByRole('button', { name: 'Cancel' }).click()

await page.getByRole('button', { name: 'Witness Tree home' }).click()
await page.getByRole('heading', { name: /Keep a ring/i }).waitFor()
await page.getByRole('button', { name: 'Return to Blackwood Hollow' }).waitFor()
await page.getByRole('button', { name: 'Continue the sample' }).click()
await page.getByRole('heading', { name: 'The ring' }).waitFor()
const marksAgain = await page.locator('[data-obs]').count()
if (marksAgain < 20) throw new Error(`Sample should still be there, got ${marksAgain} marks`)

await page.getByRole('button', { name: 'Home', exact: true }).click()
await page.getByRole('heading', { name: /Keep a ring/i }).waitFor()
await page.getByRole('button', { name: 'Walk a sample year' }).or(page.getByRole('button', { name: 'Continue the sample' })).click()
await page.getByRole('heading', { name: 'The ring' }).waitFor()

await page.screenshot({ path: 'smoke-ring.png', fullPage: true })
await browser.close()
console.log(`Smoke OK — ${marks} marks on the sample ring, still ${marksAgain} after home.`)
