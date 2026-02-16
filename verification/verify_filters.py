from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Set a reasonable viewport size to capture the dashboard
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # 1. Type in search to show it works (but clear it to show filters)
        print("Testing Search UI...")
        page.fill("input[type='text']", "Game")
        page.wait_for_timeout(500)
        page.fill("input[type='text']", "") # Clear it
        page.wait_for_timeout(500)

        # 2. Click "Games"
        print("Clicking 'Games' filter...")
        games_btn = page.locator("button").filter(has_text="Games").first
        games_btn.click()
        page.wait_for_timeout(1000)

        # 3. Click "Adventure" tag
        print("Clicking 'Adventure' tag...")
        adventure_btn = page.locator("button").filter(has_text="Adventure").first
        adventure_btn.click()
        page.wait_for_timeout(1000)

        # 4. Take Final Screenshot
        screenshot_path = "verification/final_filters.png"
        page.screenshot(path=screenshot_path, full_page=False)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
