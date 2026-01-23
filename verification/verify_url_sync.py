from playwright.sync_api import sync_playwright
import sys
import time

def verify_url_sync():
    with sync_playwright() as p:
        print("Launching browser...")
        browser = p.chromium.launch()
        page = browser.new_page()

        base_url = "http://localhost:5173"
        print(f"Navigating to {base_url}...")
        try:
            page.goto(base_url)
        except Exception as e:
            print(f"Error connecting: {e}")
            sys.exit(1)

        print("Testing URL Sync...")

        # Test 1: Click Category -> URL Update
        # Find 'Games' button.
        print("Clicking 'Games' filter...")

        # Check View Transition support
        has_vt = page.evaluate("!!document.startViewTransition")
        print(f"Browser supports View Transitions: {has_vt}")

        # Use a more specific selector if possible, or filter by text
        games_btn = page.get_by_role("button", name="Games").first
        if not games_btn.is_visible():
            print("Games button not found!")
            # Debug: print all buttons
            for btn in page.get_by_role("button").all():
                print(f"Button: {btn.text_content()}")
            sys.exit(1)

        print(f"Found button: {games_btn.text_content()}")
        games_btn.click()

        # Wait for URL update (useEffect)
        page.wait_for_timeout(1000) # Increased timeout

        # Check if UI updated (e.g., 'Games' button has active class/style)
        # Active style has 'bg-cyan-600/30' or 'scale-105'
        # Let's check class attribute
        btn_class = games_btn.get_attribute("class")
        print(f"Button class after click: {btn_class}")

        if "filter=Games" not in page.url:
            print(f"FAILED: URL did not update after clicking Games. URL: {page.url}")
            sys.exit(1)
        print("PASS: Filter click updated URL.")

        # Test 2: Search -> URL Update
        print("Typing search query...")
        page.fill("input[placeholder*='Search']", "Tetris")
        page.wait_for_timeout(500)

        if "q=Tetris" not in page.url:
             print(f"FAILED: URL did not update after searching Tetris. URL: {page.url}")
             sys.exit(1)
        print("PASS: Search updated URL.")

        # Test 3: Reload with params
        print("Reloading with ?filter=Tools...")
        page.goto(f"{base_url}/?filter=Tools")
        page.wait_for_timeout(1000)

        # Check if 'Weather Clock' (Tool) is visible and 'Tetris' (Game) is hidden
        if page.locator("text=Weather Clock").count() == 0:
             print("FAILED: 'Weather Clock' not found when filter=Tools")
             sys.exit(1)

        if page.locator("text=Tetris").count() > 0:
             print("FAILED: 'Tetris' found when filter=Tools")
             sys.exit(1)

        print("PASS: Reload with params restored state.")

        # Test 4: Check for View Transitions (style attribute)
        print("Checking View Transitions...")
        # Check if the first card has view-transition-name
        card = page.locator(".perspective-container").first
        style = card.get_attribute("style")
        if "view-transition-name" not in style and "viewTransitionName" not in style: # React might use either depending on rendering
             # Actually, React 19 renders 'view-transition-name' in style string.
             # But let's be flexible.
             print(f"FAILED: Card does not have view-transition-name. Style: {style}")
             # Note: If running against a browser that doesn't support it, React might still render the style.
             # So this checks if our code is effectively rendering it.
             sys.exit(1)
        print(f"PASS: View Transition style found: {style}")

        # Take screenshot for frontend verification
        print("Taking screenshot...")
        page.screenshot(path="verification/verification.png")

        browser.close()

if __name__ == "__main__":
    verify_url_sync()
