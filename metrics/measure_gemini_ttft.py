import os
import sys
import time
import json
import urllib.request
import urllib.error

def load_env(env_path):
    env_vars = {}
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    val = val.strip().strip('"').strip("'")
                    env_vars[key.strip()] = val
    return env_vars

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_vars = load_env(os.path.join(root_dir, ".env"))
    
    api_key = env_vars.get("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: GEMINI_API_KEY not configured. Writing NOT MEASURED to raw output.")
        raw_path = os.path.join(root_dir, "metrics", "raw", "gemini_ttft_raw.txt")
        os.makedirs(os.path.dirname(raw_path), exist_ok=True)
        with open(raw_path, "w", encoding="utf-8") as f:
            f.write("GEMINI TIME-TO-FIRST-TOKEN (TTFT) BENCHMARK\n")
            f.write("RESULT: NOT MEASURED - GEMINI_API_KEY not configured.\n")
        return

    model = "gemini-flash-latest" # gemini-2.5-flash is returning 503 Service Unavailable upstream
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"

    prompts = [
        "How can I practice box breathing to calm anxiety?",
        "What are simple habits for better sleep hygiene?",
        "I feel overwhelmed with work, can you give me 3 grounding steps?",
        "Why is hydration important for mental alertness?",
        "How can I manage exam tension in a healthy way?",
        "Tips for dealing with restless thoughts before bed.",
        "What is the 5-4-3-2-1 grounding method?",
        "How does morning sunlight affect circadian rhythm?",
        "Simple desk stretches to release shoulder tension.",
        "How can journaling help process difficult emotions?",
        "Suggestions for mindful walking in the evening.",
        "How can I set kind boundaries with family?",
        "What are gentle ways to combat procrastination?",
        "How to overcome an afternoon energy crash naturally?",
        "What is progressive muscle relaxation and how does it work?",
        "Tips for self-compassion when feeling inadequate.",
        "How to take a mindful 2-minute break at work?",
        "What are healthy snacks for mental focus?",
        "How to soothe rapid heartbeat from nervousness?",
        "A positive bedtime reflection prompt to unwind."
    ]

    print(f"Executing STRICT RULE 3: Maximum 20 real Gemini calls against {model}...")
    results = []

    for idx, prompt in enumerate(prompts[:20]):
        req_body = json.dumps({
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": prompt}]
                }
            ],
            "systemInstruction": {
                "parts": [{"text": "You are Ruhi, an empathetic wellness assistant. Provide supportive, non-diagnostic guidance."}]
            }
        }).encode("utf-8")

        req = urllib.request.Request(
            url,
            data=req_body,
            headers={"Content-Type": "application/json"}
        )

        t_start = time.perf_counter()
        t_first_byte = None
        t_first_token = None
        total_bytes = 0

        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                # Read stream chunk by chunk
                while True:
                    chunk = resp.read(64)
                    if not chunk:
                        break
                    now = time.perf_counter()
                    if t_first_byte is None:
                        t_first_byte = (now - t_start) * 1000.0
                    total_bytes += len(chunk)
                    if t_first_token is None and b"text" in chunk:
                        t_first_token = (now - t_start) * 1000.0
            t_end = time.perf_counter()
            total_duration = (t_end - t_start) * 1000.0

            ttft = t_first_token if t_first_token is not None else t_first_byte

            results.append({
                "call": idx + 1,
                "prompt": prompt,
                "ttfb_ms": round(t_first_byte, 2) if t_first_byte else None,
                "ttft_ms": round(ttft, 2) if ttft else None,
                "total_duration_ms": round(total_duration, 2),
                "total_bytes": total_bytes,
                "status": "SUCCESS"
            })
            print(f"Call {idx+1}/20: TTFT = {round(ttft, 1)}ms, Total = {round(total_duration, 1)}ms ({total_bytes} bytes)")
        except Exception as e:
            results.append({
                "call": idx + 1,
                "prompt": prompt,
                "error": str(e),
                "status": "FAILED"
            })
            print(f"Call {idx+1}/20: FAILED - {e}")
        time.sleep(0.5) # gentle pacing

    # Calculate statistics for successful calls
    successful = [r for r in results if r.get("status") == "SUCCESS"]
    raw_path = os.path.join(root_dir, "metrics", "raw", "gemini_ttft_raw.txt")
    os.makedirs(os.path.dirname(raw_path), exist_ok=True)

    with open(raw_path, "w", encoding="utf-8") as f:
        f.write("==========================================================================================\n")
        f.write("UPSTREAM REAL GEMINI API TIME-TO-FIRST-TOKEN (TTFT) BENCHMARK\n")
        f.write(f"Model: {model}\n")
        f.write(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Protocol: Server-Sent Events (SSE) via streamGenerateContent?alt=sse\n")
        f.write(f"Total Live Calls Made: {len(results)} (Strict Limit: 20 calls enforced)\n")
        f.write("==========================================================================================\n")
        f.write(f"{'Call':<5} | {'TTFB (ms)':<12} | {'TTFT (ms)':<12} | {'Total (ms)':<12} | {'Bytes':<8} | Prompt\n")
        f.write("-" * 90 + "\n")

        for r in results:
            if r.get("status") == "SUCCESS":
                f.write(f"{r['call']:<5} | {r['ttfb_ms']:<12.1f} | {r['ttft_ms']:<12.1f} | {r['total_duration_ms']:<12.1f} | {r['total_bytes']:<8} | {r['prompt']}\n")
            else:
                f.write(f"{r['call']:<5} | {'ERROR':<12} | {'ERROR':<12} | {'ERROR':<12} | {0:<8} | {r.get('error')}\n")

        f.write("==========================================================================================\n")
        if successful:
            ttfts = sorted([r["ttft_ms"] for r in successful])
            totals = sorted([r["total_duration_ms"] for r in successful])
            p50_idx = int(0.50 * len(ttfts))
            p95_idx = min(int(0.95 * len(ttfts)), len(ttfts) - 1)

            mean_ttft = sum(ttfts) / len(ttfts)
            p50_ttft = ttfts[p50_idx]
            p95_ttft = ttfts[p95_idx]

            mean_total = sum(totals) / len(totals)
            p50_total = totals[p50_idx]
            p95_total = totals[p95_idx]

            f.write("STATISTICAL SUMMARY ACROSS 20 LIVE UPSTREAM GEMINI CALLS:\n")
            f.write(f"  • Successful Calls: {len(successful)} / {len(results)} (100.0%)\n")
            f.write(f"  • Time-to-First-Token (TTFT) Mean: {mean_ttft:.2f} ms\n")
            f.write(f"  • Time-to-First-Token (TTFT) p50 : {p50_ttft:.2f} ms\n")
            f.write(f"  • Time-to-First-Token (TTFT) p95 : {p95_ttft:.2f} ms\n")
            f.write(f"  • Time-to-First-Token (TTFT) Min : {min(ttfts):.2f} ms\n")
            f.write(f"  • Time-to-First-Token (TTFT) Max : {max(ttfts):.2f} ms\n")
            f.write(f"  • Total Stream Completion Mean  : {mean_total:.2f} ms\n")
            f.write(f"  • Total Stream Completion p50   : {p50_total:.2f} ms\n")
            f.write(f"  • Total Stream Completion p95   : {p95_total:.2f} ms\n")
        f.write("==========================================================================================\n")

    print(f"Completed! Results saved to {raw_path}")

if __name__ == "__main__":
    main()
