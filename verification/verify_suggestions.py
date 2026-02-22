from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # 1. Search for a non-existent term
        print("Searching for 'VoidSearch'...")
        page.fill("input[type='text']", "VoidSearch")
        page.wait_for_timeout(500)

        # 2. Check for "Suggested Protocols" text
        print("Checking for 'Suggested Protocols'...")
        suggestions_label = page.get_by_text("Suggested Protocols:")
        if suggestions_label.is_visible():
            print("PASS: Found 'Suggested Protocols' label.")
        else:
            print("FAIL: 'Suggested Protocols' label not found.")

        # 3. Check for suggestion buttons
        # We look for buttons that are siblings or children near the label
        # A simple way is to get all buttons in the void state container that are NOT "Reset Protocol"
        # "Reset Protocol" is outside the inner div.

        # Locate the specific div wrapper I added: "flex flex-col items-center gap-2 pt-2 border-t border-cyan-500/30"
        # It contains the text "Suggested Protocols:"

        suggestion_container = page.locator("div").filter(has_text="Suggested Protocols:").last
        suggestion_buttons = suggestion_container.locator("button")

        count = suggestion_buttons.count()
        print(f"Found {count} suggestion buttons.")

        if count >= 1:
             print("PASS: Found suggestion buttons.")
             # Capture the visual state of suggestions
             page.screenshot(path="verification/suggestions_visible.png")
        else:
             print("FAIL: No suggestion buttons found.")
             # Take debug screenshot
             page.screenshot(path="verification/debug_suggestions.png")

        # 4. Click the first suggestion
        if count > 0:
            first_suggestion = suggestion_buttons.first
            tag_name = first_suggestion.text_content()
            print(f"Clicking suggestion: {tag_name}")
            first_suggestion.click()
            page.wait_for_timeout(1000)

            # 5. Verify Search is cleared and Filter is applied
            search_value = page.input_value("input[type='text']")
            print(f"Search input value: '{search_value}'")
            if search_value == "":
                print("PASS: Search input cleared.")
            else:
                print("FAIL: Search input NOT cleared.")

            # Verify projects are visible
            cards = page.locator(".glass-card")
            card_count = cards.count()
            print(f"Found {card_count} cards after filtering.")
            if card_count > 0:
                print("PASS: Projects are visible.")
            else:
                print("FAIL: No projects visible after clicking suggestion.")

        page.screenshot(path="verification/suggestions_flow.png")

    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
