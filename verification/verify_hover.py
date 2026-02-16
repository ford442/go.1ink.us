from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = context.new_page()

    try:
        print("Navigating to http://localhost:5173/")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")

        # Get the first project card
        # The cards have className 'glass-card'
        card = page.locator(".glass-card").first

        # Verify delay-700 class on the image
        img = card.locator("img")
        class_name = img.get_attribute("class")
        print(f"Image classes: {class_name}")
        if "delay-700" in class_name:
            print("PASS: delay-700 class found on image.")
        else:
            print("FAIL: delay-700 class NOT found on image.")

        # Hover to trigger effects
        # Move mouse to center of the card
        box = card.bounding_box()
        if box:
            cx = box['x'] + box['width'] / 2
            cy = box['y'] + box['height'] / 2
            print(f"Hovering at {cx}, {cy}")
            page.mouse.move(cx, cy)

            # Wait a bit for transition (it has duration 500ms for sheen)
            page.wait_for_timeout(1000)

            # Take screenshot of the card
            page.screenshot(path="verification/card_hover.png")
            print("Screenshot taken: verification/card_hover.png")
        else:
            print("FAIL: Could not get bounding box of card.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
