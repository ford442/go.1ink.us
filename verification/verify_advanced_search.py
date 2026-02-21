from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()
    page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # 1. Verify Multi-term Search
        print("Testing Multi-term Search: 'Game Web'")
        search_input = page.get_by_role("textbox")
        search_input.fill("Game Web")
        page.wait_for_timeout(500)

        # 'Cave Crystals' has tags 'Game' and 'Web'. Should match.
        cave_crystals = page.get_by_role("heading", name="Cave Crystals")
        if cave_crystals.is_visible():
            print("PASS: Found 'Cave Crystals' for query 'Game Web'.")
        else:
            print("FAIL: 'Cave Crystals' NOT found for query 'Game Web'.")

        # 'Tetris' has tag 'Game' but NOT 'Web'. Should NOT match.
        tetris = page.get_by_role("heading", name="Tetris")
        if not tetris.is_visible():
             print("PASS: 'Tetris' correctly hidden for query 'Game Web'.")
        else:
             print("FAIL: 'Tetris' should be hidden for query 'Game Web'.")

        page.screenshot(path="verification/multiterm_search.png")

        # 2. Verify Keyboard Navigation
        print("Testing Keyboard Navigation")
        # Clear search to show all items
        search_input.fill("")
        page.wait_for_timeout(500)
        search_input.focus()

        # Press ArrowDown -> Should focus first card
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(300)

        # Check active element is a card link
        active_class = page.evaluate("document.activeElement.className")
        if "card-link" in active_class:
            print("PASS: ArrowDown from input focused a card.")
        else:
            print(f"FAIL: ArrowDown from input focused: {active_class}")

        # Capture focus style
        page.screenshot(path="verification/card_focused.png")

        # Press ArrowDown again -> Should focus NEXT card
        # Store current href
        first_href = page.evaluate("document.activeElement.href")
        page.keyboard.press("ArrowDown")
        page.wait_for_timeout(300)
        second_href = page.evaluate("document.activeElement.href")

        if first_href != second_href:
             print("PASS: ArrowDown moved focus to next card.")
        else:
             print("FAIL: Focus did not move.")

        # Press ArrowUp -> Should go back to first
        page.keyboard.press("ArrowUp")
        page.wait_for_timeout(300)
        current_href = page.evaluate("document.activeElement.href")

        if current_href == first_href:
             print("PASS: ArrowUp moved focus back to first card.")
        else:
             print(f"FAIL: ArrowUp focus mismatch. Expected {first_href}, got {current_href}")

        # Press ArrowUp again -> Should go to Input
        page.keyboard.press("ArrowUp")
        page.wait_for_timeout(300)
        active_tag = page.evaluate("document.activeElement.tagName")

        if active_tag == "INPUT":
             print("PASS: ArrowUp returned focus to Input.")
        else:
             print(f"FAIL: ArrowUp focus tag: {active_tag}")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
