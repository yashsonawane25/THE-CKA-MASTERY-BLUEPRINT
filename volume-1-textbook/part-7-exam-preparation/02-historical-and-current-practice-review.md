# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART VII: EXAM PREPARATION & PSI ENVIRONMENT MASTERY
## CHAPTERS 78–80: READINESS ASSESSMENT, COMPETENCY DRILLS & FINAL CHECKLIST

---

### CHAPTER 78: FINAL READINESS SELF-ASSESSMENT

Before booking your official CKA examination date, evaluate your speed and confidence against this readiness rubric:

| Objective Area | Target Completion Time | Required Accuracy |
| :--- | :--- | :--- |
| Generate Pod & Expose as ClusterIP | < 60 seconds | 100% |
| Author 3-Tier Ingress / Gateway API HTTPRoute | < 4 minutes | 100% |
| Configure Role & RoleBinding for ServiceAccount | < 2 minutes | 100% |
| Execute Complete etcd Backup & Snapshot Restore | < 7 minutes | 100% |
| Upgrade Control Plane Node via kubeadm | < 8 minutes | 100% |
| Diagnose and Fix `NotReady` Worker Node | < 5 minutes | 100% |
| Build Fine-Grained Default-Deny NetworkPolicy | < 3 minutes | 100% |

If any task takes longer than the target time, re-execute the corresponding lab in Volume II.

---

### CHAPTER 79: SPEED DRILLS & IMPERATIVE MUSCLE MEMORY

#### Speed Drill 1: Rapid Workload Exposure
Generate a Deployment named `api-server` with 3 replicas of `nginx:alpine`, exposed internally on port 80 routing to container port 8080:
```bash
kubectl create deployment api-server --image=nginx:alpine --replicas=3
kubectl expose deployment api-server --name=api-svc --port=80 --target-port=8080
```
*Time to execute:* Under 20 seconds.

#### Speed Drill 2: Diagnostic JSONPath Extraction
Extract all pod names and their IP addresses sorted by IP across all namespaces:
```bash
kubectl get pods -A -o custom-columns=NAME:.metadata.name,IP:.status.podIP --sort-by=.status.podIP
```
*Time to execute:* Under 30 seconds.

#### Speed Drill 3: Instant Node Inspection
Identify which node in the cluster is consuming the highest CPU millicores:
```bash
kubectl top nodes --sort-by=cpu
```

---

### CHAPTER 80: MASTER 24-HOUR PRE-EXAM CHECKLIST

#### 24 Hours Before the Exam:
- [ ] Verify government photo ID name matches your Linux Foundation profile exactly.
- [ ] Ensure desk is completely clear of paper, secondary monitors, pens, and electronic devices.
- [ ] Test webcam, microphone, and internet bandwidth on PSI Secure Browser compatibility check.
- [ ] Review Volume IV Command Field Guide for quick JSONPath and etcdctl syntax recall.

#### 15 Minutes Before the Exam:
- [ ] Log in to Linux Foundation portal and launch PSI Secure Browser.
- [ ] Complete identity verification and 360-degree room scan with remote proctor.
- [ ] Once terminal access is granted, set up bash aliases immediately:
  ```bash
  alias k=kubectl
  export do="--dry-run=client -o yaml"
  export now="--force --grace-period=0"
  ```
- [ ] Keep calm, read every task's target context carefully, and execute!
