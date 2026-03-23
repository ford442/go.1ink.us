import re

with open('src/Card.jsx', 'r') as f:
    content = f.read()

if "complexityScore" in content:
    print("Success")
