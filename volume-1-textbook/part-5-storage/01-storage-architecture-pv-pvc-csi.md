# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART V: STORAGE ARCHITECTURE
## CHAPTERS 50–59: VOLUMES, PV, PVC, STORAGECLASSES, CSI & READWRITEONCEPOD

---

### CHAPTER 50–54: STORAGE ARCHITECTURE, PV, PVC & STORAGECLASSES

#### 1. Learning Objectives
* Understand how storage is decoupled from Pods via PersistentVolumes and PersistentVolumeClaims.
* Contrast static volume provisioning with automated dynamic provisioning.
* Master StorageClass volume binding modes and reclaim policies.

#### 2. The PersistentVolume Lifecycle
```
┌───────────────────────────┐      Dynamic Provision      ┌───────────────────────────┐
│       StorageClass        │ ──────────────────────────> │      PersistentVolume     │
└─────────────┬─────────────┘                             └─────────────┬─────────────┘
              │                                                         │
              ▼                                                         ▼
┌───────────────────────────┐         Binds To            ┌───────────────────────────┐
│   PersistentVolumeClaim   │ ◄─────────────────────────► │      PersistentVolume     │
└─────────────┬─────────────┘                             └───────────────────────────┘
              │
              ▼ Mounted Into
┌───────────────────────────┐
│            Pod            │
└───────────────────────────┘
```

#### 3. Storage Access Modes
* `ReadWriteOnce` (RWO): Volume can be mounted as read-write by a single node. Multiple pods on that same node can read and write concurrently.
* `ReadOnlyMany` (ROX): Volume can be mounted read-only by many nodes simultaneously.
* `ReadWriteMany` (RWX): Volume can be mounted read-write by many nodes simultaneously (requires distributed filesystems like NFS, CephFS, or GlusterFS).
* `ReadWriteOncePod` (RWOP): **GA in modern Kubernetes**. Restricts volume access to a *single pod in the entire cluster*. Essential for databases preventing multi-pod write corruption.

#### 4. Reclaim Policies
* `Retain`: When the PVC is deleted, the PV remains intact in `Released` status. Data is preserved for manual recovery.
* `Delete`: When the PVC is deleted, the underlying cloud storage asset is automatically destroyed.

---

### CHAPTER 55: DYNAMIC PROVISIONING & STORAGECLASSES

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-nvme
provisioner: ebs.csi.aws.com
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
reclaimPolicy: Delete
parameters:
  type: gp3
  iops: "3000"
  throughput: "125"
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: database-pvc
  namespace: database
spec:
  storageClassName: fast-nvme
  accessModes:
  - ReadWriteOncePod
  resources:
    requests:
      storage: 50Gi
```

*CRITICAL CKA CONCEPT:* `volumeBindingMode: WaitForFirstConsumer` prevents topology mismatches. The PV is not provisioned until a Pod referencing the PVC is scheduled onto a node, ensuring the disk is allocated in the node's exact availability zone.

---

### CHAPTER 58: CONTAINER STORAGE INTERFACE (CSI)

CSI is an open standard allowing storage vendors to develop plugins out-of-tree:
1. **CSI Controller (Control Plane):** Calls storage provider APIs to create and attach disks (`CreateVolume`, `ControllerPublishVolume`).
2. **CSI Node Daemon (Worker Node):** Formats filesystem and bind-mounts device into the container (`NodeStageVolume`, `NodePublishVolume`).

---

### CHAPTER 59: STORAGE TROUBLESHOOTING RUNBOOK

| Symptom | Probable Root Cause | Verification & Fix |
| :--- | :--- | :--- |
| PVC stuck in `Pending` | StorageClass missing or `WaitForFirstConsumer` active | Check events: `kubectl describe pvc <name>`. If waiting for consumer, schedule a pod using the PVC. |
| Pod stuck in `ContainerCreating` with `Multi-Attach error` | Previous node crashed without releasing volume lock | Inspect volume attachments: `kubectl get volumeattachments`. Force delete old dead pod. |
| `VolumeExpansionFailed` | StorageClass has `allowVolumeExpansion: false` or filesystem does not support online resize | Edit StorageClass to enable expansion; restart pod so kubelet expands filesystem. |
