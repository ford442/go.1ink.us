from playwright.sync_api import sync_playwright

def verify_theme_colors():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            page.goto("http://localhost:5173")
        except:
            print("Error: Could not connect to localhost:5173. Make sure the server is running.")
            return

        page.wait_for_load_state("networkidle")
        page.set_viewport_size({"width": 1280, "height": 800})

        blobs = page.locator(".animate-blob")

        # 1. Initial State
        print("Checking Initial State...")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/theme_default.png")
        print("Saved verification/theme_default.png")

        class_0 = blobs.nth(0).get_attribute("class")
        if "bg-blue-600/30" not in class_0:
             print("ERROR: Initial class incorrect")

        # 2. Click 'Games' Category
        print("Clicking 'Games' category...")
        games_btn = page.locator("button").filter(has_text="Games").first
        if not games_btn.is_visible():
            print("ERROR: Games button not found")
        else:
            games_btn.click()

        print("Waiting for class change...")
        try:
            # Check Button Class with Retry
            games_class = ""
            for _ in range(10):
                page.wait_for_timeout(500)
                games_class = games_btn.get_attribute("class")
                if "bg-orange-500/80" in games_class:
                    print("SUCCESS: Games button has bg-orange-500/80")
                    break
            else:
                print(f"FAILURE: Games button class incorrect: {games_class}")

            blob1 = page.locator(".animate-blob").nth(0)
            for _ in range(10):
                page.wait_for_timeout(500)
                cls = blob1.get_attribute("class")
                if "bg-orange-600/30" in cls:
                    print("SUCCESS: Found bg-orange-600/30")
                    break
            else:
                print("FAILURE: Did not transition to bg-orange-600/30")

            page.screenshot(path="verification/theme_games.png")
            print("Saved verification/theme_games.png")

        except Exception as e:
            print(f"Exception during verification: {e}")

        # 3. Click 'Audio/Visual'
        print("Clicking 'Audio/Visual'...")
        av_btn = page.locator("button").filter(has_text="Audio/Visual").first
        av_btn.click()

        try:
            # Check Button Class with Retry
            av_class = ""
            for _ in range(10):
                page.wait_for_timeout(500)
                av_class = av_btn.get_attribute("class")
                if "bg-fuchsia-500/80" in av_class:
                     print("SUCCESS: Audio/Visual button has bg-fuchsia-500/80")
                     break
            else:
                 print(f"FAILURE: Audio/Visual button class incorrect: {av_class}")

            blob1 = page.locator(".animate-blob").nth(0)
            for _ in range(10):
                page.wait_for_timeout(500)
                cls = blob1.get_attribute("class")
                if "bg-fuchsia-600/30" in cls:
                    print("SUCCESS: Found bg-fuchsia-600/30")
                    break
            else:
                print("FAILURE: Did not transition to bg-fuchsia-600/30")

            page.screenshot(path="verification/theme_av.png")
            print("Saved verification/theme_av.png")

        except Exception as e:
            print(f"Exception: {e}")

        browser.close()

if __name__ == "__main__":
    verify_theme_colors()
