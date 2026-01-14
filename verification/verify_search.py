from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:5173")

    # Verify initial load
    expect(page.get_by_role("heading", name="Cave Crystals")).to_be_visible()

    # Test 1: Search for "Utility" (Tag search)
    # "Utility" is a tag for "Weather Clock", but not in title/desc.
    # Note: Placeholder text was updated in App.jsx
    search_input = page.get_by_placeholder("Search portal... (Press /)")
    expect(search_input).to_be_visible()

    search_input.fill("Utility")

    # Expect "Weather Clock" to be visible
    expect(page.get_by_role("heading", name="Weather Clock")).to_be_visible()

    # Expect "Cave Crystals" to be HIDDEN (filtered out)
    expect(page.get_by_role("heading", name="Cave Crystals")).not_to_be_visible()

    print("Search for Tag 'Utility' working correctly.")

    # Test 2: Clear search and test Keyboard Shortcut
    # The clear button appears when there is text
    # It has aria-label="Clear search" in the code I read?
    # Let's check App.jsx: aria-label="Clear search"
    page.get_by_label("Clear search").click()

    # Verify cleared
    expect(page.get_by_role("heading", name="Cave Crystals")).to_be_visible()

    # Click somewhere else to blur
    page.mouse.click(0, 0)

    # Press '/'
    page.keyboard.press("/")

    # Check if input is focused
    expect(search_input).to_be_focused()

    print("Keyboard shortcut '/' working correctly.")

    # Take screenshot of the "Utility" search result
    search_input.fill("Utility")
    page.wait_for_timeout(1000) # Wait for animations
    page.screenshot(path="verification/verification.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
