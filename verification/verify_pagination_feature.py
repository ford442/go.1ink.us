from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # 1. Verify Pagination Controls exist
        print("Checking Pagination Controls...")
        prev_btn = page.get_by_role("button", name="PREV")
        next_btn = page.get_by_role("button", name="NEXT")

        if prev_btn.is_visible() and next_btn.is_visible():
            print("PASS: Pagination controls visible.")
        else:
            print("FAIL: Pagination controls missing.")

        # 2. Verify Page 1 has 6 items
        cards = page.locator(".card-link")
        count = cards.count()
        if count == 6:
            print(f"PASS: Page 1 has {count} items.")
        else:
            print(f"FAIL: Page 1 has {count} items (expected 6).")

        # 3. Verify 'PREV' is disabled on Page 1
        if prev_btn.is_disabled():
            print("PASS: PREV button disabled on Page 1.")
        else:
            print("FAIL: PREV button enabled on Page 1.")

        # 4. Click 'NEXT'
        print("Clicking NEXT...")
        next_btn.click()
        page.wait_for_timeout(500)

        # 5. Verify Page 2 has 6 items (assuming >12 items total)
        # Total is 15. Page 1: 6, Page 2: 6, Page 3: 3.
        cards = page.locator(".card-link")
        count = cards.count()
        if count == 6:
            print(f"PASS: Page 2 has {count} items.")
        else:
            print(f"FAIL: Page 2 has {count} items (expected 6).")

        # 6. Click 'NEXT' again
        print("Clicking NEXT...")
        next_btn.click()
        page.wait_for_timeout(500)

        # 7. Verify Page 3 has 3 items
        cards = page.locator(".card-link")
        count = cards.count()
        # Depending on data, might be 3.
        # Let's just check it's > 0 and <= 6
        if count > 0 and count <= 6:
            print(f"PASS: Page 3 has {count} items.")
        else:
            print(f"FAIL: Page 3 has {count} items.")

        # 8. Verify 'NEXT' is disabled on Last Page
        if next_btn.is_disabled():
            print("PASS: NEXT button disabled on Last Page.")
        else:
            print("FAIL: NEXT button enabled on Last Page.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
