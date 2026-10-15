import json
import os

def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    json_path = os.path.join(root, "metrics", "raw", "lighthouse_raw.json")
    out_path = os.path.join(root, "metrics", "raw", "lighthouse_summary.txt")

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    cats = data.get("categories", {})
    auds = data.get("audits", {})

    lines = []
    lines.append("==========================================================================================")
    lines.append("EXPERIMENT J: GOOGLE LIGHTHOUSE AUDIT SUMMARY")
    lines.append("Target URL: https://swasthya-saathi.vercel.app")
    lines.append("Auditor: Lighthouse v12 (Chrome Headless)")
    lines.append("==========================================================================================")
    lines.append("CATEGORY SCORES (0 - 100):")
    for cat_key, cat in cats.items():
        score = int(cat.get("score", 0) * 100) if cat.get("score") is not None else 0
        lines.append(f"  • {cat.get('title')}: {score} / 100")

    lines.append("\nCORE WEB VITALS & TIMING METRICS:")
    metric_keys = [
        "first-contentful-paint",
        "largest-contentful-paint",
        "total-blocking-time",
        "cumulative-layout-shift",
        "speed-index",
        "interactive"
    ]
    for m in metric_keys:
        if m in auds:
            title = auds[m].get("title")
            val = auds[m].get("displayValue") or str(round(auds[m].get("numericValue", 0), 2))
            lines.append(f"  • {title}: {val}")

    lines.append("==========================================================================================")

    output_text = "\n".join(lines) + "\n"
    print(output_text)

    with open(out_path, "w", encoding="utf-8") as f:
        f.write(output_text)

if __name__ == "__main__":
    main()
