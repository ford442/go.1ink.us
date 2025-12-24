from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Visit the local preview URL
            page.goto("http://localhost:4173")

            # Wait for content to load
            page.wait_for_selector("text=My Web Projects")

            # Verify the 3 specific projects are present
            if page.get_by_text("Cave Crystals").is_visible():
                print("Cave Crystals found")
            if page.get_by_text("Tronic").is_visible():
                print("Tronic found")
            if page.get_by_text("Pixelocity").is_visible():
                print("Pixelocity found")

            # Verify images are present (look for img tags inside cards)
            # We used placehold.co images
            images = page.locator("img[src*='placehold.co']")
            count = images.count()
            print(f"Found {count} placeholder images")

            # Take a screenshot
            page.screenshot(path="verification/verification.png", full_page=True)
            print("Screenshot saved to verification/verification.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_app()
