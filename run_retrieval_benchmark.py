import json
import re
import math
from collections import Counter

# Load chunks from seed_knowledge.py
with open('seed_knowledge.py', 'r', encoding='utf-8') as f:
    text = f.read()

doc_start = text.find('documents = [')
doc_end = text.find('\n]\n', doc_start) + 3
doc_code = text[doc_start:doc_end]
local_scope = {}
exec(doc_code, {}, local_scope)
docs = local_scope['documents']

# Load 40 labeled questions
with open('metrics/retrieval_benchmark_set.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

def tokenize(txt):
    return re.findall(r'\b[a-zA-Z0-9_\-]+\b', txt.lower())

corpus = []
for d in docs:
    tags_str = ' '.join(d.get('tags', []))
    corpus.append(d['title'] + ' ' + d['content'] + ' ' + tags_str)

tokenized_corpus = [tokenize(doc) for doc in corpus]
N = len(corpus)

df = Counter()
for doc_tokens in tokenized_corpus:
    for t in set(doc_tokens):
        df[t] += 1

idf = {t: math.log((N + 1) / (df[t] + 1)) + 1 for t in df}

def tfidf_vector(tokens):
    tf = Counter(tokens)
    vec = {}
    total = len(tokens) if tokens else 1
    for t, count in tf.items():
        if t in idf:
            vec[t] = (count / total) * idf[t]
    return vec

def cosine_similarity(v1, v2):
    dot = sum(v1[t] * v2.get(t, 0.0) for t in v1)
    norm1 = math.sqrt(sum(x * x for x in v1.values()))
    norm2 = math.sqrt(sum(x * x for x in v2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)

doc_vectors = [tfidf_vector(tokens) for tokens in tokenized_corpus]

log_lines = []
log_lines.append('KNOWLEDGE CHUNK RETRIEVAL BENCHMARK REPORT (40 LABELED QUESTIONS)')
log_lines.append('================================================================================')
log_lines.append(f'Total Corpus Documents: {N}')
log_lines.append(f'Total Evaluation Queries: {len(questions)}')
log_lines.append('--------------------------------------------------------------------------------')
log_lines.append(f'{"ID":<4} | {"TOP-1":<6} | {"TOP-3":<6} | {"SCORE":<6} | {"TARGET TITLE":<35} | {"QUESTION"}')
log_lines.append('--------------------------------------------------------------------------------')

top1_hits = 0
top3_hits = 0
failures = []

for q in questions:
    q_vec = tfidf_vector(tokenize(q['question']))
    scores = [(cosine_similarity(q_vec, d_vec), i) for i, d_vec in enumerate(doc_vectors)]
    scores.sort(reverse=True, key=lambda x: x[0])

    top1_doc = docs[scores[0][1]]
    top3_docs = [docs[s[1]] for s in scores[:3]]

    target = q['target_title']
    is_top1 = (top1_doc['title'] == target)
    is_top3 = any(d['title'] == target for d in top3_docs)

    if is_top1:
        top1_hits += 1
    if is_top3:
        top3_hits += 1
    else:
        failures.append({
            'id': q['id'],
            'question': q['question'],
            'target': target,
            'top1_retrieved': top1_doc['title'],
            'top1_score': scores[0][0],
            'top3_retrieved': [d['title'] for d in top3_docs]
        })

    log_lines.append(f"{q['id']:<4} | {str(is_top1):<6} | {str(is_top3):<6} | {scores[0][0]:<6.3f} | {target[:34]:<35} | {q['question']}")

top1_rate = top1_hits / len(questions)
top3_rate = top3_hits / len(questions)

log_lines.append('================================================================================')
log_lines.append(f'TOP-1 HIT RATE: {top1_hits}/{len(questions)} ({top1_rate * 100:.2f}%)')
log_lines.append(f'TOP-3 HIT RATE: {top3_hits}/{len(questions)} ({top3_rate * 100:.2f}%)')
log_lines.append('--------------------------------------------------------------------------------')
log_lines.append(f'RETRIEVAL FAILURES (NOT IN TOP 3): {len(failures)}')
for f_item in failures:
    log_lines.append(f"  - [ID {f_item['id']}] \"{f_item['question']}\"")
    log_lines.append(f"      Expected Target: {f_item['target']}")
    log_lines.append(f"      Top-3 Retrieved: {f_item['top3_retrieved']}")
log_lines.append('================================================================================')

with open('metrics/raw/retrieval_algorithm_raw.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(log_lines))

summary = {
    'total_questions': len(questions),
    'corpus_size': N,
    'top1_hits': top1_hits,
    'top1_rate': top1_rate,
    'top3_hits': top3_hits,
    'top3_rate': top3_rate,
    'failure_count': len(failures),
    'failures': failures
}

with open('metrics/raw/retrieval_summary.json', 'w', encoding='utf-8') as f:
    json.dump(summary, f, indent=2)

print(f'Retrieval Benchmark Completed: Top-1 = {top1_rate*100:.1f}%, Top-3 = {top3_rate*100:.1f}%, Failures = {len(failures)}')
