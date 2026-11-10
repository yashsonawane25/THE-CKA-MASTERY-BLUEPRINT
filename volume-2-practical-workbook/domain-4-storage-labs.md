# VOLUME II: THE CKA PRACTICAL WORKBOOK
# DOMAIN 4: STORAGE (LABS 46–53)

---

## LAB 46: Static PersistentVolume and PVC 1-to-1 Binding Lifecycle
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Author a static `PersistentVolume` and a matching `PersistentVolumeClaim`, observing exclusive 1-to-1 binding and capacity allocation.
- **Prerequisites:** Running cluster with host filesystem access.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** Directory `/mnt/data/lab46` created on host node.
- **Task Description:**
  1. Author a PersistentVolume named `pv-static-10g`:
     - Capacity: `10Gi`
     - AccessMode: `ReadWriteOnce`
     - ReclaimPolicy: `Retain`
     - StorageClassName: `manual-storage`
     - Type: `hostPath` at path `/mnt/data/lab46`
  2. Author a PersistentVolumeClaim named `pvc-claim-5g` in `default`:
     - Requested Storage: `5Gi`
     - AccessMode: `ReadWriteOnce`
     - StorageClassName: `manual-storage`
  3. Verify that `pvc-claim-5g` binds to `pv-static-10g`.
  4. Note that the remaining 5Gi on the PV is locked and unavailable to other claims.
- **Constraints:** Do not use default storage classes.
- **Hints:** A PVC can bind to a PV of equal or greater capacity.
- **Expected Result:** Both PV and PVC show status `Bound`.
- **Verification:**
  ```bash
  kubectl get pv pv-static-10g
  kubectl get pvc pvc-claim-5g
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: PersistentVolume
  metadata:
    name: pv-static-10g
  spec:
    capacity:
      storage: 10Gi
    accessModes:
      - ReadWriteOnce
    persistentVolumeReclaimPolicy: Retain
    storageClassName: manual-storage
    hostPath:
      path: /mnt/data/lab46
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: pvc-claim-5g
  spec:
    accessModes:
      - ReadWriteOnce
    storageClassName: manual-storage
    resources:
      requests:
        storage: 5Gi
  ```
  ```bash
  kubectl apply -f static-pv-pvc.yaml
  ```
- **Common Mistakes:** Mismatching `storageClassName` between PV and PVC, causing PVC to remain in `Pending`.
- **Troubleshooting:** Run `kubectl describe pvc pvc-claim-5g` to inspect binding events.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pvc pvc-claim-5g
  kubectl delete pv pv-static-10g
  ```

---

## LAB 47: Dynamic Volume Provisioning with StorageClasses
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Configure a custom `StorageClass` with dynamic provisioning and observe automated PV creation upon PVC submission.
- **Prerequisites:** Cluster with dynamic provisioner (e.g. `rancher.io/local-path` or cloud provisioner).
- **Cluster Environment:** Standard cluster.
- **Initial State:** No StorageClass named `fast-dynamic`.
- **Task Description:**
  1. Create a `StorageClass` named `fast-dynamic` utilizing provisioner `rancher.io/local-path` (or target cluster CSI provisioner).
  2. Set `reclaimPolicy: Delete` and `volumeBindingMode: Immediate`.
  3. Create a PVC `dynamic-claim` in namespace `default` requesting `2Gi` on `fast-dynamic`.
  4. Verify that Kubernetes dynamically generates a new `PersistentVolume` without manual administrator intervention.
  5. Deploy a Pod `data-writer` mounting the claim at `/data` and write a test file.
- **Constraints:** Must use dynamic provisioning.
- **Hints:** Look at existing StorageClasses with `kubectl get sc` to find the active provisioner string.
- **Expected Result:** PVC immediately binds to an auto-created PV named `pvc-<uuid>`.
- **Verification:**
  ```bash
  kubectl get pvc dynamic-claim
  kubectl get pv | grep dynamic-claim
  ```
- **Full Solution:**
  ```yaml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: fast-dynamic
  provisioner: rancher.io/local-path
  reclaimPolicy: Delete
  volumeBindingMode: Immediate
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: dynamic-claim
  spec:
    storageClassName: fast-dynamic
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 2Gi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: data-writer
  spec:
    containers:
    - name: writer
      image: alpine
      command: ["/bin/sh", "-c", "echo 'storage verified' > /data/test.txt; sleep 3600"]
      volumeMounts:
      - name: storage
        mountPath: /data
    volumes:
    - name: storage
      persistentVolumeClaim:
        claimName: dynamic-claim
  ```
  ```bash
  kubectl apply -f dynamic-storage.yaml
  ```
- **Common Mistakes:** Typo in `provisioner` name causing provisioner lookup failures.
- **Troubleshooting:** Run `kubectl describe pvc dynamic-claim` to check `ExternalProvisioning` events.
- **Cleanup Instructions:**
  ```bash
  kubectl delete -f dynamic-storage.yaml
  ```

---

## LAB 48: Delayed Volume Binding with `WaitForFirstConsumer`
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Configure a StorageClass with `volumeBindingMode: WaitForFirstConsumer` to ensure volumes are provisioned in the exact availability zone of the scheduled Pod.
- **Prerequisites:** Multi-node cluster.
- **Cluster Environment:** Multi-worker cluster.
- **Initial State:** StorageClass `topology-aware-sc`.
- **Task Description:**
  1. Author a StorageClass `delayed-sc` with `volumeBindingMode: WaitForFirstConsumer`.
  2. Create PVC `delayed-pvc` requesting 1Gi on `delayed-sc`.
  3. Observe that `delayed-pvc` remains in `Pending` with message `waiting for first consumer to be created before binding`.
  4. Create Pod `delayed-consumer` targeting node `worker-2` with `nodeName: worker-2` that mounts `delayed-pvc`.
  5. Verify that as soon as the Pod is created, the volume binds immediately on `worker-2`.
- **Constraints:** Understand why `Pending` status is normal before Pod scheduling.
- **Hints:** The volume binding controller waits for the scheduler to populate `spec.nodeName`.
- **Expected Result:** PVC transitions from `Pending` to `Bound` once consumer Pod is scheduled.
- **Verification:**
  ```bash
  kubectl get pvc delayed-pvc
  # Should show Bound only after Pod is applied
  ```
- **Full Solution:**
  ```yaml
  apiVersion: storage.k8s.io/v1
  kind: StorageClass
  metadata:
    name: delayed-sc
  provisioner: rancher.io/local-path
  volumeBindingMode: WaitForFirstConsumer
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: delayed-pvc
  spec:
    storageClassName: delayed-sc
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 1Gi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: delayed-consumer
  spec:
    containers:
    - name: app
      image: alpine
      command: ["sleep", "3600"]
      volumeMounts:
      - name: data
        mountPath: /data
    volumes:
    - name: data
      persistentVolumeClaim:
        claimName: delayed-pvc
  ```
  ```bash
  kubectl apply -f delayed-sc-pvc.yaml
  # Verify PVC is Pending
  kubectl apply -f delayed-pod.yaml
  # Verify PVC is Bound
  ```
- **Common Mistakes:** Panicking when the PVC shows `Pending` before any Pod has referenced it.
- **Troubleshooting:** Run `kubectl describe pvc delayed-pvc` to confirm message `WaitForFirstConsumer`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod delayed-consumer
  kubectl delete pvc delayed-pvc
  kubectl delete sc delayed-sc
  ```

---

## LAB 49: Reclaim Policy Enforcement (`Retain` vs `Delete`) and Released Recovery
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Recover data from a `Released` PersistentVolume by manually stripping `spec.claimRef` and re-binding it to a new claim.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** PV `pv-reclaim-test` with `persistentVolumeReclaimPolicy: Retain`.
- **Task Description:**
  1. Create a PV `pv-reclaim-test` with capacity 2Gi and `reclaimPolicy: Retain`.
  2. Bind it with PVC `pvc-original`.
  3. Write data to the volume from a temporary pod.
  4. Delete `pvc-original`.
  5. Observe that `pv-reclaim-test` enters `Released` status and refuses to bind to a new claim `pvc-new`.
  6. Manually edit `pv-reclaim-test` to delete `spec.claimRef`.
  7. Verify status changes to `Available` and `pvc-new` successfully binds to it with original data intact.
- **Constraints:** Do not delete or recreate the PersistentVolume object.
- **Hints:** Use `kubectl edit pv pv-reclaim-test` and remove the `claimRef` block.
- **Expected Result:** PV transitions `Bound` $\to$ `Released` $\to$ `Available` $\to$ `Bound`.
- **Verification:**
  ```bash
  kubectl get pv pv-reclaim-test
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: PersistentVolume
  metadata:
    name: pv-reclaim-test
  spec:
    capacity:
      storage: 2Gi
    accessModes:
      - ReadWriteOnce
    persistentVolumeReclaimPolicy: Retain
    storageClassName: manual-reclaim
    hostPath:
      path: /tmp/reclaim-data
  ---
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: pvc-original
  spec:
    storageClassName: manual-reclaim
    accessModes:
      - ReadWriteOnce
    resources:
      requests:
        storage: 2Gi
  ```
  ```bash
  kubectl apply -f pv-reclaim.yaml
  # Delete PVC
  kubectl delete pvc pvc-original
  # PV is now Released
  kubectl patch pv pv-reclaim-test -p '{"spec":{"claimRef": null}}'
  # PV is now Available!
  ```
- **Common Mistakes:** Trying to re-bind without removing `claimRef`, causing new PVC to hang in `Pending`.
- **Troubleshooting:** Inspect `kubectl get pv pv-reclaim-test -o yaml` to verify `claimRef` is completely absent.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pv pv-reclaim-test
  ```

---

## LAB 50: Single-Pod Data Locking with `ReadWriteOncePod` (RWOP)
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Enforce strict single-pod data access using modern access mode `ReadWriteOncePod` introduced in Kubernetes v1.29+.
- **Prerequisites:** Kubernetes v1.29+ cluster with CSI supporting RWOP.
- **Cluster Environment:** Modern cluster.
- **Initial State:** Namespace `rwop-demo`.
- **Task Description:**
  1. Create namespace `rwop-demo`.
  2. Author a PVC `exclusive-pvc` requesting 1Gi with accessMode `ReadWriteOncePod`.
  3. Deploy Pod `first-pod` mounting `exclusive-pvc`.
  4. Attempt to deploy a second Pod `second-pod` mounting the exact same `exclusive-pvc` on the same node.
  5. Observe that `second-pod` blocks in `Pending` / `ContainerCreating` with a volume exclusivity conflict error.
- **Constraints:** Access mode must be strictly `ReadWriteOncePod`.
- **Hints:** In standard `ReadWriteOnce`, multiple pods on the *same node* can mount the volume. `ReadWriteOncePod` forbids this!
- **Expected Result:** Second pod cannot mount the volume while the first pod is active.
- **Verification:**
  ```bash
  kubectl describe pod second-pod -n rwop-demo | grep -i failedmount
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: exclusive-pvc
    namespace: rwop-demo
  spec:
    accessModes:
      - ReadWriteOncePod
    resources:
      requests:
        storage: 1Gi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: first-pod
    namespace: rwop-demo
  spec:
    containers:
    - name: c1
      image: alpine
      command: ["sleep", "3600"]
      volumeMounts:
      - name: vol
        mountPath: /data
    volumes:
    - name: vol
      persistentVolumeClaim:
        claimName: exclusive-pvc
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: second-pod
    namespace: rwop-demo
  spec:
    containers:
    - name: c2
      image: alpine
      command: ["sleep", "3600"]
      volumeMounts:
      - name: vol
        mountPath: /data
    volumes:
    - name: vol
      persistentVolumeClaim:
        claimName: exclusive-pvc
  ```
  ```bash
  kubectl create namespace rwop-demo
  kubectl apply -f rwop-demo.yaml
  ```
- **Common Mistakes:** Confusing `ReadWriteOnce` with `ReadWriteOncePod`.
- **Troubleshooting:** Run `kubectl get events -n rwop-demo` to see volume lock rejection.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace rwop-demo
  ```

---

## LAB 51: Dynamic PVC Online Volume Expansion
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Perform an online volume expansion of an active PersistentVolumeClaim from 1Gi to 3Gi without restarting application Pods.
- **Prerequisites:** StorageClass with `allowVolumeExpansion: true`.
- **Cluster Environment:** Dynamic storage cluster.
- **Initial State:** PVC `expandable-pvc` currently bound at 1Gi.
- **Task Description:**
  1. Verify the StorageClass allows volume expansion (`allowVolumeExpansion: true`).
  2. Deploy Pod `app-resizing` mounting `expandable-pvc` at `/data`.
  3. Edit `expandable-pvc` using `kubectl patch` to increase requested storage to `3Gi`.
  4. Verify the PVC status reflects `3Gi` and the container filesystem expands online.
- **Constraints:** Do not delete or terminate `app-resizing`.
- **Hints:** You can only expand storage size; shrinking storage is strictly prohibited by Kubernetes.
- **Expected Result:** Filesystem expands seamlessly without downtime.
- **Verification:**
  ```bash
  kubectl get pvc expandable-pvc
  # Capacity should show 3Gi
  kubectl exec -it app-resizing -- df -h /data
  ```
- **Full Solution:**
  ```bash
  kubectl patch pvc expandable-pvc -p '{"spec":{"resources":{"requests":{"storage":"3Gi"}}}}'
  ```
- **Common Mistakes:** Attempting to reduce volume size (e.g. from 3Gi to 1Gi), which is rejected with 422 Unprocessable Entity.
- **Troubleshooting:** If capacity does not change, check if the StorageClass has `allowVolumeExpansion: true`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod app-resizing
  kubectl delete pvc expandable-pvc
  ```

---

## LAB 52: Multi-Pod Shared Read-Write Storage (`ReadWriteMany`)
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Configure a shared volume with `ReadWriteMany` access mode and verify concurrent read-write access from pods on different nodes.
- **Prerequisites:** Clustered/shared storage provisioner (NFS or local-path shared).
- **Cluster Environment:** Multi-worker cluster.
- **Initial State:** Namespace `shared-storage`.
- **Task Description:**
  1. Create namespace `shared-storage`.
  2. Create PVC `shared-pvc` with `accessModes: [ReadWriteMany]` requesting 2Gi.
  3. Deploy Pod `writer-pod` on `worker-1` mounting `shared-pvc` and writing timestamps to `/shared/log.txt`.
  4. Deploy Pod `reader-pod` on `worker-2` mounting `shared-pvc` and tailing `/shared/log.txt`.
  5. Verify `reader-pod` sees live updates written by `writer-pod`.
- **Constraints:** Must use `ReadWriteMany`.
- **Hints:** Block storage (AWS EBS, GCP PD) does NOT support RWX. File storage (NFS, EFS, CephFS) is required.
- **Expected Result:** Concurrent multi-node read/write succeeds.
- **Verification:**
  ```bash
  kubectl logs reader-pod -n shared-storage
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: PersistentVolumeClaim
  metadata:
    name: shared-pvc
    namespace: shared-storage
  spec:
    accessModes:
      - ReadWriteMany
    resources:
      requests:
        storage: 2Gi
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: writer-pod
    namespace: shared-storage
  spec:
    nodeName: worker-1
    containers:
    - name: writer
      image: alpine
      command: ["/bin/sh", "-c", "while true; do date >> /shared/log.txt; sleep 2; done"]
      volumeMounts:
      - name: shared-vol
        mountPath: /shared
    volumes:
    - name: shared-vol
      persistentVolumeClaim:
        claimName: shared-pvc
  ---
  apiVersion: v1
  kind: Pod
  metadata:
    name: reader-pod
    namespace: shared-storage
  spec:
    nodeName: worker-2
    containers:
    - name: reader
      image: alpine
      command: ["/bin/sh", "-c", "sleep 5; cat /shared/log.txt; sleep 3600"]
      volumeMounts:
      - name: shared-vol
        mountPath: /shared
    volumes:
    - name: shared-vol
      persistentVolumeClaim:
        claimName: shared-pvc
  ```
  ```bash
  kubectl create namespace shared-storage
  kubectl apply -f shared-storage.yaml
  ```
- **Common Mistakes:** Requesting `ReadWriteMany` against an EBS/GCP PD CSI driver that only supports `ReadWriteOnce`.
- **Troubleshooting:** Check `kubectl describe pvc shared-pvc -n shared-storage` for unsupported access mode errors.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace shared-storage
  ```

---

## LAB 53: CSI Driver Inspection and VolumeAttachment Triage
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Storage (10%)
- **Learning Objective:** Inspect Container Storage Interface (CSI) node registration, volume drivers, and `VolumeAttachment` API objects.
- **Prerequisites:** CSI-enabled cluster.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** Running cluster with active workloads.
- **Task Description:**
  1. Inspect all registered CSI drivers using `kubectl get csidrivers`.
  2. Inspect CSI node registrations across all nodes using `kubectl get csinodes`.
  3. Inspect active `VolumeAttachment` objects across the cluster.
  4. Identify which node has attached volume `pvc-xxxx`.
- **Constraints:** Understand how the CSI Controller attaches volumes before the CSI Node mounts them.
- **Hints:** `VolumeAttachment` objects are cluster-scoped.
- **Expected Result:** Full mapping of PVs to physical nodes via `VolumeAttachment`.
- **Verification:**
  ```bash
  kubectl get csidrivers
  kubectl get csinodes -o wide
  kubectl get volumeattachments
  ```
- **Full Solution:**
  ```bash
  kubectl get csidrivers -o custom-columns=NAME:.metadata.name,ATTACH-REQUIRED:.spec.attachRequired,POD-INFO:.spec.podInfoOnMount
  kubectl get csinodes
  kubectl get volumeattachment -o custom-columns=NAME:.metadata.name,NODE:.spec.nodeName,PV:.spec.source.persistentVolumeName,ATTACHED:.status.attached
  ```
- **Common Mistakes:** Looking for `VolumeAttachment` in a specific namespace (it is non-namespaced).
- **Troubleshooting:** If a volume attachment hangs, describe the `VolumeAttachment` object to view CSI driver attach errors.
- **Cleanup Instructions:** None.
