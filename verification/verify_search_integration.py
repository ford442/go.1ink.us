from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # 1. Clear search to ensure we are at start state
        page.get_by_role("textbox").fill("")
        page.wait_for_timeout(500)

        # 2. Go to Page 2
        print("Navigating to Page 2...")
        next_btn = page.locator("button:has-text('NEXT')")
        if next_btn.is_visible() and not next_btn.is_disabled():
            next_btn.click()
            page.wait_for_timeout(500)
            print("Clicked NEXT.")
        else:
            print("NEXT button not available, cannot test Page 2 reset.")
            return

        # 3. Apply filter 'Tools'
        print("Applying filter 'Tools'...")
        # Use exact text to avoid ambiguity
        tools_btn = page.locator("button").filter(has_text="Tools").first
        tools_btn.click()
        page.wait_for_timeout(1000) # Increase timeout

        # 4. Debug State
        pagination = page.locator("button:has-text('PREV')") # Any pagination button serves as proxy for container

        if pagination.is_visible():
            print("Pagination is VISIBLE.")
            # Check content of indicator
            indicator = page.locator("span").filter(has_text="PAGE").first
            if indicator.is_visible():
                text = indicator.text_content()
                print(f"Indicator Text: '{text}'")

                if "PAGE 1" in text:
                    print("PASS: Reset to Page 1 confirmed.")
                else:
                    print(f"FAIL: Expected 'PAGE 1', got '{text}'.")
            else:
                print("FAIL: Pagination visible but indicator not found.")
        else:
            print("Pagination is HIDDEN (Correct if items <= 6).")
            # If items <= 6, effectively Page 1.
            print("PASS: Reset to Page 1 (via hidden pagination).")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
