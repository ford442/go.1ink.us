import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page(viewport={"width": 1280, "height": 800})

        # Disable animations/transitions for stable screenshots
        await page.add_init_script("""
            sessionStorage.setItem('curator_booted', 'true');
        """)

        await page.goto("http://localhost:5173")
        await page.wait_for_selector(".glass-card", state="visible")

        # Disable animations after load to be safe
        await page.add_style_tag(content='* { animation: none !important; transition: none !important; }')

        # Take initial screenshot
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/sort_initial.png")

        # Click the sort dropdown
        sort_select = page.locator('select').first
        await sort_select.select_option("A-Z")

        # Wait for sorting to apply
        await page.wait_for_timeout(500)

        # Take screenshot of A-Z sorting
        await page.screenshot(path="verification/sort_az.png")

        # Change to Newest
        await sort_select.select_option("Newest")
        await page.wait_for_timeout(500)
        await page.screenshot(path="verification/sort_newest.png")

        await browser.close()

asyncio.run(main())
