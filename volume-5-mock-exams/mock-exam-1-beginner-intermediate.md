# VOLUME V: THE CKA MOCK EXAMINATION SYSTEM
# MOCK EXAM 1: BEGINNER TO INTERMEDIATE SIMULATION

---

## EXAMINATION SPECIFICATIONS
- **Target Difficulty:** Beginner to Intermediate
- **Time Allowed:** 120 minutes (2.0 hours)
- **Passing Score:** 66% (Total Possible: 100%)
- **Number of Tasks:** 17 Performance-Based Tasks
- **Cluster Contexts:** `k8s`, `cluster2`, `wk8s`

---

## TASK 1: Pod Deployment and Label Filtering (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `ingress-basic` does not exist.
- **Task Description:**
  1. Create namespace `ingress-basic`.
  2. Create a Pod named `frontend-pod` running image `nginx:1.27` in namespace `ingress-basic`.
  3. Assign labels `tier=frontend` and `app=web`.
  4. Expose container port `80`.
- **Expected Final Condition:** Pod `frontend-pod` is `Running` in namespace `ingress-basic` with both labels.
- **Verification Command:**
  ```bash
  kubectl get pod frontend-pod -n ingress-basic --show-labels
  ```
- **Solution:**
  ```bash
  kubectl config use-context k8s
  kubectl create namespace ingress-basic
  kubectl run frontend-pod --image=nginx:1.27 --port=80 --labels="tier=frontend,app=web" -n ingress-basic
  ```

---

## TASK 2: Multi-Container Pod with EmptyDir Sharing (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `default`.
- **Task Description:**
  1. Create Pod `log-pipeline` in namespace `default`.
  2. Container 1 named `writer`: image `busybox:1.36`, appends `date` to `/var/log/app.log` every 5 seconds.
  3. Container 2 named `reader`: image `busybox:1.36`, executes `tail -f /var/log/app.log`.
  4. Both containers must mount an `emptyDir` volume at `/var/log`.
- **Expected Final Condition:** Both containers show `2/2 Running` and reader prints timestamps.
- **Verification Command:**
  ```bash
  kubectl logs log-pipeline -c reader
  ```
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: log-pipeline
  spec:
    volumes:
    - name: shared-vol
      emptyDir: {}
    containers:
    - name: writer
      image: busybox:1.36
      command: ["/bin/sh", "-c", "while true; do date >> /var/log/app.log; sleep 5; done"]
      volumeMounts:
      - name: shared-vol
        mountPath: /var/log
    - name: reader
      image: busybox:1.36
      command: ["/bin/sh", "-c", "tail -f /var/log/app.log"]
      volumeMounts:
      - name: shared-vol
        mountPath: /var/log
  ```

---

## TASK 3: ServiceAccount and RBAC RoleBinding (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `security-zone`.
- **Task Description:**
  1. Create namespace `security-zone`.
  2. Create a ServiceAccount named `operator-sa` in `security-zone`.
  3. Create a Role named `pod-admin` allowing `get`, `list`, `watch`, and `delete` on `pods`.
  4. Bind `pod-admin` to `operator-sa` via RoleBinding `operator-pod-bind`.
- **Expected Final Condition:** `operator-sa` can delete pods in `security-zone` but cannot delete deployments.
- **Verification Command:**
  ```bash
  kubectl auth can-i delete pods -n security-zone --as=system:serviceaccount:security-zone:operator-sa
  ```
- **Solution:**
  ```bash
  kubectl create namespace security-zone
  kubectl create serviceaccount operator-sa -n security-zone
  kubectl create role pod-admin -n security-zone --verb=get,list,watch,delete --resource=pods
  kubectl create rolebinding operator-pod-bind -n security-zone --role=pod-admin --serviceaccount=security-zone:operator-sa
  ```

---

## TASK 4: Deployment Scaling and Rolling Update (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `default`.
- **Task Description:**
  1. Create Deployment `micro-api` running `nginx:1.25` with 2 replicas.
  2. Scale the Deployment to 5 replicas.
  3. Update image to `nginx:1.26` and annotate with change-cause: "Updated to 1.26".
  4. Verify all 5 replicas are updated.
- **Expected Final Condition:** 5 replicas running image `nginx:1.26` with change-cause recorded.
- **Verification Command:**
  ```bash
  kubectl rollout status deployment micro-api
  kubectl rollout history deployment micro-api
  ```
- **Solution:**
  ```bash
  kubectl create deployment micro-api --image=nginx:1.25 --replicas=2
  kubectl scale deployment micro-api --replicas=5
  kubectl set image deployment/micro-api nginx=nginx:1.26
  kubectl annotate deployment/micro-api kubernetes.io/change-cause="Updated to 1.26" --overwrite
  ```

---

## TASK 5: Secret Creation and Pod Environment Injection (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `data-tier`.
- **Task Description:**
  1. Create namespace `data-tier`.
  2. Create Secret `db-passwords` containing `DB_PASS=AlpineP@ss2026`.
  3. Deploy Pod `db-runner` (`alpine`, sleeping 3600) injecting `DB_PASS` as an environment variable from Secret `db-passwords`.
- **Expected Final Condition:** `kubectl exec db-runner -- env` shows `DB_PASS=AlpineP@ss2026`.
- **Verification Command:**
  ```bash
  kubectl exec db-runner -n data-tier -- env | grep DB_PASS
  ```
- **Solution:**
  ```bash
  kubectl create namespace data-tier
  kubectl create secret generic db-passwords --from-literal=DB_PASS='AlpineP@ss2026' -n data-tier
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: db-runner
    namespace: data-tier
  spec:
    containers:
    - name: runner
      image: alpine
      command: ["sleep", "3600"]
      env:
      - name: DB_PASS
        valueFrom:
          secretKeyRef:
            name: db-passwords
            key: DB_PASS
  ```

---

## TASK 6: PersistentVolume & PersistentVolumeClaim Binding (Weight: 7%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Host directory `/data/local-vol`.
- **Task Description:**
  1. Create PersistentVolume `pv-disk-1` with capacity `3Gi`, accessMode `ReadWriteOnce`, hostPath `/data/local-vol`, and storageClassName `local-disk`.
  2. Create PersistentVolumeClaim `pvc-disk-1` in `default` requesting `2Gi` on storageClassName `local-disk` with accessMode `ReadWriteOnce`.
  3. Confirm the claim status is `Bound`.
- **Expected Final Condition:** Both PV and PVC show status `Bound`.
- **Verification Command:**
  ```bash
  kubectl get pvc pvc-disk-1
  ```
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: PersistentVolume
  metadata:
    name: pv-disk-1
  spec:
    capacity:
      storage: 3Gi
    accessModes:
      - ReadWriteOnce
    storageClassName: local-disk
    hostPath:
      path: /data/local-vol
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: pvc-disk-1
  spec:
    storageClassName: local-disk
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 2Gi
  ```

---

## TASK 7: ClusterIP Service and DNS Discovery (Weight: 5%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Deployment `api-server` exists in `production`.
- **Task Description:**
  1. Create a ClusterIP Service named `api-svc` in `production` exposing Deployment `api-server` on port 80 targeting port 8080.
  2. Verify that EndpointSlices are created and contain valid IPs.
- **Expected Final Condition:** `api-svc` resolves internally and has active endpoints.
- **Verification Command:**
  ```bash
  kubectl get endpoints api-svc -n production
  ```
- **Solution:**
  ```bash
  kubectl expose deployment api-server --name=api-svc --port=80 --target-port=8080 -n production
  ```

---

## TASK 8: Node Maintenance: Cordon and Safe Drain (Weight: 7%)
- **Context:** `kubectl config use-context cluster2`
- **Initial Condition:** Worker node `cluster2-worker-1` is running workloads.
- **Task Description:**
  1. Switch to context `cluster2`.
  2. Cordon `cluster2-worker-1`.
  3. Drain all workloads from `cluster2-worker-1` safely, handling DaemonSets and emptyDir volumes.
- **Expected Final Condition:** Node status shows `Ready,SchedulingDisabled` with 0 non-daemonset pods.
- **Verification Command:**
  ```bash
  kubectl get node cluster2-worker-1
  ```
- **Solution:**
  ```bash
  kubectl config use-context cluster2
  kubectl cordon cluster2-worker-1
  kubectl drain cluster2-worker-1 --ignore-daemonsets --delete-emptydir-data --force
  ```

---

## TASK 9: Pod Scheduling with NodeSelector (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Worker nodes untagged.
- **Task Description:**
  1. Label node `k8s-worker-1` with `disk=ssd`.
  2. Deploy Pod `cache-pod` running `redis:alpine` with a `nodeSelector` requiring `disk: ssd`.
  3. Verify Pod lands on `k8s-worker-1`.
- **Expected Final Condition:** `cache-pod` is `Running` on `k8s-worker-1`.
- **Verification Command:**
  ```bash
  kubectl get pod cache-pod -o wide
  ```
- **Solution:**
  ```bash
  kubectl config use-context k8s
  kubectl label node k8s-worker-1 disk=ssd
  kubectl run cache-pod --image=redis:alpine --dry-run=client -o yaml > cache.yaml
  # Add nodeSelector: disk: ssd to spec
  kubectl apply -f cache.yaml
  ```

---

## TASK 10: Taints and Tolerations (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Node `k8s-worker-2`.
- **Task Description:**
  1. Apply taint `dedicated=gpu:NoSchedule` to node `k8s-worker-2`.
  2. Deploy Pod `gpu-app` running `alpine` sleeping 3600 that tolerates `dedicated=gpu:NoSchedule`.
  3. Verify Pod schedules onto `k8s-worker-2`.
- **Expected Final Condition:** Pod is running on `k8s-worker-2`.
- **Verification Command:**
  ```bash
  kubectl get pod gpu-app -o wide
  ```
- **Solution:**
  ```bash
  kubectl taint nodes k8s-worker-2 dedicated=gpu:NoSchedule
  ```
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: gpu-app
  spec:
    nodeName: k8s-worker-2
    tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "gpu"
      effect: "NoSchedule"
    containers:
    - name: app
      image: alpine
      command: ["sleep", "3600"]
  ```

---

## TASK 11: Ingress Resource Path Routing (Weight: 7%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Ingress controller installed. Services `auth-svc` and `pay-svc` running on port 80.
- **Task Description:**
  1. Author an Ingress `gateway-ingress` in `default`.
  2. IngressClass: `nginx`. Host: `api.test.local`.
  3. Path `/auth` $\to$ `auth-svc:80`.
  4. Path `/pay` $\to$ `pay-svc:80`.
- **Expected Final Condition:** Ingress created with `Prefix` path matching.
- **Verification Command:**
  ```bash
  kubectl describe ingress gateway-ingress
  ```
- **Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: gateway-ingress
  spec:
    ingressClassName: nginx
    rules:
    - host: api.test.local
      http:
        paths:
        - path: /auth
          pathType: Prefix
          backend:
            service:
              name: auth-svc
              port:
                number: 80
        - path: /pay
          pathType: Prefix
          backend:
            service:
              name: pay-svc
              port:
                number: 80
  ```

---

## TASK 12: NetworkPolicy Restricting Ingress (Weight: 7%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `secure-backend`.
- **Task Description:**
  1. Create NetworkPolicy `isolate-backend` in `secure-backend` selecting pods labeled `role=db`.
  2. Permit incoming TCP traffic on port 5432 strictly from pods labeled `role=api`.
- **Expected Final Condition:** Non-api pods cannot reach port 5432.
- **Verification Command:**
  ```bash
  kubectl describe netpol isolate-backend -n secure-backend
  ```
- **Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: isolate-backend
    namespace: secure-backend
  spec:
    podSelector:
      matchLabels:
        role: db
    policyTypes:
    - Ingress
    ingress:
    - from:
      - podSelector:
          matchLabels:
            role: api
      ports:
      - protocol: TCP
        port: 5432
  ```

---

## TASK 13: etcd Snapshot Backup (Weight: 8%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Control plane node.
- **Task Description:**
  1. SSH to control plane.
  2. Save etcd snapshot to `/opt/backup/etcd-mock1.db` using client certificates in `/etc/kubernetes/pki/etcd/`.
  3. Verify snapshot status.
- **Expected Final Condition:** Snapshot file exists with non-zero size and valid revision.
- **Verification Command:**
  ```bash
  sudo ETCDCTL_API=3 etcdctl --write-out=table snapshot status /opt/backup/etcd-mock1.db
  ```
- **Solution:**
  ```bash
  sudo ETCDCTL_API=3 etcdctl \
    --endpoints=https://127.0.0.1:2379 \
    --cacert=/etc/kubernetes/pki/etcd/ca.crt \
    --cert=/etc/kubernetes/pki/etcd/server.crt \
    --key=/etc/kubernetes/pki/etcd/server.key \
    snapshot save /opt/backup/etcd-mock1.db
  ```

---

## TASK 14: Gateway API HTTPRoute Deployment (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Gateway `shared-gw` exists in `infra`. Service `order-svc` exists in `sales`.
- **Task Description:**
  1. In namespace `sales`, create an `HTTPRoute` named `order-route` attaching to parent Gateway `shared-gw` in namespace `infra`.
  2. Route path prefix `/orders` to Service `order-svc` on port 80.
- **Expected Final Condition:** `order-route` reports `Accepted: True`.
- **Verification Command:**
  ```bash
  kubectl describe httproute order-route -n sales
  ```
- **Solution:**
  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: order-route
    namespace: sales
  spec:
    parentRefs:
    - name: shared-gw
      namespace: infra
    rules:
    - matches:
      - path:
          type: PathPrefix
          value: /orders
      backendRefs:
      - name: order-svc
        port: 80
  ```

---

## TASK 15: Pod Liveness and Readiness Probe Configuration (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Namespace `default`.
- **Task Description:**
  1. Create Pod `probe-app` running `nginx:1.27`.
  2. Add readiness probe: HTTP GET `/` on port 80, initialDelaySeconds 5.
  3. Add liveness probe: HTTP GET `/` on port 80, periodSeconds 10.
- **Expected Final Condition:** Pod is `1/1 Running`.
- **Verification Command:**
  ```bash
  kubectl describe pod probe-app | grep -E "Liveness|Readiness"
  ```
- **Solution:**
  ```yaml
  apiVersion: v1
  kind: Pod
  metadata:
    name: probe-app
  spec:
    containers:
    - name: nginx
      image: nginx:1.27
      readinessProbe:
        httpGet:
          path: /
          port: 80
        initialDelaySeconds: 5
      livenessProbe:
        httpGet:
          path: /
          port: 80
        periodSeconds: 10
  ```

---

## TASK 16: JSONPath Extraction of Node Internal IPs (Weight: 4%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Multi-node cluster.
- **Task Description:**
  1. Extract the Internal IP of all nodes in the cluster using `kubectl get nodes -o jsonpath=...`.
  2. Save the output string to `/opt/node-ips.txt`.
- **Expected Final Condition:** `/opt/node-ips.txt` contains space-separated Internal IPs.
- **Verification Command:**
  ```bash
  cat /opt/node-ips.txt
  ```
- **Solution:**
  ```bash
  kubectl get nodes -o jsonpath='{.items[*].status.addresses[?(@.type=="InternalIP")].address}' > /opt/node-ips.txt
  ```

---

## TASK 17: Troubleshooting a CrashLoopBackOff Pod (Weight: 6%)
- **Context:** `kubectl config use-context k8s`
- **Initial Condition:** Pod `broken-worker` in namespace `default` in `CrashLoopBackOff`.
- **Task Description:**
  1. Check previous logs of `broken-worker` to identify the crash reason.
  2. You discover the command `sh -c "sleep 10 && exit 1"` is failing.
  3. Fix the pod command to `sh -c "sleep 3600"`.
  4. Recreate the pod and verify it stays in `Running` status.
- **Expected Final Condition:** `broken-worker` is `Running` with 0 restarts.
- **Verification Command:**
  ```bash
  kubectl get pod broken-worker
  ```
- **Solution:**
  ```bash
  kubectl logs broken-worker --previous
  kubectl get pod broken-worker -o yaml > /tmp/broken.yaml
  sed -i 's/exit 1/sleep 3600/g' /tmp/broken.yaml
  kubectl replace --force -f /tmp/broken.yaml
  ```
