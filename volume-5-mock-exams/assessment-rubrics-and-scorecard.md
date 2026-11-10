# VOLUME V: THE CKA MOCK EXAMINATION SYSTEM
# CANDIDATE SCORECARD, GRADING RUBRICS, AND READINESS MATRIX

---

## 1. COMPREHENSIVE CANDIDATE SCORECARD

Use this master scorecard to calculate your score for each of the four mock examinations:

```
┌─────────────────────────────────────────────────────────────┬──────────┬─────────────┬───────────┐
│ Domain                                                      │ Weight   │ Points Max  │ Your Score│
├─────────────────────────────────────────────────────────────┼──────────┼─────────────┼───────────┤
│ 1. Troubleshooting                                          │ 30%      │ 30.0        │           │
│ 2. Cluster Architecture, Installation & Configuration       │ 25%      │ 25.0        │           │
│ 3. Services & Networking                                    │ 20%      │ 20.0        │           │
│ 4. Workloads & Scheduling                                   │ 15%      │ 15.0        │           │
│ 5. Storage                                                  │ 10%      │ 10.0        │           │
├─────────────────────────────────────────────────────────────┼──────────┼─────────────┼───────────┤
│ TOTAL COMPOSITE SCORE                                       │ 100%     │ 100.0       │           │
└─────────────────────────────────────────────────────────────┴──────────┴─────────────┴───────────┘
```

$$\text{Final Percentage} = \frac{\text{Total Earned Points}}{\text{Total Possible Points}} \times 100$$
- **Passing Threshold:** **66.0%**
- **Recommended Candidate Target:** **80.0%+** (provides a safe buffer for PSI remote desktop latency).

---

## 2. SECONDARY COMPETENCY METRICS

| Evaluation Dimension | Benchmark Target | Remediation Action if Below Benchmark |
| :--- | :--- | :--- |
| **Command-Line Efficiency** | $\le 30$ seconds to generate any boilerplate YAML via `--dry-run=client -o yaml`. | Practice Section 74 speed setup drills daily. |
| **Context Switching Hygiene**| 100% compliance; zero tasks executed in the wrong cluster context. | Tape a note to monitor: "CHECK CONTEXT FIRST". |
| **Time Management** | Complete 15 tasks within the first 90 minutes; 30 minutes for pass 3. | Enforce the 3-Pass Strategy (Pass 1: quick wins). |
| **Troubleshooting Speed** | Diagnose a `NotReady` node or crashed static pod in $< 8$ minutes. | Review Volume III diagnostic decision trees. |

---

## 3. AUTOMATED VERIFICATION SCRIPT TEMPLATE

Candidates running local test clusters can execute this bash assertion script to automatically verify task completion:

```bash
#!/usr/bin/env bash
# Automated Verification Harness for CKA Mock Exam 4
set -uo pipefail

SCORE=0
MAX_SCORE=100

echo "=================================================="
echo "STARTING AUTOMATED VERIFICATION AUDIT"
echo "=================================================="

# Check Task 1: Node Ready
if kubectl get nodes node-2 | grep -q "Ready"; then
    echo "[PASS] Task 1: node-2 is Ready (+6)"
    SCORE=$((SCORE + 6))
else
    echo "[FAIL] Task 1: node-2 is NotReady"
fi

# Check Task 8: etcd snapshot exists
if [ -f /var/data/etcd-final-mock.db ]; then
    echo "[PASS] Task 8: etcd snapshot exists (+6)"
    SCORE=$((SCORE + 6))
else
    echo "[FAIL] Task 8: etcd snapshot missing"
fi

# Check Task 9: ServiceAccount & Role
if kubectl auth can-i create deployments -n operations --as=system:serviceaccount:operations:deployer | grep -q "yes"; then
    echo "[PASS] Task 9: ServiceAccount permissions verified (+4)"
    SCORE=$((SCORE + 4))
else
    echo "[FAIL] Task 9: ServiceAccount cannot create deployments"
fi

# Check Task 19: PV Bound
if kubectl get pvc pvc-storage-1 2>/dev/null | grep -q "Bound"; then
    echo "[PASS] Task 19: PVC pvc-storage-1 is Bound (+5)"
    SCORE=$((SCORE + 5))
else
    echo "[FAIL] Task 19: PVC is not Bound"
fi

echo "=================================================="
echo "TOTAL SCORE: ${SCORE} / ${MAX_SCORE}"
if [ $SCORE -ge 66 ]; then
    echo "STATUS: CANDIDATE PASSED"
else
    echo "STATUS: CANDIDATE FAILED (Threshold: 66)"
fi
echo "=================================================="
```

---

## 4. POST-EXAM DIAGNOSTIC READINESS MATRIX

```
┌─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────────┐
│ SCORE: < 55%                    │ SCORE: 55% – 65%                │ SCORE: 66% – 100%               │
│ [NOT READY - HIGH RISK]         │ [BORDERLINE - REVIEW REQUIRED]  │ [EXAM READY - EXCELLENT BUFFER] │
├─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────────┤
│ • Do not sit the live exam yet. │ • Review high-weight domains    │ • Candidate exhibits necessary  │
│ • Critical gaps in core triage   │   (Troubleshooting & Cluster    │   CLI muscle memory and triage  │
│   and kubeadm commands.         │   Architecture).                │   instincts.                    │
│ • Re-run Volume II practical    │ • Drill JSONPath queries and    │ • Execute a final timed mock    │
│   workbooks for Domain 1 & 5.   │   NetworkPolicies.              │   exam 24 hours prior to sit.   │
└─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────────┘
```
