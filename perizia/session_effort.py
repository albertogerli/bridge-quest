import subprocess
out = subprocess.run(['git','log','--format=%at','--reverse'], capture_output=True, text=True).stdout
ts = [int(x) for x in out.split()]

def calc(gap, ramp):
    s = 0; tt = 0; cs = None; pv = None
    for t in ts:
        if pv is None or t - pv > gap:
            if cs is not None:
                tt += (pv - cs) + ramp
            s += 1; cs = t
        pv = t
    tt += (pv - cs) + ramp
    return s, tt / 3600

print("commit analizzati:", len(ts))
for g, r, lbl in [(90*60, 30*60, 'base (gap 90min, ramp 30min)'),
                  (63*60, 21*60, '-30%'),
                  (117*60, 39*60, '+30%')]:
    s, h = calc(g, r)
    print(f"{lbl}: sessioni {s}, ore {h:.1f}")
