import re, glob
for f in sorted(glob.glob('src/data/*.ts')):
    txt = open(f).read()
    quiz = len(re.findall(r'type:\s*"quiz"', txt))
    cs = len(re.findall(r'"card-select"', txt))
    he = len(re.findall(r'"hand-eval"', txt))
    bs = len(re.findall(r'"bid-select"', txt))
    tf = len(re.findall(r'"true-false"', txt))
    sq = len(re.findall(r'"sequence"', txt))
    inter = quiz + cs + he + bs + tf + sq
    print(f"{f}: quiz={quiz} card-select={cs} hand-eval={he} bid-select={bs} true-false={tf} seq={sq} | blocchi interattivi={inter}")
