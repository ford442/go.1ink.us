from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")

    page.wait_for_selector(".container")

    print("Clicking 'Games' category...")
    page.get_by_role("button", name="Games").click()

    print("Waiting for 'Adventure' tag...")
    adventure_btn = page.get_by_role("button", name="Adventure (1)")
    adventure_btn.wait_for(state="visible")

    print("Clicking 'Adventure' tag...")
    adventure_btn.click()

    print("Verifying active state style...")
    # Wait for the class to change
    try:
        # Use a locator assertion-like wait
        # We wait until the element has the class 'bg-cyan-500/80'
        # Note: class names might have extra spaces, so we check substring
        page.wait_for_function("""
            () => {
                const btn = document.evaluate("//button[contains(., 'Adventure (1)')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return btn && btn.className.includes('bg-cyan-500/80');
            }
        """, timeout=5000)
        print("SUCCESS: Active tag has Cyan style.")
    except Exception as e:
        print(f"FAILURE: Active tag did not get Cyan style. Error: {e}")
        # Print current class
        print(f"Current class: {adventure_btn.get_attribute('class')}")
        exit(1)

    # 5. Verify Global Escape
    print("Pressing Escape...")
    page.keyboard.press("Escape")

    # 6. Verify Reset to 'All'
    print("Waiting for reset...")
    try:
        page.wait_for_function("""
            () => {
                const btn = document.evaluate("//button[contains(., 'All (15)')]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                return btn && btn.className.includes('bg-cyan-500/80');
            }
        """, timeout=5000)
        print("SUCCESS: 'All' filter is active after Escape.")
    except Exception as e:
        print(f"FAILURE: Reset failed. Error: {e}")
        exit(1)

    print("ALL TESTS PASSED")
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
