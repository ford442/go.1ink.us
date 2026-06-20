from playwright.sync_api import sync_playwright

def run_cuj(page):
    # Disable animations to ensure stable elements for hovering
    page.goto("http://localhost:5173")

    page.evaluate("sessionStorage.setItem('curator_booted', 'true');")
    page.goto("http://localhost:5173")
    page.wait_for_timeout(2000)

    # Inject CSS to stop animations and stabilize elements
    page.add_style_tag(content='* { animation: none !important; transition: none !important; }')
    page.wait_for_timeout(1000)

    card = page.locator(".glass-card").first
    card.hover()
    page.wait_for_timeout(1000)

    card.locator('button[aria-label="Add to favorites"]').first.click()
    page.wait_for_timeout(100) # Quick screenshot to catch the particles

    page.screenshot(path="/home/jules/verification/screenshots/verification.png")
    page.wait_for_timeout(1000)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
