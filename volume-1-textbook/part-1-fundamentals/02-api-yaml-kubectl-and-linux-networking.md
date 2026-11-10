# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART I: KUBERNETES FUNDAMENTALS
## CHAPTERS 5–8: API PRIMITIVES, DECLARATIVE YAML, KUBECTL & LINUX NETWORKING

---

### CHAPTER 5: KUBERNETES API SERVER AND API OBJECTS

#### 1. Learning Objectives
* Understand how API resources are grouped, versioned, and addressed.
* Trace the HTTP REST request pipeline from client to etcd.
* Differentiate between core API groups (`/api/v1`) and named groups (`/apis/<group>/<version>`).

#### 2. API Groups and Versioning Architecture
The Kubernetes API is organized hierarchically into:
1. **Core Group (Legacy):** Located at `/api/v1`. Houses original primitives: `Pod`, `Service`, `Namespace`, `ConfigMap`, `Secret`, `Node`, `PersistentVolume`.
2. **Named Groups:** Located at `/apis/<group>/<version>`. Examples:
   * `apps/v1`: Deployments, ReplicaSets, StatefulSets, DaemonSets.
   * `batch/v1`: Jobs, CronJobs.
   * `networking.k8s.io/v1`: Ingress, NetworkPolicy.
   * `storage.k8s.io/v1`: StorageClass, VolumeAttachment.
   * `rbac.authorization.k8s.io/v1`: Role, ClusterRole, RoleBinding.
   * `gateway.networking.k8s.io/v1`: Gateway, HTTPRoute.

#### 3. API Version Lifecycles
* `v1alpha1`: Experimental; subject to breaking changes or removal without notice.
* `v1beta1`: Well-tested; enabled by default; deprecated prior to GA.
* `v1` (GA / Stable): Fully supported across minor versions with strict backward compatibility.

---

### CHAPTER 6: DECLARATIVE CONFIGURATION AND YAML

#### 1. The Anatomy of a Kubernetes Manifest
Every Kubernetes resource requires four top-level fields:
```yaml
apiVersion: apps/v1        # 1. API Group and Version
kind: Deployment           # 2. Resource Kind
metadata:                  # 3. Object Identification
  name: payment-processor
  namespace: finance
  labels:
    app: payment
spec:                      # 4. Desired State Specification
  replicas: 3
  selector:
    matchLabels:
      app: payment
  template:
    metadata:
      labels:
        app: payment
    spec:
      containers:
      - name: processor
        image: payment-app:v2.1
        ports:
        - containerPort: 8080
```

#### 2. Imperative vs. Declarative Management
* **Imperative Commands:** `kubectl create deployment ...`, `kubectl scale ...`. Excellent for speed during the exam to generate initial manifests.
* **Declarative Management:** `kubectl apply -f manifest.yaml`. Computes a 3-way diff between the local file, the live etcd record, and the `kubectl.kubernetes.io/last-applied-configuration` annotation.

---

### CHAPTER 7: KUBECTL ADMINISTRATION AND EXAM PRODUCTIVITY

#### 1. Essential Imperative Generators
Never write YAML from scratch in the CKA exam. Use these standard generators:

```bash
# Generate Pod YAML
kubectl run nginx-pod --image=nginx:alpine --port=80 --dry-run=client -o yaml > pod.yaml

# Generate Deployment YAML
kubectl create deployment web-app --image=nginx:alpine --replicas=3 --dry-run=client -o yaml > deploy.yaml

# Generate Service YAML (ClusterIP)
kubectl expose deployment web-app --port=80 --target-port=80 --dry-run=client -o yaml > svc.yaml

# Generate Job YAML
kubectl create job batch-calc --image=busybox --dry-run=client -o yaml -- sh -c "expr 5 + 5" > job.yaml

# Generate Namespace
kubectl create namespace staging --dry-run=client -o yaml > ns.yaml
```

#### 2. Advanced JSONPath Extraction
Extract nested values directly from API server outputs:

```bash
# Get all Pod IPs in default namespace
kubectl get pods -o jsonpath='{.items[*].status.podIP}'

# Get all Node names and their Internal IPs
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.addresses[?(@.type=="InternalIP")].address}{"\n"}{end}'

# Find container images used in all deployments
kubectl get deployments -A -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.template.spec.containers[*].image}{"\n"}{end}'
```

---

### CHAPTER 8: LINUX AND NETWORKING FOUNDATIONS FOR KUBERNETES

#### 1. The Fundamental Kubernetes Network Model
Kubernetes imposes four non-negotiable networking requirements:
1. Every Pod gets its own unique IP address.
2. Pods on any node can communicate with all pods on any other node without NAT.
3. Agents on a node (kubelet) can communicate with all pods on that same node.
4. Pods in the host network of a node can communicate with all pods on all nodes without NAT.

#### 2. Virtual Ethernet Pairs (veth) and Network Namespaces
When a Pod is scheduled:
1. The container runtime creates an isolated Linux network namespace (`netns`).
2. A virtual ethernet pair (`veth` pair) is created in the kernel. One end (`eth0`) is moved into the Pod's network namespace, and the peer end (`vethXXXX`) is plugged into the node's local bridge (e.g., `cbr0`).
3. An IP address is allocated from the node's `podCIDR` allocation by the CNI IPAM plugin.

```
┌─────────────────────────────────┐
│     POD NETWORK NAMESPACE       │
│  eth0 (10.244.1.5/24)           │
└───────────────▲─────────────────┘
                │
         veth pair tunnel
                │
┌───────────────▼─────────────────┐
│      NODE ROOT NAMESPACE        │
│  veth1234 ───> [ CNI Bridge ]   │
│                 cbr0 / flannel  │
│                      │          │
│  eth0 (192.168.1.10) ┴──────────│
└─────────────────────────────────┘
```

#### 3. Linux Kernel Diagnostics Runbook
```bash
# Check network namespace links
ip netns list

# Inspect Linux bridges and interfaces
ip link show
ip addr show

# Check host routing table
ip route show

# Verify socket listening ports
ss -tulpen
```

---

### PRACTICE EXERCISES & CKA CHALLENGE (CHAPTERS 5–8)

#### Challenge: Multi-Container Pod with Declarative YAML
**Task:**
Create a Pod named `log-processor` in namespace `observability`:
1. Main container `app` running `busybox:1.36` writing timestamped logs every 5 seconds to `/var/log/app.log`.
2. Sidecar container `logger` running `busybox:1.36` reading and streaming `/var/log/app.log` to standard output.
3. Both containers share a volume named `shared-logs` of type `emptyDir`.

#### Solution Manifest:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: observability
---
apiVersion: v1
kind: Pod
metadata:
  name: log-processor
  namespace: observability
spec:
  volumes:
  - name: shared-logs
    emptyDir: {}
  containers:
  - name: app
    image: busybox:1.36
    command: ["/bin/sh", "-c"]
    args:
    - >
      while true; do
        echo "$(date) - Application event processing" >> /var/log/app.log;
        sleep 5;
      done
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
  - name: logger
    image: busybox:1.36
    command: ["/bin/sh", "-c"]
    args: ["tail -n+1 -f /var/log/app.log"]
    volumeMounts:
    - name: shared-logs
      mountPath: /var/log
```

#### Verification:
```bash
kubectl apply -f solution.yaml
kubectl logs -n observability log-processor -c logger
```
Expected output: Continuous stream of timestamped log entries originating from the `app` container.
