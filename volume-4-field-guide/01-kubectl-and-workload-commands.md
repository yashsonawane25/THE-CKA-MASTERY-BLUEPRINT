# VOLUME IV: THE CKA COMMAND AND TROUBLESHOOTING FIELD GUIDE
## PART 1: KUBECTL ADMINISTRATION, JSONPATH & WORKLOAD COMMANDS

---

## 1. ESSENTIAL SHELL ALIASES AND SPEED BOILERPLATE

To pass the CKA exam within the 120-minute limit, configure these shell aliases immediately upon opening the remote desktop terminal:

```bash
# 1. Instant Command Aliases
alias k=kubectl
alias kgp="kubectl get pods -o wide"
alias kgs="kubectl get svc -o wide"
alias kgn="kubectl get nodes -o wide"
alias kd="kubectl describe"

# 2. Bash Autocompletion for 'k'
source <(kubectl completion bash)
complete -o default -F __start_kubectl k

# 3. Imperative Generation Fast Variables
export do="--dry-run=client -o yaml"
export now="--force --grace-period=0"

# 4. Vim Configuration for Flawless YAML Editing
cat <<EOF > ~/.vimrc
set tabstop=2
set shiftwidth=2
set expandtab
set autoindent
set number
EOF
```

---

## 2. KUBECTL WORKLOAD COMMAND REFERENCE

---

### Command: Imperative Pod Generation
- **Syntax:** `kubectl run <pod-name> --image=<image> [--port=<port>] [--env="KEY=VAL"] [--labels="k=v"] [--dry-run=client -o yaml]`
- **Purpose:** Generates a standalone Pod manifest without authoring YAML manually.
- **Example:**
  ```bash
  kubectl run redis-cache --image=redis:7.2-alpine --port=6379 --env="ALLOW_EMPTY_PASSWORD=yes" $do > redis.yaml
  ```
- **Flag Explanation:**
  - `--image`: Container image to pull from registry.
  - `--port`: Container port declaration (`containerPort: 6379`).
  - `--env`: Key-value environment variables injected into the container.
  - `--dry-run=client -o yaml`: Evaluates client-side syntax and prints raw YAML to stdout without sending requests to the API server.
- **Expected Output:**
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    labels:
      run: redis-cache
    name: redis-cache
  spec:
    containers:
    - env:
      - name: ALLOW_EMPTY_PASSWORD
        value: "yes"
      image: redis:7.2-alpine
      name: redis-cache
      ports:
      - containerPort: 6379
  ```
- **Common Errors:** Forgetting `$do` (`--dry-run=client -o yaml`) and accidentally deploying the pod to the live cluster immediately.
- **Safety Warning:** Pods created directly via `kubectl run` are unmanaged; they lack self-healing or auto-recreation if the worker node crashes.

---

### Command: Imperative Deployment Creation & Scaling
- **Syntax:** `kubectl create deployment <name> --image=<image> [--replicas=<count>] [--port=<port>]`
- **Purpose:** Creates a self-healing Deployment managing a ReplicaSet.
- **Example:**
  ```bash
  kubectl create deployment web-frontend --image=nginx:1.27-alpine --replicas=3 --port=80 $do > deploy.yaml
  kubectl apply -f deploy.yaml
  ```
- **Scaling Example:**
  ```bash
  kubectl scale deployment web-frontend --replicas=5
  ```
- **Expected Output:**
  `deployment.apps/web-frontend created`
  `deployment.apps/web-frontend scaled`
- **Common Errors:** Attempting to specify pod resource requests/limits directly on the CLI; resource constraints must be edited inside the generated YAML.

---

### Command: Rolling Update & Revision Recording (Modern Replacement for Removed `--record`)
- **Syntax:**
  ```bash
  kubectl set image deployment/<name> <container-name>=<new-image>
  kubectl annotate deployment/<name> kubernetes.io/change-cause="<description>" --overwrite
  ```
- **Purpose:** Performs a zero-downtime rolling update and records the reason in the rollout revision history.
- **Example:**
  ```bash
  # Step 1: Update container image in-place
  kubectl set image deployment/web-frontend nginx=nginx:1.27.2-alpine

  # Step 2: Record change cause using official Kubernetes annotation
  kubectl annotate deployment/web-frontend kubernetes.io/change-cause="Upgraded nginx to 1.27.2-alpine" --overwrite

  # Step 3: Monitor rollout progress
  kubectl rollout status deployment/web-frontend

  # Step 4: Inspect rollout history
  kubectl rollout history deployment/web-frontend
  ```
- **CRITICAL NOTE ON REMOVED `--record` FLAG:**  
  > [!IMPORTANT]
  > The `--record` flag was deprecated in Kubernetes v1.19 and **permanently removed** in modern kubectl releases (`v1.26+`). Running `kubectl set image ... --record` produces warnings/errors and will not populate the change-cause field. The official, supported standard is annotating the Deployment with `kubernetes.io/change-cause="..."`.
- **Expected Output:**
  ```text
  deployment.apps/web-frontend image updated
  deployment.apps/web-frontend annotated
  Waiting for deployment "web-frontend" rollout to finish: 1 out of 5 new replicas have been updated...
  deployment "web-frontend" successfully rolled out
  REVISION  CHANGE-CAUSE
  1         Initial deployment
  2         Upgraded nginx to 1.27.2-alpine
  ```

---

### Command: Instant Deployment Rollback
- **Syntax:** `kubectl rollout undo deployment/<name> [--to-revision=<rev>]`
- **Purpose:** Immediately reverts a failing rollout to the previous revision or a specific revision number.
- **Example:**
  ```bash
  # Rollback to immediate previous revision
  kubectl rollout undo deployment/web-frontend

  # Rollback to specific stable revision
  kubectl rollout undo deployment/web-frontend --to-revision=1
  ```
- **Expected Output:** `deployment.apps/web-frontend rolled back`

---

### Command: Job and CronJob Generation
- **Syntax:**
  - Job: `kubectl create job <name> --image=<image> [--dry-run=client -o yaml] -- <command>`
  - CronJob: `kubectl create cronjob <name> --image=<image> --schedule="<cron>" [--dry-run=client -o yaml] -- <command>`
- **Example:**
  ```bash
  # Batch Job
  kubectl create job db-backup --image=busybox:1.36 $do -- sh -c "echo 'Backup completed' && exit 0" > job.yaml

  # Scheduled CronJob (Runs every 15 minutes)
  kubectl create cronjob sync-task --image=curlimages/curl:8.10.1 --schedule="*/15 * * * *" $do -- curl -s https://api.internal/sync > cronjob.yaml
  ```
- **Common Errors:** CronJobs require the 5-field standard cron syntax (`minute hour day-of-month month day-of-week`). Forgetting quotes around `--schedule="* * * * *"` causes bash expansion syntax errors.

---

### Command: ConfigMap and Secret Generation
- **Syntax:**
  - ConfigMap from literal: `kubectl create configmap <name> --from-literal=<key>=<val>`
  - ConfigMap from file: `kubectl create configmap <name> --from-file=<path>`
  - Generic Secret: `kubectl create secret generic <name> --from-literal=<key>=<val>`
  - TLS Secret: `kubectl create secret tls <name> --cert=<cert.crt> --key=<key.key>`
  - Docker Registry Secret: `kubectl create secret docker-registry <name> --docker-server=<server> --docker-username=<u> --docker-password=<p>`
- **Examples:**
  ```bash
  kubectl create configmap app-settings --from-literal=ENVIRONMENT=production --from-literal=DB_PORT=5432
  kubectl create secret generic app-credentials --from-literal=DB_PASS="s3cur3P@ssw0rd!"
  kubectl create secret tls ingress-tls --cert=/etc/ssl/tls.crt --key=/etc/ssl/tls.key
  ```
- **Safety Warning:** Values stored in standard Kubernetes Secrets are merely Base64-encoded, not encrypted at rest by default unless KMS / encryption-provider is enabled on `kube-apiserver`.

---

## 3. NETWORKING, SERVICES & GATEWAY API COMMANDS

---

### Command: Exposing Workloads via Service
- **Syntax:** `kubectl expose (deployment|pod) <name> --port=<svc-port> [--target-port=<pod-port>] [--type=(ClusterIP|NodePort|LoadBalancer)]`
- **Purpose:** Automatically generates a Service that inherits the target deployment's exact label selector.
- **Example:**
  ```bash
  # Expose as internal ClusterIP
  kubectl expose deployment web-frontend --port=80 --target-port=8080 --name=web-svc

  # Expose as external NodePort
  kubectl expose deployment web-frontend --type=NodePort --port=80 --target-port=8080 --name=web-np
  ```
- **Verification:**
  ```bash
  kubectl get svc web-svc -o wide
  kubectl get endpointslices -l kubernetes.io/service-name=web-svc
  ```

---

### Command: Inspecting Gateway API Resources
- **Syntax:**
  ```bash
  kubectl get gatewayclasses
  kubectl get gateways -A
  kubectl get httproutes -A
  kubectl describe httproute <route-name>
  ```
- **Purpose:** Queries modern Gateway API infrastructure and identifies routing acceptance status.
- **Example:**
  ```bash
  kubectl describe httproute payments-route
  ```
- **Expected Output:**
  ```text
  Status:
    Parents:
      Conditions:
        Last Transition Time:  2026-11-09T18:00:00Z
        Message:               Route was accepted
        Reason:                Accepted
        Status:                True
        Type:                  Accepted
        Status:                True
        Type:                  ResolvedRefs
      Controller Name:         gateway.networking.k8s.io/gateway-controller
      Parent Ref:
        Group:  gateway.networking.k8s.io
        Kind:   Gateway
        Name:   prod-gateway
  ```

---

## 4. ADVANCED JSONPATH, SORTING & CUSTOM COLUMNS

---

### Filter: List Pods Sorted by Creation Timestamp
```bash
kubectl get pods -A --sort-by=.metadata.creationTimestamp
```
*Purpose:* Immediately displays the most recently created or restarted pods across all namespaces.

---

### Filter: Extract Node Internal IP Addresses
```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .status.addresses[?(@.type=="InternalIP")]}{.address}{"\n"}{end}{end}'
```
*Purpose:* Cleanly outputs node hostnames paired with their physical internal IP addresses for cluster-level SSH operations.

---

### Filter: Extract All Pod Names Running on a Specific Node
```bash
kubectl get pods -A --field-selector spec.nodeName=worker-01 -o jsonpath='{.items[*].metadata.name}'
```
*Purpose:* Finds every pod placed on an affected worker node prior to draining or troubleshooting.

---

### Filter: List Container Images across All Deployments
```bash
kubectl get deployments -A -o custom-columns=NAMESPACE:.metadata.namespace,DEPLOYMENT:.metadata.name,IMAGE:.spec.template.spec.containers[*].image
```
*Purpose:* Verifies container image tags across all production deployments in a formatted table.

---

### Filter: Extract Non-Ready Nodes
```bash
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .status.conditions[?(@.type=="Ready")]}{.status}{"\n"}{end}{end}' | grep -v "True"
```
*Purpose:* Instant programmatic filter isolating nodes in `NotReady` or `Unknown` condition.

---

## 5. RBAC & PERMISSION AUDITING COMMANDS

---

### Command: Permission Checking (`auth can-i`)
- **Syntax:** `kubectl auth can-i <verb> <resource> [--as=<user>] [--as-group=<group>] [-n <namespace>]`
- **Purpose:** Verifies RBAC authorization without requiring context switching or certificates.
- **Examples:**
  ```bash
  # Can current user delete pods in production?
  kubectl auth can-i delete pods -n production

  # Can ServiceAccount 'deployer' in namespace 'cicd' create deployments in 'default'?
  kubectl auth can-i create deployments --as=system:serviceaccount:cicd:deployer -n default

  # Can developer user 'jane' view secrets in any namespace?
  kubectl auth can-i get secrets -A --as=jane
  ```
- **Expected Output:** `yes` or `no`

---

### Command: Imperative Role & RoleBinding Creation
```bash
# 1. Create a Role with specific verbs and resources
kubectl create role pod-admin --verb=get,list,watch,create,delete --resource=pods,pods/log -n staging

# 2. Bind the Role to a User
kubectl create rolebinding pod-admin-binding --role=pod-admin --user=jane -n staging

# 3. Create a ClusterRole across all namespaces
kubectl create clusterrole node-reader --verb=get,list,watch --resource=nodes

# 4. Bind ClusterRole to a ServiceAccount
kubectl create clusterrolebinding node-reader-binding --clusterrole=node-reader --serviceaccount=kube-system:monitor-sa
```
