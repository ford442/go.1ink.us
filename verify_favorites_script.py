from playwright.sync_api import sync_playwright

def verify_favorites():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the app
            page.goto("http://localhost:5173")

            # Wait for the app to load (wait for "All" button)
            page.wait_for_selector("button:has-text('All')")

            # Find a card and click its favorite button
            card = page.locator(".glass-card").first

            # Take a screenshot before clicking
            page.screenshot(path="verification/before_favorite.png")

            # Hover over the card to reveal the favorite button if it's hidden, then click it
            card.hover()

            favorite_btn = card.locator("button[aria-label='Add to favorites']")
            favorite_btn.wait_for(state="visible")
            favorite_btn.click()

            # Take a screenshot of the card with the favorite button active
            page.screenshot(path="verification/card_favorited.png")

            # Click the "Favorites" filter button
            favorites_filter = page.locator("button:has-text('Favorites')")
            favorites_filter.click()

            # Wait for the filter to apply (the count should update or grid should change)
            page.wait_for_timeout(1000) # Give it a moment to animate/filter

            # Take a screenshot of the filtered view
            page.screenshot(path="verification/favorites_filtered.png")

            print("Screenshots taken successfully.")

        except Exception as e:
            print(f"Error during verification: {e}")
            # Take an error screenshot just in case
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    import os
    os.makedirs("verification", exist_ok=True)
    verify_favorites()
