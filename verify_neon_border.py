from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")

    # Wait for cards to load
    page.wait_for_selector(".glass-card")

    # Hover over the first card
    card = page.locator(".glass-card").first
    card.hover()

    # Wait a bit for the transition (opacity duration-500)
    page.wait_for_timeout(1000)

    # Take screenshot
    page.screenshot(path="verification_neon_border.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
