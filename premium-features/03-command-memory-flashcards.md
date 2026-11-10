# COMMAND MEMORY SYSTEM & SPACED-REPETITION FLASHCARDS
## INSTANT CLI MUSCLE MEMORY FOR CKA EXAM SPEED

---

## 1. SPACED-REPETITION METHODOLOGY
Print or review these 24 high-yield flashcards daily. Cover the "Answer / Command" column, read the "Scenario / Challenge", and recite or type the exact syntax without looking.

---

## 2. FLASHCARD DECK: IMPERATIVE COMMAND GENERATION

| Card # | Scenario / Administrative Need | Exact Command Syntax | Critical Flags & Notes |
| :---: | :--- | :--- | :--- |
| **FC-01** | Generate Pod YAML without creating | `kubectl run web --image=nginx:alpine $do > pod.yaml` | `$do` is `--dry-run=client -o yaml` |
| **FC-02** | Create Deployment with 3 replicas on port 80 | `kubectl create deployment api --image=nginx:alpine --replicas=3 --port=80` | Creates apps/v1 Deployment |
| **FC-03** | Expose Deployment internally as ClusterIP | `kubectl expose deployment api --port=80 --target-port=8080 --name=api-svc` | Inherits deployment label selector |
| **FC-04** | Expose Deployment on NodePort 30080 | `kubectl expose deployment api --type=NodePort --port=80 --target-port=8080` | Then edit service to set `nodePort: 30080` |
| **FC-05** | Update image and record revision | `kubectl set image deployment/api nginx=nginx:1.27`<br/>`kubectl annotate deployment/api kubernetes.io/change-cause="v1.27" --overwrite` | Replaces removed `--record` flag! |
| **FC-06** | Rollback deployment to specific revision | `kubectl rollout undo deployment/api --to-revision=2` | View history: `kubectl rollout history ...` |
| **FC-07** | Generate Job that runs batch command | `kubectl create job calc --image=busybox $do -- expr 10 + 20 > job.yaml` | Must specify `--` before container command |
| **FC-08** | Generate CronJob running hourly | `kubectl create cronjob backup --image=busybox --schedule="0 * * * *" $do -- date` | Uses 5-field cron syntax |
| **FC-09** | Create Secret with literal password | `kubectl create secret generic db-pass --from-literal=password='S3cur3!'` | Value is Base64 encoded automatically |
| **FC-10** | Create TLS Secret with cert and key files | `kubectl create secret tls web-tls --cert=/path/tls.crt --key=/path/tls.key` | Creates `kubernetes.io/tls` type secret |
| **FC-11** | Test permissions without switching user | `kubectl auth can-i create pods -n prod --as=system:serviceaccount:ci:builder` | Returns `yes` or `no` |
| **FC-12** | Safely evict pods prior to node maintenance | `kubectl drain node-01 --ignore-daemonsets --delete-emptydir-data --force` | Cordon automatically applied by drain |

---

## 3. FLASHCARD DECK: CLUSTER ADMINISTRATION & ETCD

| Card # | Scenario / Administrative Need | Exact Command Syntax | Critical Flags & Notes |
| :---: | :--- | :--- | :--- |
| **FC-13** | Save etcd snapshot to file with mTLS | `ETCDCTL_API=3 etcdctl --endpoints=https://127.0.0.1:2379 --cacert=/etc/kubernetes/pki/etcd/ca.crt --cert=/etc/kubernetes/pki/etcd/server.crt --key=/etc/kubernetes/pki/etcd/server.key snapshot save /opt/snap.db` | All 3 TLS cert flags are mandatory |
| **FC-14** | Verify etcd snapshot integrity | `ETCDCTL_API=3 etcdctl --write-out=table snapshot status /opt/snap.db` | Checks hash, revision, and size |
| **FC-15** | Restore etcd snapshot to new directory | `ETCDCTL_API=3 etcdctl snapshot restore /opt/snap.db --data-dir=/var/lib/etcd-new --initial-cluster="m=https://127.0.0.1:2380" --initial-cluster-token="t" --name="m"` | Never restore directly over `/var/lib/etcd` |
| **FC-16** | Check kubeadm certificate expiration | `sudo kubeadm certs check-expiration` | Reports residual time for all PKI certs |
| **FC-17** | Renew all control plane certificates | `sudo kubeadm certs renew all` | Remember to copy `admin.conf` to `~/.kube/config`! |
| **FC-18** | Upgrade kubeadm control plane | `sudo kubeadm upgrade plan`<br/>`sudo kubeadm upgrade apply v1.31.2 -y` | Control plane must be upgraded before workers |

---

## 4. FLASHCARD DECK: JSONPATH, TROUBLESHOOTING & LINUX

| Card # | Scenario / Administrative Need | Exact Command Syntax | Critical Flags & Notes |
| :---: | :--- | :--- | :--- |
| **FC-19** | Sort all pods by creation timestamp | `kubectl get pods -A --sort-by=.metadata.creationTimestamp` | Instant view of newly restarted pods |
| **FC-20** | Extract Pod IPs in a single tab-separated line | `kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.podIP}{"\n"}{end}'` | JSONPath range loop syntax |
| **FC-21** | List static containers running on host | `sudo crictl ps -a --name kube-apiserver` | Primary tool when apiserver is down |
| **FC-22** | View kubelet systemd journal crash log | `sudo journalctl -u kubelet -n 50 --no-pager` | Bypasses pager for instant inspection |
| **FC-23** | Test TCP port connectivity with 3s timeout | `nc -zvw3 192.168.1.10 6443` | Tests if port is open and listening |
| **FC-24** | Instant temporary debug pod for DNS | `kubectl run net-test --rm -it --image=busybox:1.28 -- nslookup kubernetes.default` | `--rm` automatically cleans up pod |
