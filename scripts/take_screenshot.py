import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})
        # Set boot state so we skip the biometric intro
        await page.goto("http://localhost:5173")
        await page.evaluate("sessionStorage.setItem('curator_booted', 'true')")

        # Go to the list view
        await page.goto("http://localhost:5173/?view=list")
        await page.wait_for_timeout(2000) # Give it some time to render

        # Take a screenshot
        await page.screenshot(path="list_view_screenshot.png")
        await browser.close()

asyncio.run(main())
