# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART III: WORKLOADS AND SCHEDULING
## CHAPTERS 24–29, 31: PODS, DEPLOYMENTS, CONTROLLERS, CONFIG & HEALTH PROBES

---

### CHAPTER 24 & 25: PODS, POD LIFECYCLE & MULTI-CONTAINER PATTERNS

#### 1. Pod Phase Transitions
A Pod's lifecycle is tracked via `status.phase`:
* `Pending`: Pod accepted by the API server, but one or more containers are not yet created (often awaiting scheduling or image download).
* `Running`: Pod bound to a node, all containers created, and at least one container is running or starting.
* `Succeeded`: All containers terminated successfully (exit code 0); cannot restart.
* `Failed`: All containers terminated, with at least one container terminating in failure (non-zero exit code).
* `Unknown`: State cannot be obtained (typically due to network loss between kubelet and API server).

#### 2. Multi-Container Pod Design Patterns
1. **Sidecar Pattern:** Enhances or extends the main container (e.g., streaming logs from an `emptyDir` volume to centralized Elasticsearch or Prometheus metrics exporter).
2. **Ambassador Pattern:** Proxies network traffic from the local pod to the outside world (e.g., connecting to `localhost:6379` while the ambassador routes to a sharded Redis cluster).
3. **Adapter Pattern:** Standardizes output across disparate application formats (e.g., transforming legacy application metric formats into Prometheus exposition format).
4. **Init Containers:** Sequential initialization containers that run to complete exit 0 before application containers start.

---

### CHAPTER 26: DEPLOYMENTS AND REPLICASETS

#### 1. Deployment Strategies: Recreate vs. RollingUpdate
* **Recreate Strategy:** Terminates all existing pods before creating new pods (`spec.strategy.type: Recreate`). Results in downtime but prevents two application versions from executing concurrently.
* **RollingUpdate Strategy:** Gradually replaces old pods with new pods. Governed by:
  * `maxSurge`: Max pods created above desired count (default 25%).
  * `maxUnavailable`: Max pods unavailable during update (default 25%).

#### 2. Declarative Deployment Manifest
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
  labels:
    app: orders
spec:
  replicas: 4
  revisionHistoryLimit: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: orders
  template:
    metadata:
      labels:
        app: orders
    spec:
      containers:
      - name: orders
        image: orders-api:v1.2.0
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 250m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 256Mi
```

---

### CHAPTER 27 & 28: DAEMONSETS, STATEFULSETS, JOBS & CRONJOBS

#### 1. StatefulSet Production Considerations
* Headless Service (`clusterIP: None`) provides stable DNS records: `$(pod-name).$(service-name).$(namespace).svc.cluster.local`.
* `volumeClaimTemplates` dynamically provisions a unique, dedicated PersistentVolumeClaim for each ordinal replica.
* Deleting a StatefulSet *never* deletes its associated PersistentVolumeClaims to protect stateful data from accidental loss.

#### 2. CronJob Concurrency Policies
Governs how new executions behave if the previous scheduled Job has not completed:
* `Allow` (Default): Concurrent jobs run simultaneously.
* `Forbid`: Skips the new execution if the previous run is still active.
* `Replace`: Cancels the currently running job and starts a new one.

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: hourly-aggregation
spec:
  schedule: "0 * * * *"
  concurrencyPolicy: Forbid
  startingDeadlineSeconds: 120
  jobTemplate:
    spec:
      template:
        spec:
          restartPolicy: OnFailure
          containers:
          - name: aggregator
            image: analytics:1.0
```

---

### CHAPTER 29: CONFIGMAPS AND SECRETS

#### 1. Base64 Secret Management
Kubernetes Secrets store sensitive configuration encoded in Base64:
```bash
# Encode secret value
echo -n "P@ssw0rd123" | base64

# Decode secret value
echo -n "UEBzc3cwcmQxMjM=" | base64 --decode
```

#### 2. Projecting ConfigMaps and Secrets as Volume Mounts
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  volumes:
  - name: config-vol
    configMap:
      name: app-config
  - name: secret-vol
    secret:
      secretName: db-secret
  containers:
  - name: app
    image: nginx:alpine
    volumeMounts:
    - name: config-vol
      mountPath: /etc/config
      readOnly: true
    - name: secret-vol
      mountPath: /etc/secrets
      readOnly: true
```

---

### CHAPTER 31: LIVENESS, READINESS AND STARTUP PROBES

```yaml
spec:
  containers:
  - name: web
    image: web-service:2.0
    # 1. Startup Probe: Allows slow apps up to 300s to boot without premature kills
    startupProbe:
      httpGet:
        path: /healthz
        port: 8080
      failureThreshold: 30
      periodSeconds: 10
    # 2. Liveness Probe: Detects runtime deadlocks; restarts container on failure
    livenessProbe:
      httpGet:
        path: /healthz
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 20
      failureThreshold: 3
    # 3. Readiness Probe: Controls traffic routing; isolates pod from endpoints on failure
    readinessProbe:
      httpGet:
        path: /ready
        port: 8080
      periodSeconds: 5
      failureThreshold: 2
```
