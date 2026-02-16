from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173/")
        page.wait_for_selector(".glass-card", timeout=10000)

        # 1. Type in search
        page.fill("input[placeholder='Search protocols...']", "Game")
        page.wait_for_timeout(500)

        # 2. Press ArrowDown
        page.press("input[placeholder='Search protocols...']", "ArrowDown")
        page.wait_for_timeout(500)

        # 3. Check active element
        # The active element should have class 'card-link'
        active_class = page.evaluate("document.activeElement.className")
        print(f"Active Element Class: {active_class}")

        is_card_focused = page.evaluate("document.activeElement.classList.contains('card-link')")
        assert is_card_focused, "Expected focus to be on a card link after pressing ArrowDown"

        print("PASS: Keyboard Navigation Verified")
        browser.close()

if __name__ == "__main__":
    run()
