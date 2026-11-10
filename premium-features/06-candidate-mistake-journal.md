# CKA CANDIDATE MISTAKE JOURNAL & POST-MORTEM SYSTEM
## STRUCTURED ROOT-CAUSE AUDITING TO PREVENT EXAM REPEAT ERRORS

---

## 1. THE MISTAKE JOURNAL PROTOCOL
Research proves that learners who document and categorize their coding mistakes retain correct procedures 3x longer than those who simply read the solution.

Whenever you fail a lab or mock exam task, complete this 5-point root-cause template:
1. **Error Event:** Exactly what command was run and what error output was returned.
2. **Category of Error:** Syntax typo, namespace oversight, context mismatch, conceptual misconception, or documentation inability.
3. **True Root Cause:** Why the error occurred mechanically inside Kubernetes.
4. **Corrective Procedure:** The exact verified command sequence that permanently fixes it.
5. **Prevention Rule:** A one-sentence rule you will recite to never make this mistake again.

---

## 2. COMMON HIGH-FREQUENCY MISTAKE REGISTER

### Mistake 1: The Context Amnesia Error
* **Symptom:** Task asks to fix node in cluster `infra-cluster`, but candidate executes commands against `k8s`. Result: 0 points awarded on official exam.
* **Root Cause:** Failing to run the context switch command specified at the top of the question.
* **Corrective Procedure:**
  ```bash
  kubectl config use-context infra-cluster
  kubectl config current-context # Verify
  ```
* **Prevention Rule:** *Never type a single kubectl command without first copying and executing the task's context switch line.*

---

### Mistake 2: The Deprecated Flag Trap
* **Symptom:** Running `kubectl set image deployment/app nginx=nginx:1.27 --record` produces warnings or fails to record revision history.
* **Root Cause:** `--record` was permanently removed in kubectl v1.26+.
* **Corrective Procedure:**
  ```bash
  kubectl set image deployment/app nginx=nginx:1.27
  kubectl annotate deployment/app kubernetes.io/change-cause="Upgrade to 1.27" --overwrite
  ```
* **Prevention Rule:** *Always use kubernetes.io/change-cause annotations to record deployment history.*

---

### Mistake 3: The etcd Direct Overwrite Disaster
* **Symptom:** Executing `etcdctl snapshot restore /opt/backup.db` directly restores over `/var/lib/etcd`, causing corrupted Raft logs and an unbootable control plane.
* **Root Cause:** Omitting `--data-dir=/var/lib/etcd-restored` forces etcd to write into the active database path.
* **Corrective Procedure:**
  ```bash
  ETCDCTL_API=3 etcdctl snapshot restore /opt/backup.db \
    --data-dir=/var/lib/etcd-restored \
    --initial-cluster="master=https://127.0.0.1:2380" \
    --name="master"
  # Update /etc/kubernetes/manifests/etcd.yaml hostPath to /var/lib/etcd-restored
  ```
* **Prevention Rule:** *Always restore etcd snapshots to a brand new target directory and point the static pod manifest to that new path.*

---

### Mistake 4: The NetworkPolicy Egress DNS Lockout
* **Symptom:** You apply an egress NetworkPolicy to isolate a pod. Suddenly, the pod throws `Name or service not known` and cannot communicate with any internal service.
* **Root Cause:** Applying any egress policy turns on default-deny for all outbound traffic, silently blocking UDP Port 53 queries to CoreDNS.
* **Corrective Procedure:**
  Always append an explicit DNS egress rule to every egress NetworkPolicy:
  ```yaml
  egress:
  - ports:
    - protocol: UDP
      port: 53
    - protocol: TCP
      port: 53
  ```
* **Prevention Rule:** *Every egress NetworkPolicy must explicitly whitelist UDP port 53 to allow CoreDNS resolution.*

---

## 3. BLANK MISTAKE JOURNAL TEMPLATE FOR CANDIDATE USE

```markdown
### MISTAKE ENTRY #[NUMBER]
* **Date & Lab/Mock Task:** [e.g., Day 12 / Vol II Lab 42]
* **Target Objective:** [e.g., Restricting ingress traffic to backend pods]
* **What I Typed / Ran:**
  ```bash
  [Insert erroneous command or manifest snippet here]
  ```
* **What Kubernetes Returned:**
  ```text
  [Insert error message, HTTP status code, or unexpected behavior]
  ```
* **Why It Failed Mechanically:**
  [Explain the internal reason: e.g., Missing hyphen in YAML created AND instead of OR]
* **The Correct Solution:**
  ```bash
  [Insert verified working command]
  ```
* **My Prevention Rule:**
  "[State your memorable takeaway rule]"
```
