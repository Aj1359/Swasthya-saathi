import time
import urllib.request
import urllib.error
import os

def measure_url(url, label, samples=5):
    timings = []
    first_latency = None
    status_codes = []

    for i in range(samples):
        t0 = time.perf_counter()
        code = 0
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "SwasthyaSaathi-Auditor/1.0"}
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                code = resp.status
                _ = resp.read(64) # read first chunk for TTFB
        except urllib.error.HTTPError as e:
            code = e.code
        except Exception as e:
            code = str(e)
        t1 = time.perf_counter()
        latency_ms = (t1 - t0) * 1000.0
        timings.append(latency_ms)
        status_codes.append(code)
        if i == 0:
            first_latency = latency_ms
        time.sleep(0.5)

    sorted_timings = sorted(timings)
    mean_lat = sum(timings) / len(timings)
    p50_lat = sorted_timings[len(sorted_timings) // 2]
    p95_lat = sorted_timings[min(int(0.95 * len(sorted_timings)), len(sorted_timings) - 1)]

    return {
        "label": label,
        "url": url,
        "first_request_latency_ms": first_latency,
        "mean_ms": mean_lat,
        "p50_ms": p50_lat,
        "p95_ms": p95_lat,
        "min_ms": min(timings),
        "max_ms": max(timings),
        "samples": timings,
        "status_codes": status_codes
    }

def main():
    frontend_url = "https://swasthya-saathi.vercel.app"
    backend_url = "https://swasthya-saathi-backend-sbme.onrender.com/actuator/health"

    print("Measuring deployment endpoints...")
    fe_res = measure_url(frontend_url, "Frontend (Vercel)")
    print(f"Frontend: First={fe_res['first_request_latency_ms']:.1f}ms, Mean={fe_res['mean_ms']:.1f}ms")

    be_res = measure_url(backend_url, "Backend API (Render)")
    print(f"Backend API: First={be_res['first_request_latency_ms']:.1f}ms, Mean={be_res['mean_ms']:.1f}ms")

    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_file = os.path.join(root_dir, "metrics", "raw", "deployment_ttfb_raw.txt")
    os.makedirs(os.path.dirname(out_file), exist_ok=True)

    with open(out_file, "w", encoding="utf-8") as f:
        f.write("==========================================================================================\n")
        f.write("EXPERIMENT K: PRODUCTION DEPLOYMENT LATENCY & TTFB AUDIT\n")
        f.write(f"Date: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write("==========================================================================================\n\n")

        for r in [fe_res, be_res]:
            f.write(f"Target: {r['label']} ({r['url']})\n")
            f.write(f"  • First-Request Latency (Cold/Idle TTFB): {r['first_request_latency_ms']:.2f} ms\n")
            f.write(f"  • Mean Latency: {r['mean_ms']:.2f} ms\n")
            f.write(f"  • Median (p50): {r['p50_ms']:.2f} ms\n")
            f.write(f"  • 95th Percentile (p95): {r['p95_ms']:.2f} ms\n")
            f.write(f"  • Min: {r['min_ms']:.2f} ms | Max: {r['max_ms']:.2f} ms\n")
            f.write(f"  • Status Codes: {r['status_codes']}\n")
            f.write("  • Sample Timings (ms): " + ", ".join([f"{t:.1f}" for t in r['samples']]) + "\n\n")

        f.write("FINDINGS:\n")
        f.write(f"1. Vercel edge deployment serves frontend with steady TTFB ~{fe_res['mean_ms']:.1f} ms.\n")
        f.write(f"2. Render backend cold start / idle latency was {be_res['first_request_latency_ms']:.1f} ms; warm mean ~{be_res['mean_ms']:.1f} ms.\n")
        f.write("==========================================================================================\n")

    print(f"Report saved to {out_file}")

if __name__ == "__main__":
    main()
