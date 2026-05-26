import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Bypass boot sequence
        await page.add_init_script("sessionStorage.setItem('curator_booted', 'true');")

        # Route to intercept images and keep them pending to see the skeleton loader
        async def intercept_image(route):
            if route.request.resource_type == "image":
                await asyncio.sleep(2) # Delay image loading
                await route.continue_()
            else:
                await route.continue_()

        await page.route("**/*", intercept_image)

        await page.goto("http://localhost:5173")
        await page.wait_for_selector(".glass-card", state="visible")

        # Wait a small moment to let IntersectionObserver trigger
        await page.wait_for_timeout(500)

        # Take a screenshot showing the skeleton loaders
        await page.screenshot(path="verification/skeleton_loader.png", full_page=True)

        await browser.close()

asyncio.run(main())
