# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART III: WORKLOADS AND SCHEDULING
## CHAPTERS 30, 32–38: SCHEDULING, AFFINITY, TAINTS, AUTOSCALING & QUOTAS

---

### CHAPTER 30: RESOURCE REQUESTS, LIMITS & KERNEL CFS QUOTAS

#### 1. Compute Units in Kubernetes
* **CPU:** Specified in millicores ($1000\text{m} = 1\text{ vCPU / core}$). It is a compressible resource: exceeding limits results in CPU cycle throttling via Linux CFS, not termination.
* **Memory:** Specified in bytes with binary SI suffixes (`128Mi`, `1Gi`). It is an incompressible resource: exceeding limits results in an instant kernel `OOMKilled` (Exit Code 137).

#### 2. Quality of Service (QoS) Classes
Kubernetes assigns each Pod a QoS class based on its request/limit declarations:
1. **Guaranteed (Highest Priority):** Every container specifies CPU and Memory requests and limits, and requests strictly equal limits. Safest against eviction.
2. **Burstable (Medium Priority):** At least one container specifies requests or limits, and requests are less than limits.
3. **BestEffort (Lowest Priority):** No container specifies any requests or limits. These pods are killed first when node memory pressure occurs.

---

### CHAPTER 32–35: ADVANCED SCHEDULING MECHANISMS

#### 1. NodeSelector vs. NodeAffinity
* `nodeSelector`: Simple key-value label equality (`disk: ssd`).
* `nodeAffinity`: Expressive rule syntax using operators (`In`, `NotIn`, `Exists`, `DoesNotExist`, `Gt`, `Lt`):
  * `requiredDuringSchedulingIgnoredDuringExecution`: Hard filtering predicate.
  * `preferredDuringSchedulingIgnoredDuringExecution`: Soft scoring priority.

```yaml
spec:
  affinity:
    nodeAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
        nodeSelectorTerms:
        - matchExpressions:
          - key: topology.kubernetes.io/zone
            operator: In
            values: ["us-east-1a", "us-east-1b"]
      preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 80
        preference:
          matchExpressions:
          - key: instance-type
            operator: In
            values: ["compute-optimized"]
```

#### 2. Taints and Tolerations
* **Taints** repel pods from nodes:
  ```bash
  kubectl taint nodes worker-01 dedicated=special:NoSchedule
  ```
  Taint Effects:
  * `NoSchedule`: New pods without matching toleration are not placed on the node. Existing pods remain.
  * `PreferNoSchedule`: Soft preference; scheduler tries to avoid placing pods without toleration.
  * `NoExecute`: Pods without matching toleration are immediately evicted from the node.
* **Tolerations** allow pods to be scheduled on tainted nodes:
  ```yaml
  spec:
    tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "special"
      effect: "NoSchedule"
  ```

#### 3. Pod Affinity and Anti-Affinity
Co-locates or isolates pods relative to other pods within a topological domain:
```yaml
spec:
  affinity:
    podAntiAffinity:
      requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
          - key: app
            operator: In
            values: ["web-frontend"]
        topologyKey: "kubernetes.io/hostname"
```
*Effect:* Guarantees that two `web-frontend` replicas will never be scheduled on the same physical host.

---

### CHAPTER 36: PRIORITYCLASSES AND PREEMPTION

```yaml
apiVersion: scheduling.k8s.io/v1
kind: PriorityClass
metadata:
  name: high-priority-apps
value: 1000000
globalDefault: false
description: "Mission-critical applications that pre-empt batch workloads."
```
When node capacity is exhausted, the scheduler identifies lower-priority pods, issues eviction requests, and schedules the `high-priority-apps` pod onto the reclaimed capacity.

---

### CHAPTER 37: HORIZONTAL POD AUTOSCALER (HPA)

Autoscales workload replicas based on observed CPU/Memory utilization reported by `metrics-server`:

```bash
# Imperative HPA creation
kubectl autoscale deployment order-service --cpu-percent=75 --min=2 --max=10
```

**Declarative HPA Manifest (autoscaling/v2):**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: order-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: order-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 75
```

---

### CHAPTER 38: RESOURCEQUOTAS AND LIMITRANGES

#### 1. LimitRange (Container-Level Bounds)
```yaml
apiVersion: v1
kind: LimitRange
metadata:
  name: mem-limit-range
  namespace: development
spec:
  limits:
  - default:
      memory: 512Mi
      cpu: 500m
    defaultRequest:
      memory: 256Mi
      cpu: 250m
    max:
      memory: 1Gi
      cpu: 1000m
    min:
      memory: 128Mi
      cpu: 100m
    type: Container
```

#### 2. ResourceQuota (Namespace Aggregate Limit)
```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: development
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    pods: "10"
```
