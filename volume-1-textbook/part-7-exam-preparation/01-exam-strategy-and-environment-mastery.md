# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART VII: EXAM PREPARATION & PSI ENVIRONMENT MASTERY
## CHAPTERS 73–77: EXAM STRATEGY, TIME MANAGEMENT & PSI REMOTE DESKTOP

---

### CHAPTER 73: UNDERSTANDING THE CKA CERTIFICATION ENVIRONMENT

#### 1. The Official Remote Workstation
The CKA examination is delivered via the PSI Secure Browser, connecting candidates to a remote Linux desktop (Ubuntu 22.04 LTS running XFCE):
* **Terminal:** Standard XFCE Terminal with `bash`.
* **Editor:** `vim` or `nano` (VS Code is present but extensions are disabled; `vim` is recommended for maximum speed).
* **Browser:** Single-tab Chromium browser restricted to official documentation domains:
  * `https://kubernetes.io/docs/`
  * `https://kubernetes.io/blog/`
  * `https://helm.sh/docs/`
* **Clipboard:** Cut and paste operates within the remote desktop using standard Linux shortcuts (`Ctrl+Shift+C` and `Ctrl+Shift+V`).

---

### CHAPTER 74: TIME MANAGEMENT & COMMAND-LINE SPEED

#### 1. The 120-Minute Time Budget
The examination contains 15 to 20 performance tasks:
* Average time per task: **6 to 8 minutes**.
* The **3-Minute Rule**: If you cannot formulate a clear solution path within 3 minutes of reading a task, **FLAG IT AND MOVE ON**.
* High-weight troubleshooting tasks (e.g., control plane outage, cluster upgrade, etcd restore) carry up to 8% to 10% each. Low-weight pod configuration tasks carry 3% to 4%.

#### 2. Essential Time-Saving Aliases
At the start of the exam, run:
```bash
alias k=kubectl
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"
```

---

### CHAPTER 75: OFFICIAL DOCUMENTATION NAVIGATION STRATEGY

Do not browse the documentation hierarchy during the exam. Use direct keyword search inside the documentation browser tab:

| Objective | Documentation Search Keyword | Target Page |
| :--- | :--- | :--- |
| NetworkPolicy | "Network Policies" | Concepts -> Services, Networking -> Network Policies |
| Ingress | "Ingress" | Concepts -> Services, Networking -> Ingress |
| Gateway API | "Gateway API" | Concepts -> Services, Networking -> Gateway API |
| PersistentVolume | "Persistent Volumes" | Concepts -> Storage -> Persistent Volumes |
| Kubeadm Upgrade | "Upgrading kubeadm clusters" | Tasks -> Administer a Cluster -> Upgrading kubeadm clusters |
| etcd Backup / Restore | "Operating etcd clusters for Kubernetes" | Tasks -> Administer a Cluster -> Operating etcd clusters |

Copy YAML code snippets directly from the documentation using the top-right copy icon on code blocks.

---

### CHAPTER 76: EXAM TASK PRIORITIZATION MATRIX

Execute exam questions in three distinct waves:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ WAVE 1: Low-Hanging Fruit (First 40 Minutes)                                │
│ Tasks: Pod generation, Deployments, Services, ConfigMaps, Secrets, RBAC.    │
│ Target: Secure 35% - 40% of the total score quickly with zero mistakes.     │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│ WAVE 2: Standard Administration & Storage (Next 45 Minutes)                 │
│ Tasks: PV/PVC creation, NetworkPolicies, Ingress, Node Draining, Upgrades.  │
│ Target: Push cumulative score past the 66% passing threshold.               │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────────────────────┐
│ WAVE 3: Complex Troubleshooting & Flagged Tasks (Remaining 35 Minutes)      │
│ Tasks: etcd snapshot restore, broken control plane, failing kubelet.        │
│ Target: Maximize final score toward 85%+.                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### CHAPTER 77: THE TOP 10 DEADLIEST CANDIDATE MISTAKES

1. **Forgetting to Switch Context:** Every task begins with a context switch command:
   ```bash
   kubectl config use-context <context-name>
   ```
   Failing to run this executes the solution on the wrong cluster, awarding **zero points**.
2. **Working in the Wrong Namespace:** Always append `-n <target-namespace>` or verify current namespace.
3. **Using Deprecated Flags:** Running `kubectl ... --record` or using obsolete `batch/v1beta1` APIs.
4. **Writing YAML from Scratch:** Always use `kubectl run ... $do` or copy from official docs.
5. **Overwriting the etcd Data Directory:** Restoring etcd directly into `/var/lib/etcd` without specifying a new target directory.
6. **Forgetting to Uncordon Nodes:** Leaving upgraded nodes cordoned.
7. **Indentation Errors in YAML:** Mixing tabs and spaces in `vim`. Configure `~/.vimrc` first!
8. **Ignoring Pod Readiness:** Assuming a pod is working because phase is `Running`, without verifying readiness probes.
9. **Failing to Verify Cluster Status:** Not testing `kubectl get nodes` or `curl` endpoints before moving to the next task.
10. **Panic and Time Freezing:** Spending 25 minutes stuck on a 4% task instead of flagging it.
