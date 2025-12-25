from playwright.sync_api import sync_playwright
import re
import os

PROJECT_DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "src", "projectData.js")
OUT_DIR = os.path.join(os.path.dirname(__file__), "")


def load_project_metadata(js_path):
    with open(js_path, "r", encoding="utf-8") as fh:
        content = fh.read()

    titles = re.findall(r'title:\s*"([^"]+)"', content)
    images = re.findall(r'image:\s*["\']([^"\']+)["\']', content)
    return titles, images


def safe_slug(name):
    return re.sub(r'[^a-z0-9\-]+', '-', name.lower()).strip('-')


def verify_app():
    titles, images = load_project_metadata(PROJECT_DATA_FILE)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Visit the local preview URL
            page.goto("http://127.0.0.1:5173")

            # Wait for content to load
            page.wait_for_selector("text=My Web Projects")

            # Verify each project title and image
            for idx, title in enumerate(titles, start=1):
                visible = False
                try:
                    visible = page.get_by_text(title).is_visible()
                except Exception:
                    visible = False

                print(f"{idx}. {title}: {'FOUND' if visible else 'MISSING'}")

                # Check image (if available)
                img_name = None
                if idx - 1 < len(images):
                    img_path = images[idx - 1]
                    img_name = os.path.basename(img_path)
                    img_count = page.locator(f"img[src*='{img_name}']").count()
                    print(f"   image {img_name}: {'FOUND' if img_count>0 else 'MISSING'} (matches={img_count})")
                else:
                    print("   image: none listed in projectData.js")

                # Try to save a per-project screenshot of the title element if possible
                try:
                    locator = page.get_by_text(title)
                    # attempt to screenshot the nearest ancestor container if available
                    # if parent is not helpful, screenshot the element itself
                    slug = safe_slug(title)
                    out_path = os.path.join(OUT_DIR, f"{slug}.png")
                    try:
                        # try ancestor (two levels up) then fallback
                        ancestor = locator.locator('xpath=..').locator('xpath=..')
                        ancestor.screenshot(path=out_path)
                    except Exception:
                        locator.screenshot(path=out_path)
                    print(f"   saved screenshot: {out_path}")
                except Exception as e:
                    print(f"   could not screenshot {title}: {e}")

            # Take a full-page screenshot as well
            full_path = os.path.join(OUT_DIR, "verification.png")
            page.screenshot(path=full_path, full_page=True)
            print(f"Full page screenshot saved to {full_path}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()


if __name__ == "__main__":
    verify_app()
