# QUICK REVISION SYSTEM & THE LAST-7-DAYS SPRINT PLAN
## CONDENSED HIGH-YIELD FORMULAS & FINAL WEEK EXAM PROTOCOL

---

## 1. THE 7-DAY PRE-EXAM SPRINT PROTOCOL

| Day | Focus Area | Required Daily Actions | Target Mastery Metric |
| :---: | :--- | :--- | :--- |
| **Day -7** | Domain 1: Cluster Setup & RBAC | Re-execute Labs 01, 04, 06, 07 (kubeadm upgrade & etcd restore). | etcd restore in < 7 minutes |
| **Day -6** | Domain 2: Workloads & Scheduling | Practice writing complex affinity, taints, sidecars, and HPA. | All YAMLs generated via `$do` |
| **Day -5** | Domain 3: Services, Ingress & Gateway | Practice multi-tier NetworkPolicies and Gateway API HTTPRoute. | Zero syntax errors on NetPol |
| **Day -4** | Domain 4: Storage Architecture | Practice PV/PVC with `WaitForFirstConsumer` and `ReadWriteOncePod`. | PVC binding in < 4 minutes |
| **Day -3** | Domain 5: Troubleshooting Marathon | Execute Labs 58, 60, 62, 65, 66 (NotReady nodes, crashed API server). | Triage any node in < 60 sec |
| **Day -2** | Timed Proctored Simulation | Execute Volume V Mock Exam 4 under strict 120-minute timer. | Score >= 85% on first pass |
| **Day -1** | Review Cheatsheets & Rest | Review this Quick Revision document, test PSI browser, sleep 8+ hours. | 100% mental clarity |
| **Day 0** | **OFFICIAL EXAM DAY** | Execute Exam Strategy (Wave 1 $\to$ Wave 2 $\to$ Wave 3); PASS CKA! | **Certified Kubernetes Admin** |

---

## 2. ONE-PAGE DOMAIN CHEAT SHEETS

### DOMAIN 1: CLUSTER ARCHITECTURE & CONFIGURATION
```bash
# 1. Kubeadm Upgrade Sequence
sudo apt-get install -y kubeadm=1.31.2-1.1
sudo kubeadm upgrade plan
sudo kubeadm upgrade apply v1.31.2 -y
kubectl drain <node> --ignore-daemonsets
sudo apt-get install -y kubelet=1.31.2-1.1 kubectl=1.31.2-1.1
sudo systemctl daemon-reload && sudo systemctl restart kubelet
kubectl uncordon <node>

# 2. etcd Backup & Restore
ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 \
  --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt \
  --key=/etc/kubernetes/pki/etcd/server.key snapshot save /opt/snap.db

ETCDCTL_API=3 etcdctl snapshot restore /opt/snap.db --data-dir=/var/lib/etcd-new \
  --initial-cluster="m=https://127.0.0.1:2380" --name="m"
# Update /etc/kubernetes/manifests/etcd.yaml hostPath to /var/lib/etcd-new
```

### DOMAIN 2: WORKLOADS & SCHEDULING
```bash
# 1. Rolling Updates & Revision Recording
kubectl set image deployment/app nginx=nginx:1.27
kubectl annotate deployment/app kubernetes.io/change-cause="v1.27 upgrade" --overwrite
kubectl rollout undo deployment/app --to-revision=1

# 2. Key Pod Scheduling Fields
spec.nodeSelector: { disk: ssd }
spec.affinity.nodeAffinity.requiredDuringSchedulingIgnoredDuringExecution.nodeSelectorTerms...
spec.tolerations: [{ key: "dedicated", operator: "Equal", value: "gpu", effect: "NoSchedule" }]
```

### DOMAIN 3: SERVICES & GATEWAY API
```yaml
# Gateway API HTTPRoute Skeleton
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: api-route
  namespace: apps
spec:
  parentRefs:
  - name: shared-gw
    namespace: infra
  rules:
  - matches:
    - path: { type: PathPrefix, value: /api }
    backendRefs:
    - name: api-v1
      port: 8080
      weight: 90
    - name: api-v2
      port: 8080
      weight: 10
```

### DOMAIN 4: STORAGE & DYNAMIC PROVISIONING
```yaml
# WaitForFirstConsumer StorageClass & Claim
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: local-sc }
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata: { name: db-pvc }
spec:
  storageClassName: local-sc
  accessModes: [ReadWriteOncePod]
  resources: { requests: { storage: 10Gi } }
```

### DOMAIN 5: TROUBLESHOOTING RUNBOOKS
```bash
# First 60 Seconds Triage Commands
kubectl get nodes -o wide
systemctl status kubelet
journalctl -u kubelet -e --no-pager
sudo crictl ps -a
sudo crictl logs <id>
kubectl get pods -A -o wide --field-selector status.phase!=Running
kubectl describe pod <pod> | tail -n 20
```
