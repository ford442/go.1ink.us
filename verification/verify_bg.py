from playwright.sync_api import sync_playwright
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173")

        # Wait for app to load
        page.wait_for_selector(".glass-card", timeout=10000)

        # Take first screenshot
        print("Taking screenshot 1...")
        page.screenshot(path="verification_bg_1.png")

        # Wait for drift (2 seconds)
        time.sleep(2)

        # Take second screenshot
        print("Taking screenshot 2...")
        page.screenshot(path="verification_bg_2.png")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
