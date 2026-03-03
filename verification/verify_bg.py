from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    # Set a reasonable viewport size to capture the dashboard
    context = browser.new_context(viewport={"width": 1280, "height": 800})
    page = context.new_page()

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # Scroll down to make background blobs and parallax more visible
        page.evaluate("window.scrollTo(0, 500)")
        page.wait_for_timeout(1000)

        # Move mouse to trigger parallax/drift
        page.mouse.move(600, 400)
        page.wait_for_timeout(1000)

        # Take Screenshot
        screenshot_path = "verification/dynamic_background_verification.png"
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
