# VOLUME II: THE CKA PRACTICAL WORKBOOK
# DOMAIN 2: WORKLOADS & SCHEDULING (LABS 16–30)

---

## LAB 16: Zero-Downtime Deployment Rolling Updates and Revisions
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Orchestrate an application rolling update, inspect rollout history, and execute a surgical rollback to a specific historical revision.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** Clean namespace `web-workloads`.
- **Task Description:**
  1. Create namespace `web-workloads`.
  2. Deploy `nginx-deployment` with 3 replicas running image `nginx:1.25` in `web-workloads`.
  3. Update image to `nginx:1.26` using `kubectl set image`, recording the rollout command.
  4. Update image to a non-existent tag `nginx:1.999-broken` to simulate a broken release.
  5. Check rollout status and observe the failure.
  6. Inspect revision history and roll back to the stable revision running `nginx:1.26`.
- **Constraints:** Keep at least 2 replicas available at all times during rollout.
- **Hints:** Use `kubectl rollout history` and `kubectl rollout undo --to-revision=<N>`.
- **Expected Result:** Deployment stabilizes at 3 replicas running `nginx:1.26`.
- **Verification:**
  ```bash
  kubectl get deployment nginx-deployment -n web-workloads -o jsonpath='{.spec.template.spec.containers[0].image}'
  # Expected: nginx:1.26
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace web-workloads
  kubectl create deployment nginx-deployment --image=nginx:1.25 --replicas=3 -n web-workloads
  kubectl set image deployment/nginx-deployment nginx=nginx:1.26 -n web-workloads
  kubectl rollout status deployment/nginx-deployment -n web-workloads
  kubectl set image deployment/nginx-deployment nginx=nginx:1.999-broken -n web-workloads
  # Observe failure
  kubectl rollout undo deployment/nginx-deployment --to-revision=2 -n web-workloads
  ```
- **Common Mistakes:** Rolling back without checking revision numbers, reverting to the wrong version.
- **Troubleshooting:** Run `kubectl describe deployment nginx-deployment -n web-workloads` to view condition progress.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace web-workloads
  ```

---

## LAB 17: StatefulSet Deployment with Sequential Pod Management
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Deploy a StatefulSet paired with a headless Service and observe ordered creation and stable network hostnames.
- **Prerequisites:** Cluster with default StorageClass.
- **Cluster Environment:** Any Kubernetes cluster.
- **Initial State:** Namespace `stateful-apps`.
- **Task Description:**
  1. Create namespace `stateful-apps`.
  2. Create a headless Service `db-cluster-svc` with `clusterIP: None` exposing port 27017 for selector `app: mongo`.
  3. Create a StatefulSet `mongo` with 3 replicas, serviceName `db-cluster-svc`, and image `mongo:6.0`.
  4. Verify pods launch sequentially: `mongo-0`, then `mongo-1`, then `mongo-2`.
  5. Scale the StatefulSet to 4 replicas and verify ordered scale-up.
- **Constraints:** Must use headless Service for network identity.
- **Hints:** In a StatefulSet, `mongo-1` will not start until `mongo-0` is in `Running` and ready.
- **Expected Result:** 4 sequential pods running with predictable names.
- **Verification:**
  ```bash
  kubectl get pods -n stateful-apps -l app=mongo
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: stateful-apps
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: db-cluster-svc
    namespace: stateful-apps
  spec:
    clusterIP: None
    selector:
      app: mongo
    ports:
    - port: 27017
      name: mongo
  ---
  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: mongo
    namespace: stateful-apps
  spec:
    serviceName: db-cluster-svc
    replicas: 3
    selector:
      matchLabels:
        app: mongo
    template:
      metadata:
        labels:
          app: mongo
      spec:
        containers:
        - name: mongo
          image: mongo:6.0
          ports:
          - containerPort: 27017
  ```
  ```bash
  kubectl apply -f statefulset.yaml
  kubectl scale statefulset mongo --replicas=4 -n stateful-apps
  ```
- **Common Mistakes:** Omitting `serviceName` in the StatefulSet spec.
- **Troubleshooting:** If pods do not advance to the next index, inspect the previous pod's readiness probe.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace stateful-apps
  ```

---

## LAB 18: DaemonSet Node Coverage and Host Resource Access
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Deploy a DaemonSet targeting all worker nodes while tolerating control plane taints to collect host system metrics.
- **Prerequisites:** Multi-node cluster with tainted control plane.
- **Cluster Environment:** `kubeadm` or multi-node `kind`.
- **Initial State:** Namespace `monitoring`.
- **Task Description:**
  1. Create namespace `monitoring`.
  2. Create a DaemonSet named `host-monitor` in namespace `monitoring`.
  3. Run container image `busybox:1.36` executing `sleep 86400`.
  4. Add a toleration so the DaemonSet pod also schedules on the control plane node: `key: node-role.kubernetes.io/control-plane, effect: NoSchedule`.
  5. Verify that the number of running pods exactly matches the total node count (workers + control plane).
- **Constraints:** Must use DaemonSet, not Deployment.
- **Hints:** Check node count with `kubectl get nodes --no-headers | wc -l`.
- **Expected Result:** Exactly 1 pod runs on every node in the cluster.
- **Verification:**
  ```bash
  kubectl get ds host-monitor -n monitoring
  # Desired should equal Current and Ready
  ```
- **Full Solution:**
  ```yaml
  apiVersion: apps/v1
  kind: DaemonSet
  metadata:
    name: host-monitor
    namespace: monitoring
  spec:
    selector:
      matchLabels:
        app: host-monitor
    template:
      metadata:
        labels:
          app: host-monitor
      spec:
        tolerations:
        - key: node-role.kubernetes.io/control-plane
          operator: Exists
          effect: NoSchedule
        containers:
        - name: monitor
          image: busybox:1.36
          command: ["sleep", "86400"]
  ```
  ```bash
  kubectl create namespace monitoring
  kubectl apply -f daemonset.yaml
  ```
- **Common Mistakes:** Omitting the control plane toleration, resulting in pods only scheduling on worker nodes.
- **Troubleshooting:** Run `kubectl get pods -n monitoring -o wide` to verify each node holds one pod.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace monitoring
  ```

---

## LAB 19: Batch Jobs with Parallelism and Completion Quotas
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Configure a Kubernetes Job that requires 6 total completions with up to 2 pods running concurrently.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `batch-jobs`.
- **Task Description:**
  1. Create namespace `batch-jobs`.
  2. Create a Job named `data-processor` in namespace `batch-jobs`.
  3. Image: `busybox:1.36`. Command: `sh -c "echo processing partition; sleep 3"`.
  4. Set `completions: 6` and `parallelism: 2`.
  5. Set `backoffLimit: 3`.
  6. Monitor the Job until status reaches `Completed`.
- **Constraints:** Ensure `restartPolicy: OnFailure` or `Never`.
- **Hints:** Use `kubectl create job data-processor --image=busybox:1.36 --dry-run=client -o yaml` and edit `completions` and `parallelism`.
- **Expected Result:** Job finishes with `6/6` completions.
- **Verification:**
  ```bash
  kubectl get job data-processor -n batch-jobs
  # COMPLETIONS: 6/6
  ```
- **Full Solution:**
  ```yaml
  apiVersion: batch/v1
  kind: Job
  metadata:
    name: data-processor
    namespace: batch-jobs
  spec:
    completions: 6
    parallelism: 2
    backoffLimit: 3
    template:
      spec:
        restartPolicy: OnFailure
        containers:
        - name: processor
          image: busybox:1.36
          command: ["/bin/sh", "-c", "echo processing partition; sleep 3"]
  ```
  ```bash
  kubectl create namespace batch-jobs
  kubectl apply -f job.yaml
  kubectl get jobs -n batch-jobs -w
  ```
- **Common Mistakes:** Setting `restartPolicy: Always`, which is illegal in Job Pod templates.
- **Troubleshooting:** Run `kubectl describe job data-processor -n batch-jobs` to view active pods and completion timestamps.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace batch-jobs
  ```

---

## LAB 20: CronJob with Concurrency Policies
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Schedule a recurring task using CronJob and enforce `concurrencyPolicy: Forbid` to prevent overlapping runs.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `cron-jobs`.
- **Task Description:**
  1. Create namespace `cron-jobs`.
  2. Create a CronJob `log-cleaner` running every minute (`* * * * *`).
  3. Image: `busybox:1.36`. Command: `sh -c "echo Cleaning logs; sleep 70"`.
  4. Set `concurrencyPolicy: Forbid`.
  5. Set `successfulJobsHistoryLimit: 2` and `failedJobsHistoryLimit: 1`.
  6. Observe that because the job sleeps for 70 seconds, the 1-minute schedule skips the second iteration rather than running concurrent pods.
- **Constraints:** Must use `batch/v1`.
- **Hints:** `concurrencyPolicy` options are `Allow`, `Forbid`, and `Replace`.
- **Expected Result:** At most 1 pod executes at any single time.
- **Verification:**
  ```bash
  kubectl get cronjob log-cleaner -n cron-jobs
  kubectl get pods -n cron-jobs
  ```
- **Full Solution:**
  ```yaml
  apiVersion: batch/v1
  kind: CronJob
  metadata:
    name: log-cleaner
    namespace: cron-jobs
  spec:
    schedule: "* * * * *"
    concurrencyPolicy: Forbid
    successfulJobsHistoryLimit: 2
    failedJobsHistoryLimit: 1
    jobTemplate:
      spec:
        template:
          spec:
            restartPolicy: OnFailure
            containers:
            - name: cleaner
              image: busybox:1.36
              command: ["/bin/sh", "-c", "echo Cleaning logs; sleep 70"]
  ```
  ```bash
  kubectl create namespace cron-jobs
  kubectl apply -f cronjob.yaml
  ```
- **Common Mistakes:** Using deprecated `batch/v1beta1` API group.
- **Troubleshooting:** Inspect events with `kubectl describe cronjob log-cleaner -n cron-jobs`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace cron-jobs
  ```

---

## LAB 21: Native Sidecar Containers with `restartPolicy: Always`
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Implement Kubernetes v1.29+ native sidecar containers in `initContainers` with `restartPolicy: Always`.
- **Prerequisites:** Kubernetes v1.29+ cluster.
- **Cluster Environment:** Modern cluster.
- **Initial State:** Namespace `sidecar-demo`.
- **Task Description:**
  1. Create namespace `sidecar-demo`.
  2. Author a Pod `secure-app` with:
     - An initContainer `auth-proxy` running `busybox:1.36` with `command: ["sleep", "3600"]` and `restartPolicy: Always`.
     - A main application container `web` running `nginx:1.27`.
  3. Verify that `auth-proxy` starts first, remains running, and does not block `web` from starting.
  4. Verify that `kubectl get pod secure-app` shows `2/2` containers running.
- **Constraints:** Must use native sidecar syntax in `initContainers`.
- **Hints:** Native sidecars are defined inside `spec.initContainers` with `restartPolicy: Always`.
- **Expected Result:** Pod shows `READY: 2/2` and `STATUS: Running`.
- **Verification:**
  ```bash
  kubectl get pod secure-app -n sidecar-demo
  # Expected: READY: 2/2
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: secure-app
    namespace: sidecar-demo
  spec:
    initContainers:
    - name: auth-proxy
      image: busybox:1.36
      command: ["sleep", "3600"]
      restartPolicy: Always
    containers:
    - name: web
      image: nginx:1.27
  ```
  ```bash
  kubectl create namespace sidecar-demo
  kubectl apply -f sidecar-pod.yaml
  ```
- **Common Mistakes:** Placing `restartPolicy: Always` on a standard initContainer in older clusters (<v1.28) without the SidecarContainers feature gate.
- **Troubleshooting:** Run `kubectl describe pod secure-app -n sidecar-demo` to inspect initialization sequence.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace sidecar-demo
  ```

---

## LAB 22: ConfigMap Volume Mounts with Automatic SubPath Updates
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Mount configuration files from a ConfigMap into a running container without overwriting other files in the destination directory.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `config-lab`.
- **Task Description:**
  1. Create namespace `config-lab`.
  2. Create a ConfigMap `custom-nginx-conf` containing key `custom.conf` with text `server_tokens off;`.
  3. Deploy Pod `nginx-secured` running `nginx:1.27`.
  4. Mount `custom.conf` from the ConfigMap into `/etc/nginx/conf.d/custom.conf` using `subPath` so default nginx config files in that directory are preserved.
  5. Verify the file contents inside the container using `kubectl exec`.
- **Constraints:** Do not overwrite `/etc/nginx/conf.d/default.conf`.
- **Hints:** Use `volumeMounts[*].subPath: custom.conf`.
- **Expected Result:** `/etc/nginx/conf.d/` contains both `default.conf` and `custom.conf`.
- **Verification:**
  ```bash
  kubectl exec -it nginx-secured -n config-lab -- ls -la /etc/nginx/conf.d/
  kubectl exec -it nginx-secured -n config-lab -- cat /etc/nginx/conf.d/custom.conf
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace config-lab
  kubectl create configmap custom-nginx-conf --from-literal=custom.conf="server_tokens off;" -n config-lab
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: nginx-secured
    namespace: config-lab
  spec:
    containers:
    - name: nginx
      image: nginx:1.27
      volumeMounts:
      - name: conf-vol
        mountPath: /etc/nginx/conf.d/custom.conf
        subPath: custom.conf
    volumes:
    - name: conf-vol
      configMap:
        name: custom-nginx-conf
  ```
  ```bash
  kubectl apply -f nginx-conf-pod.yaml
  ```
- **Common Mistakes:** Mounting the volume directly at `/etc/nginx/conf.d/` without `subPath`, which wipes out all existing files in that directory.
- **Troubleshooting:** If pod fails to start with `RunContainerError`, check if the ConfigMap key matches `subPath`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace config-lab
  ```

---

## LAB 23: Secret Management and Secure Environment Injection
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Create a generic Kubernetes Secret and inject its keys into an application container as environment variables.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `security-lab`.
- **Task Description:**
  1. Create namespace `security-lab`.
  2. Create a Secret named `database-creds` containing:
     - `DB_USER=app_user`
     - `DB_PASS=SuperSecurePass123!`
  3. Deploy Pod `db-client` running `busybox:1.36` sleeping 3600.
  4. Inject all key-value pairs from `database-creds` as environment variables using `envFrom`.
  5. Verify the environment variables exist inside the container.
- **Constraints:** Do not hardcode secret values into the Pod manifest.
- **Hints:** Use `spec.containers[*].envFrom[*].secretRef`.
- **Expected Result:** `env` inside the pod displays `DB_USER` and `DB_PASS`.
- **Verification:**
  ```bash
  kubectl exec db-client -n security-lab -- env | grep DB_
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace security-lab
  kubectl create secret generic database-creds \
    --from-literal=DB_USER=app_user \
    --from-literal=DB_PASS='SuperSecurePass123!' \
    -n security-lab
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: db-client
    namespace: security-lab
  spec:
    containers:
    - name: client
      image: busybox:1.36
      command: ["sleep", "3600"]
      envFrom:
      - secretRef:
          name: database-creds
  ```
  ```bash
  kubectl apply -f db-client-pod.yaml
  ```
- **Common Mistakes:** Using `env` with single keys when `envFrom` can import all keys in one declaration.
- **Troubleshooting:** Run `kubectl describe pod db-client -n security-lab` if pod fails to launch.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace security-lab
  ```

---

## LAB 24: Pod Quality of Service (QoS) Classes
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Author three separate Pod specifications to explicitly produce the three Kubernetes QoS classes: Guaranteed, Burstable, and BestEffort.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `qos-lab`.
- **Task Description:**
  1. Create namespace `qos-lab`.
  2. Create Pod `pod-guaranteed`: Requests and Limits must be identical for both CPU and Memory (e.g. 100m / 128Mi).
  3. Create Pod `pod-burstable`: Request 100m CPU / 128Mi RAM, Limit 200m CPU / 256Mi RAM.
  4. Create Pod `pod-besteffort`: No requests and no limits defined.
  5. Inspect `status.qosClass` on all three pods.
- **Constraints:** Do not use default namespace LimitRanges that might inject requests.
- **Hints:** Guaranteed requires both CPU and RAM requests to equal limits on every container.
- **Expected Result:** `kubectl get pods` shows `Guaranteed`, `Burstable`, and `BestEffort` respectively.
- **Verification:**
  ```bash
  kubectl get pods -n qos-lab -o custom-columns=NAME:.metadata.name,QOS:.status.qosClass
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace qos-lab
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: pod-guaranteed
    namespace: qos-lab
  spec:
    containers:
    - name: c1
      image: busybox:1.36
      command: ["sleep", "3600"]
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 100m
          memory: 128Mi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: pod-burstable
    namespace: qos-lab
  spec:
    containers:
    - name: c1
      image: busybox:1.36
      command: ["sleep", "3600"]
      resources:
        requests:
          cpu: 100m
          memory: 128Mi
        limits:
          cpu: 200m
          memory: 256Mi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: pod-besteffort
    namespace: qos-lab
  spec:
    containers:
    - name: c1
      image: busybox:1.36
      command: ["sleep", "3600"]
  ```
  ```bash
  kubectl apply -f qos-pods.yaml
  ```
- **Common Mistakes:** Defining requests and limits for CPU but omitting memory limits in the Guaranteed pod.
- **Troubleshooting:** If `status.qosClass` is Burstable when aiming for Guaranteed, verify memory limits are explicitly set.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace qos-lab
  ```

---

## LAB 25: Multi-Tier Health Checking (Startup, Readiness, Liveness)
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Configure a resilient Pod with startup, readiness, and liveness probes to prevent premature restarts and bad traffic routing.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `probe-lab`.
- **Task Description:**
  1. Create namespace `probe-lab`.
  2. Deploy Pod `robust-web` running image `nginx:1.27`.
  3. Add a `startupProbe` checking HTTP path `/` on port 80 with `failureThreshold: 30` and `periodSeconds: 2`.
  4. Add a `readinessProbe` checking HTTP path `/` on port 80 with `initialDelaySeconds: 5` and `periodSeconds: 5`.
  5. Add a `livenessProbe` checking HTTP path `/` on port 80 with `initialDelaySeconds: 10` and `periodSeconds: 15`.
  6. Expose the Pod with a ClusterIP Service and verify the endpoint is populated only after readiness passes.
- **Constraints:** Do not use probe paths that return HTTP 404 or 500.
- **Hints:** Startup probe protects slow apps; liveness probe detects deadlock.
- **Expected Result:** Pod reaches `1/1 Running`, readiness probe succeeds, endpoint exists.
- **Verification:**
  ```bash
  kubectl describe pod robust-web -n probe-lab | grep -i probe
  kubectl get endpoints robust-web-svc -n probe-lab
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: robust-web
    namespace: probe-lab
    labels:
      app: robust-web
  spec:
    containers:
    - name: nginx
      image: nginx:1.27
      ports:
      - containerPort: 80
      startupProbe:
        httpGet:
          path: /
          port: 80
        failureThreshold: 30
        periodSeconds: 2
      readinessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 5
        periodSeconds: 5
      livenessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 10
        periodSeconds: 15
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: robust-web-svc
    namespace: probe-lab
  spec:
    selector:
      app: robust-web
    ports:
    - port: 80
      targetPort: 80
  ```
  ```bash
  kubectl create namespace probe-lab
  kubectl apply -f robust-web.yaml
  ```
- **Common Mistakes:** Setting port number incorrectly or testing a non-existent path like `/healthz` on vanilla NGINX.
- **Troubleshooting:** Run `kubectl describe pod robust-web -n probe-lab` and look for `Probe Failed` events.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace probe-lab
  ```

---

## LAB 26: Node Affinity with Required and Preferred Matching
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Author advanced Node Affinity rules combining hard (`required`) requirements with soft (`preferred`) weighted scoring.
- **Prerequisites:** Multi-node cluster.
- **Cluster Environment:** Multi-worker cluster.
- **Initial State:** Label `worker-1` with `disktype=nvme` and `region=us-central`. Label `worker-2` with `disktype=hdd` and `region=us-central`.
- **Task Description:**
  1. Label worker nodes as described.
  2. Deploy a Pod `analytics-engine` running `alpine` sleeping 3600.
  3. Configure Node Affinity:
     - `requiredDuringSchedulingIgnoredDuringExecution`: Must be in `region=us-central`.
     - `preferredDuringSchedulingIgnoredDuringExecution`: Prefer `disktype=nvme` with weight 100.
  4. Verify the Pod schedules onto `worker-1` due to the preferred score.
- **Constraints:** If `worker-1` is deleted or cordoned, the Pod must still be capable of landing on `worker-2`.
- **Hints:** Use `nodeSelectorTerms` for required and `preferences` for preferred.
- **Expected Result:** Pod lands on `worker-1`.
- **Verification:**
  ```bash
  kubectl get pod analytics-engine -o wide
  # Node should be worker-1
  ```
- **Full Solution:**
  ```bash
  kubectl label nodes worker-1 disktype=nvme region=us-central --overwrite
  kubectl label nodes worker-2 disktype=hdd region=us-central --overwrite
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: analytics-engine
  spec:
    affinity:
      nodeAffinity:
        requiredDuringSchedulingIgnoredDuringExecution:
          nodeSelectorTerms:
          - matchExpressions:
            - key: region
              operator: In
              values:
              - us-central
        preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          preference:
            matchExpressions:
            - key: disktype
              operator: In
              values:
              - nvme
    containers:
    - name: engine
      image: alpine
      command: ["sleep", "3600"]
  ```
  ```bash
  kubectl apply -f affinity-pod.yaml
  ```
- **Common Mistakes:** Misspelling `requiredDuringSchedulingIgnoredDuringExecution`.
- **Troubleshooting:** Run `kubectl describe pod analytics-engine` if scheduling fails.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod analytics-engine
  kubectl label nodes worker-1 disktype- region-
  kubectl label nodes worker-2 disktype- region-
  ```

---

## LAB 27: Taints, Tolerations, and Node Eviction (`NoExecute`)
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Observe the eviction behavior of `NoExecute` taints versus `NoSchedule`, and use `tolerationSeconds` for graceful drain windows.
- **Prerequisites:** Multi-node cluster.
- **Cluster Environment:** Multi-worker cluster.
- **Initial State:** Running Deployment `stateless-app` with 3 replicas on `worker-1`.
- **Task Description:**
  1. Taint `worker-1` with `outage=maintenance:NoExecute`.
  2. Observe that all non-tolerating pods on `worker-1` are immediately evicted and recreated on other nodes.
  3. Deploy a Pod `tolerant-pod` that tolerates `outage=maintenance:NoExecute` with `tolerationSeconds: 120`.
  4. Verify `tolerant-pod` runs on `worker-1` and remains alive for 2 minutes before eviction.
- **Constraints:** Understand the difference between `NoSchedule` (prevents new pods) and `NoExecute` (kills running pods).
- **Hints:** Trailing minus sign removes a taint: `kubectl taint nodes <node> <key>:<effect>-`.
- **Expected Result:** `NoExecute` clears un-tolerating pods from the node.
- **Verification:**
  ```bash
  kubectl get pods -o wide | grep worker-1
  ```
- **Full Solution:**
  ```bash
  kubectl taint nodes worker-1 outage=maintenance:NoExecute
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: tolerant-pod
  spec:
    nodeName: worker-1
    tolerations:
    - key: "outage"
      operator: "Equal"
      value: "maintenance"
      effect: "NoExecute"
      tolerationSeconds: 120
    containers:
    - name: app
      image: alpine
      command: ["sleep", "3600"]
  ```
  ```bash
  kubectl apply -f tolerant-pod.yaml
  # Remove taint after verification
  kubectl taint nodes worker-1 outage=maintenance:NoExecute-
  ```
- **Common Mistakes:** Applying `NoSchedule` and expecting running pods to be evicted (only `NoExecute` evicts).
- **Troubleshooting:** Describe the node to verify active taints: `kubectl describe node worker-1 | grep Taints`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod tolerant-pod
  kubectl taint nodes worker-1 outage- || true
  ```

---

## LAB 28: Pod Anti-Affinity Across Topology Failure Domains
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Guarantee high availability by authoring strict `podAntiAffinity` rules spreading replicas across distinct physical host nodes.
- **Prerequisites:** Multi-node cluster (at least 2 worker nodes).
- **Cluster Environment:** Multi-worker cluster.
- **Initial State:** Namespace `ha-demo`.
- **Task Description:**
  1. Create namespace `ha-demo`.
  2. Deploy a Deployment `redundant-api` with 2 replicas in `ha-demo`.
  3. Image: `nginx:1.27`.
  4. Configure `podAntiAffinity` with `requiredDuringSchedulingIgnoredDuringExecution` matching `app: redundant-api` on `topologyKey: kubernetes.io/hostname`.
  5. Verify that each replica is scheduled on a completely different worker node.
  6. Scale the Deployment to 4 replicas (more than available worker nodes) and observe that surplus pods remain `Pending`.
- **Constraints:** Must use hard `requiredDuringSchedulingIgnoredDuringExecution`.
- **Hints:** The topologyKey `kubernetes.io/hostname` is standard for per-node spreading.
- **Expected Result:** Exactly 1 pod per node; surplus pods show `Pending`.
- **Verification:**
  ```bash
  kubectl get pods -n ha-demo -o wide
  ```
- **Full Solution:**
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: redundant-api
    namespace: ha-demo
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: redundant-api
    template:
      metadata:
        labels:
          app: redundant-api
      spec:
        affinity:
          podAntiAffinity:
            requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - redundant-api
              topologyKey: "kubernetes.io/hostname"
        containers:
        - name: nginx
          image: nginx:1.27
  ```
  ```bash
  kubectl create namespace ha-demo
  kubectl apply -f anti-affinity.yaml
  kubectl scale deployment redundant-api --replicas=4 -n ha-demo
  ```
- **Common Mistakes:** Omitting the `matchLabels` in the `podAntiAffinity.labelSelector`.
- **Troubleshooting:** Run `kubectl describe pod <pending-pod> -n ha-demo` to see `FailedScheduling: 0/2 nodes are available: 2 node(s) had untolerated taint or pod anti-affinity rules`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace ha-demo
  ```

---

## LAB 29: Horizontal Pod Autoscaler (HPA) Tuning with Metrics Server
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Deploy and configure an HPA resource using `autoscaling/v2` to autoscale a workload between 2 and 8 replicas based on CPU load.
- **Prerequisites:** Metrics Server installed (`kubectl top pods` works).
- **Cluster Environment:** Standard Kubernetes cluster with Metrics Server.
- **Initial State:** Namespace `scaling-lab`.
- **Task Description:**
  1. Create namespace `scaling-lab`.
  2. Deploy `cpu-stress` Deployment with 2 replicas of `nginx:1.27`, setting `resources.requests.cpu: 50m` and `resources.limits.cpu: 100m`.
  3. Expose Deployment with a Service `cpu-stress-svc`.
  4. Create an HPA `cpu-stress-hpa` targeting 60% CPU utilization with minReplicas 2 and maxReplicas 8.
  5. Inspect the HPA status and verify metrics are reading.
- **Constraints:** Deployment must have resource requests declared or HPA will report `<unknown>`.
- **Hints:** Use `kubectl autoscale deployment cpu-stress --cpu-percent=60 --min=2 --max=8 -n scaling-lab`.
- **Expected Result:** HPA shows active target metrics (e.g. `0%/60%`).
- **Verification:**
  ```bash
  kubectl get hpa cpu-stress-hpa -n scaling-lab
  ```
- **Full Solution:**
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: cpu-stress
    namespace: scaling-lab
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: cpu-stress
    template:
      metadata:
        labels:
          app: cpu-stress
      spec:
        containers:
        - name: nginx
          image: nginx:1.27
          resources:
            requests:
              cpu: 50m
            limits:
              cpu: 100m
  ---
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: cpu-stress-hpa
    namespace: scaling-lab
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: cpu-stress
    minReplicas: 2
    maxReplicas: 8
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60
  ```
  ```bash
  kubectl create namespace scaling-lab
  kubectl apply -f hpa-lab.yaml
  ```
- **Common Mistakes:** Forgetting to define `resources.requests.cpu` on the Deployment containers.
- **Troubleshooting:** If HPA reports `<unknown>/60%`, wait 60 seconds for metrics-server scrape interval, or check `kubectl top pods -n scaling-lab`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace scaling-lab
  ```

---

## LAB 30: Namespace ResourceQuotas and Container LimitRanges
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Workloads & Scheduling (15%)
- **Learning Objective:** Configure interlocking `ResourceQuota` and `LimitRange` policies to enforce namespace resource caps while preventing missing-request admission rejections.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `dev-sandbox`.
- **Task Description:**
  1. Create namespace `dev-sandbox`.
  2. Create a `ResourceQuota` named `compute-quota` capping total CPU requests at `1`, CPU limits at `2`, and maximum Pods at `4`.
  3. Create a `LimitRange` named `container-defaults` setting default request to `100m` CPU / `128Mi` RAM and default limit to `200m` CPU / `256Mi` RAM.
  4. Launch a Pod without specifying requests/limits (`kubectl run test-pod --image=nginx:alpine -n dev-sandbox`).
  5. Verify the Pod is accepted and has the default limits injected by the LimitRange.
  6. Verify quota usage reflects the new pod.
- **Constraints:** Do not allow unconstrained pods in `dev-sandbox`.
- **Hints:** Without the LimitRange, `kubectl run` fails immediately against a ResourceQuota!
- **Expected Result:** `test-pod` runs, and `kubectl describe quota -n dev-sandbox` shows 1/4 pods used.
- **Verification:**
  ```bash
  kubectl describe quota compute-quota -n dev-sandbox
  kubectl get pod test-pod -n dev-sandbox -o jsonpath='{.spec.containers[0].resources}'
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: dev-sandbox
  ---
  apiVersion: v1
  kind: ResourceQuota
  metadata:
    name: compute-quota
    namespace: dev-sandbox
  spec:
    hard:
      requests.cpu: "1"
      limits.cpu: "2"
      pods: "4"
  ---
  apiVersion: v1
  kind: LimitRange
  metadata:
    name: container-defaults
    namespace: dev-sandbox
  spec:
    limits:
    - default:
        cpu: 200m
        memory: 256Mi
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      type: Container
  ```
  ```bash
  kubectl apply -f quota-limit.yaml
  kubectl run test-pod --image=nginx:alpine -n dev-sandbox
  ```
- **Common Mistakes:** Applying a ResourceQuota without a LimitRange, causing subsequent developer deployments without explicit resource blocks to fail admission.
- **Troubleshooting:** Run `kubectl describe quota compute-quota -n dev-sandbox` to see available vs used headroom.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace dev-sandbox
  ```
