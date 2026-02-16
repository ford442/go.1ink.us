from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Load the page
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # Take initial screenshot
        page.screenshot(path="verification/initial_load.png")
        print("Initial screenshot taken.")

        # 2. Search for 'Game'
        print("Searching for 'Game'...")
        search_input = page.get_by_role("textbox")
        search_input.fill("Game")
        page.wait_for_timeout(500) # Wait for list to update

        # Assert 'Cave Crystals' (a game) is visible
        cave_crystals = page.get_by_role("heading", name="Cave Crystals")
        if cave_crystals.is_visible():
            print("PASS: Found 'Cave Crystals' after searching 'Game'.")
        else:
            print("FAIL: 'Cave Crystals' not found after searching 'Game'.")

        page.screenshot(path="verification/search_game.png")

        # 3. Clear Search
        print("Clearing search...")
        search_input.fill("")
        page.wait_for_timeout(500)

        # 4. Search for 'NonExistentTerm'
        print("Searching for 'NonExistentTerm'...")
        search_input.fill("NonExistentTerm")
        page.wait_for_timeout(500)

        # Assert 'VOID DETECTED' message
        system_alert = page.get_by_text("VOID DETECTED")
        if system_alert.is_visible():
            print("PASS: Found 'VOID DETECTED' message.")
        else:
            print("FAIL: 'VOID DETECTED' message not visible.")

        # Assert Ghost icon (👻)
        warning_icon = page.locator("div").filter(has_text="👻")
        if warning_icon.count() > 0 and warning_icon.first.is_visible():
             print("PASS: Found Ghost icon.")
        else:
             print("FAIL: Ghost icon not found.")

        # Assert Scanline element exists
        scanline = page.locator(".scanline")
        if scanline.count() > 0:
            print("PASS: Found .scanline element.")
        else:
            print("FAIL: .scanline element not found.")

        page.screenshot(path="verification/search_empty.png")

    except Exception as e:
        print(f"Error: {e}")
        page.screenshot(path="verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
