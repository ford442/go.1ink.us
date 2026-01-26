from playwright.sync_api import sync_playwright, expect

def verify_search(page):
    print("Navigating to home...")
    page.goto("http://localhost:5173/")

    # Wait for content to load
    page.wait_for_selector("input[placeholder*='Search']")

    print("Typing 'Tetris'...")
    page.fill("input[placeholder*='Search']", "Tetris")

    # Wait for filter to apply
    page.wait_for_timeout(500)

    # Check if 'Tetris' card is visible (Heading)
    print("Checking for Tetris card...")
    expect(page.get_by_role("heading", name="Tetris")).to_be_visible()

    # Check if others are hidden (e.g., 'Cave Crystals')
    print("Checking if other cards are hidden...")
    expect(page.get_by_role("heading", name="Cave Crystals")).not_to_be_visible()

    # Screenshot filtered
    print("Taking screenshot of filtered state...")
    page.screenshot(path="verification/search_filtered.png")

    # Clear search
    print("Clearing search...")
    page.click("button[aria-label='Clear search']")

    # Wait for clear
    page.wait_for_timeout(500)

    # Check if 'Cave Crystals' is back
    print("Checking if Cave Crystals is back...")
    expect(page.get_by_role("heading", name="Cave Crystals")).to_be_visible()

    # Screenshot cleared
    print("Taking screenshot of cleared state...")
    page.screenshot(path="verification/search_cleared.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_search(page)
            print("Verification successful!")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
