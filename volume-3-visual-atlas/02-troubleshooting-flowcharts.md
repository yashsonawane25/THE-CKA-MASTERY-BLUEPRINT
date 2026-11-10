# VOLUME III: THE KUBERNETES VISUAL ARCHITECTURE ATLAS
## PART 2: SYSTEMATIC TROUBLESHOOTING DECISION TREES (DIAGRAMS 33–64)

---

## 33. Universal 60-Second Node Triage Decision Tree
```mermaid
flowchart TD
    Start["Node Reports Issue / Alert"] --> Step1["1. Run: kubectl get nodes -o wide"]
    Step1 --> CheckStatus{"Is Node Status Ready?"}
    
    CheckStatus -- NotReady --> GoNotReady["Follow Diagram 34: Node NotReady Tree"]
    CheckStatus -- Ready --> Step2["2. Check Node Resource Pressure:<br/>kubectl describe node <name> | grep -A 5 Conditions"]
    
    Step2 --> PressureCheck{"Any Condition True?<br/>MemoryPressure, DiskPressure, PIDPressure"}
    PressureCheck -- Yes --> GoPressure["Follow Diagram 57-59: Resource Pressure Trees"]
    PressureCheck -- No --> Step3["3. Inspect System Logs on Node:<br/>journalctl -u kubelet -e --no-pager"]
    
    Step3 --> KubeletLog{"Any Fatal Errors in Kubelet?"}
    KubeletLog -- Yes --> GoKubelet["Follow Diagram 35: Kubelet Systemd Failure"]
    KubeletLog -- No --> Step4["4. Check Container Runtime:<br/>crictl info && systemctl status containerd"]
    Step4 --> RuntimeCheck{"Runtime Active & Responsive?"}
    RuntimeCheck -- No --> GoRuntime["Follow Diagram 36: containerd Failure"]
    RuntimeCheck -- Yes --> NodeHealthy["Node Infrastructure Verified Healthy"]
```
**Diagnostic Explanation:**  
When troubleshooting an affected cluster, never jump blindly into pod manifests. Follow this 60-second triage protocol to isolate node-level infrastructure failures from workload application faults in under one minute.

---

## 34. Node Status: NotReady Diagnostic and Remediation Algorithm
```mermaid
flowchart TD
    NotReady["Node Reports NotReady in kubectl get nodes"] --> SSH["SSH into Affected Node"]
    SSH --> SvcCheck["systemctl status kubelet"]
    
    SvcCheck --> IsRunning{"Is kubelet running?"}
    IsRunning -- Inactive / Failed --> StartKubelet["systemctl restart kubelet<br/>journalctl -u kubelet -xe"]
    IsRunning -- Active (Running) --> CheckAPIReach{"Can Node reach kube-apiserver?<br/>curl -k https://<control-plane>:6443/version"}
    
    CheckAPIReach -- Connection Refused / Timeout --> NetIssue["Firewall / Network / Security Group Blocking Port 6443"]
    CheckAPIReach -- 200 OK or 401 Unauthorized --> CertCheck{"Are Kubelet Certificates Valid?<br/>openssl x509 -in /var/lib/kubelet/pki/kubelet-client-current.pem -noout -dates"}
    
    CertCheck -- Expired --> RenewCert["Regenerate Certs via kubeadm / kubeconfig bootstrap"]
    CertCheck -- Valid --> CgroupCheck{"Do Kubelet & containerd Cgroup Drivers Match?<br/>SystemdCgroup = true in config.toml"}
    
    CgroupCheck -- Mismatch --> FixCgroup["Align cgroup to systemd & restart daemons"]
    CgroupCheck -- Match --> DiskCheck{"Is Node Root Disk 100% Full?<br/>df -h /"}
    DiskCheck -- Full --> CleanDisk["Prune dead containers & logs: crictl rmi --prune"]
    DiskCheck -- Not Full --> NodeReady["Kubelet Posts NodeStatus -> Node Transitions to Ready"]
```
**Diagnostic Explanation:**  
A `NotReady` condition occurs when the node lease fails to renew or heartbeat times out. Root causes fall into:
1. Dead `kubelet` systemd service.
2. Network partition to the API server on port 6443.
3. Expired TLS client certificates in `/var/lib/kubelet/pki/`.
4. Cgroup driver mismatch between kubelet and containerd.
5. Disk space exhaustion preventing container creation.

---

## 35. kubelet Systemd Service Failure & Cgroup Driver Mismatch
```mermaid
flowchart TD
    FailedKubelet["systemctl status kubelet reports failed"] --> Journal["Run: journalctl -u kubelet -n 100 --no-pager"]
    Journal --> Analyze{"Analyze Error Message"}
    
    Analyze -- "cgroup driver mismatch" --> CheckConfig["Inspect /etc/containerd/config.toml<br/>Look for: SystemdCgroup = true"]
    CheckConfig --> EditConfig["Set SystemdCgroup = true<br/>systemctl restart containerd && systemctl restart kubelet"]
    
    Analyze -- "failed to load kubelet config file" --> CheckFile["Inspect /var/lib/kubelet/config.yaml<br/>Verify valid YAML syntax and paths"]
    
    Analyze -- "failed to run Kubelet: misconfiguration: kubelet cgroup" --> SwapCheck{"Is Linux Swap Active?<br/>Run: swapon --show"}
    SwapCheck -- Swap Active --> TurnOffSwap["Run: sudo swapoff -a<br/>Comment swap line in /etc/fstab"]
    
    Analyze -- "certificate signed by unknown authority" --> KubeconfigFix["Verify /etc/kubernetes/kubelet.conf points to correct CA"]
```
**Diagnostic Explanation:**  
The kubelet will refuse to start if Linux swap memory is enabled (unless configured explicitly with `failSwapOn: false`) or if the cgroup driver does not match the container runtime (`systemd` is mandatory in modern Kubernetes).

---

## 36. Container Runtime (containerd) Socket and CRI Resolution
```mermaid
flowchart TD
    RuntimeDown["containerd service failing or crictl errors"] --> CheckStatus["systemctl status containerd"]
    CheckStatus --> SockCheck{"Does socket exist?<br/>ls -la /run/containerd/containerd.sock"}
    
    SockCheck -- No --> CheckCrashLog["Inspect: journalctl -u containerd -n 50 --no-pager"]
    CheckCrashLog --> BrokenConfig{"Invalid syntax in /etc/containerd/config.toml?"}
    BrokenConfig -- Yes --> DefaultConfig["Generate clean config:<br/>containerd config default > /etc/containerd/config.toml<br/>Set SystemdCgroup = true<br/>systemctl restart containerd"]
    
    SockCheck -- Yes --> CrictlTest{"Does crictl work?<br/>crictl pods"}
    CrictlTest -- Socket error --> SetEndpoint["Configure /etc/crictl.yaml:<br/>runtime-endpoint: unix:///run/containerd/containerd.sock"]
    CrictlTest -- Success --> Ready["Container runtime fully operational"]
```
**Diagnostic Explanation:**  
`crictl` requires an explicit runtime endpoint configuration. If `/etc/crictl.yaml` is absent, run `crictl config --set runtime-endpoint=unix:///run/containerd/containerd.sock`. Corrupted `config.toml` files should be regenerated from `containerd config default`.

---

## 37. Control Plane Static Pod Outage & Log Recovery
```mermaid
flowchart TD
    ControlPlaneDown["Control Plane Not Responding<br/>kubectl fails: Connection Refused on 6443"] --> SSH["SSH to Control Plane Node"]
    SSH --> InspectStatic["Inspect /etc/kubernetes/manifests/<br/>kube-apiserver.yaml, etcd.yaml, kube-scheduler.yaml"]
    
    InspectStatic --> CheckCRI["Inspect Static Containers with crictl:<br/>crictl ps -a --name kube-apiserver"]
    CheckCRI --> ContainerFound{"Is API Server container listed?"}
    
    ContainerFound -- Exited / Crashing --> FetchLogs["Fetch logs directly from container runtime:<br/>crictl logs <container-id>"]
    ContainerFound -- Missing Entirely --> ManifestCheck["Verify manifest syntax & permissions in /etc/kubernetes/manifests/"]
    
    FetchLogs --> ErrorType{"Identify Root Error"}
    ErrorType -- "etcdserver: request timed out / connection refused" --> CheckEtcd["Verify etcd static container is healthy (Port 2379)"]
    ErrorType -- "address already in use" --> PortConflict["Kill orphaned process holding port 6443: fuser -k 6443/tcp"]
    ErrorType -- "certificate has expired" --> CertRenew["Renew certificates: kubeadm certs renew all"]
```
**Diagnostic Explanation:**  
When the API server is down, `kubectl` cannot be used. Troubleshooting must be conducted on the control-plane host using `crictl ps -a` and inspecting raw static pod container logs directly under `/var/log/pods/` or via `crictl logs`.

---

## 38. kube-apiserver Port 6443 Connection Refused Resolution
```mermaid
flowchart TD
    ConnRefused["kubectl: The connection to server 192.168.1.10:6443 was refused"] --> Step1["Check kubelet on Master: systemctl is-active kubelet"]
    Step1 -- Inactive --> StartK["systemctl start kubelet"]
    Step1 -- Active --> Step2["Check if apiserver container is running:<br/>crictl ps | grep kube-apiserver"]
    
    Step2 -- Running --> FWCheck["Check Linux Firewall / iptables:<br/>ufw status or iptables -L -n | grep 6443"]
    FWCheck -- Blocked --> AllowPort["Allow TCP Port 6443"]
    
    Step2 -- Not Running --> Step3["Inspect latest apiserver container log:<br/>crictl logs $(crictl ps -a --name kube-apiserver -q | head -n 1)"]
    Step3 --> AnalyzeErr{"Error Cause?"}
    AnalyzeErr -- ETCD unreachable --> FixETCD["Recover etcd container on port 2379"]
    AnalyzeErr -- Bad flag in manifest --> FixYAML["Fix invalid flag in /etc/kubernetes/manifests/kube-apiserver.yaml"]
    AnalyzeErr -- Expired PKI --> FixPKI["kubeadm certs renew all && systemctl restart kubelet"]
```
**Diagnostic Explanation:**  
"Connection refused" on port 6443 means no process is listening on the port. It is almost always caused by the `kube-apiserver` static pod crashing on startup due to etcd connection failure or bad arguments in `/etc/kubernetes/manifests/kube-apiserver.yaml`.

---

## 39. etcd Cluster Health, Cert Expiration & Quorum Restoration
```mermaid
flowchart TD
    ETCDAlert["etcd Health Alert / Timeout"] --> EnvSetup["Export Auth Environment Variables:<br/>ETCDCTL_API=3<br/>CACERT=/etc/kubernetes/pki/etcd/ca.crt<br/>CERT=/etc/kubernetes/pki/etcd/server.crt<br/>KEY=/etc/kubernetes/pki/etcd/server.key"]
    
    EnvSetup --> HealthCheck["Run: etcdctl --cacert=$CACERT --cert=$CERT --key=$KEY<br/>--endpoints=https://127.0.0.1:2379 endpoint health"]
    
    HealthCheck --> IsHealthy{"Is endpoint healthy?"}
    IsHealthy -- Yes --> CheckQuorum["Run: etcdctl member list -w table<br/>Verify all members have active peer status"]
    
    IsHealthy -- No (tls: bad certificate) --> CheckCerts["Check cert dates:<br/>kubeadm certs check-expiration"]
    CheckCerts --> RenewAll["kubeadm certs renew etcd-server etcd-peer"]
    
    IsHealthy -- No (connection refused) --> CheckDisk["Check if etcd disk is full (df -h /var/lib/etcd)"]
    CheckDisk -- Out of space --> ExpandDisk["Free disk space or restore from uncorrupted snapshot"]
```
**Diagnostic Explanation:**  
All `etcdctl` commands in Kubernetes require mTLS authentication using `/etc/kubernetes/pki/etcd/server.crt` and `server.key`. Always verify cluster health before attempting snapshot restores.

---

## 40. CoreDNS Resolution Failure & Loop Detection Diagnostic Tree
```mermaid
flowchart TD
    DNSFail["Pod cannot resolve service names (e.g. nslookup kubernetes.default)"] --> Step1["Check CoreDNS Pods:<br/>kubectl get pods -n kube-system -l k8s-app=kube-dns"]
    
    Step1 --> PodState{"CoreDNS Pods Running?"}
    PodState -- CrashLoopBackOff --> CheckLoop{"Are logs reporting 'Loop ... detected'?"}
    CheckLoop -- Yes --> FixLoop["Loop occurs when host /etc/resolv.conf points to 127.0.0.53 loopback.<br/>Update /etc/resolv.conf on host to upstream DNS (8.8.8.8) & restart CoreDNS"]
    
    PodState -- Pending --> CheckSched["Check node taints or missing CNI network plugin"]
    
    PodState -- Running --> Step2["Test DNS Service IP & Endpoints:<br/>kubectl get svc kube-dns -n kube-system<br/>kubectl get endpoints kube-dns -n kube-system"]
    
    Step2 --> EndpointsPresent{"Are endpoints populated?"}
    EndpointsPresent -- No --> CheckKubeProxy["kube-proxy issue or pod selector mismatch"]
    EndpointsPresent -- Yes --> Step3["Test Direct Query:<br/>kubectl run test-dns --rm -it --image=busybox:1.28 -- nslookup 10.96.0.1"]
    Step3 -- Success --> NetPolCheck["Inspect NetworkPolicies in application namespace blocking Port 53 UDP"]
```
**Diagnostic Explanation:**  
CoreDNS CrashLoopBackOff with `Loop detected` is a classic Linux systemd-resolved bug where CoreDNS forwards to local loopback and detects infinite recursion. The fix is updating host nameservers and editing the `Corefile` in `ConfigMap/coredns`.

---

## 41. Pod Stuck in Pending: Scheduling Failure Flowchart
```mermaid
flowchart TD
    PendingPod["Pod Stuck in Pending"] --> Describe["Run: kubectl describe pod <pod-name>"]
    Describe --> ReadEvents["Examine 'Events' Section at Bottom"]
    
    ReadEvents --> Reason{"Evaluate Scheduling Failure Reason"}
    
    Reason -- "0/N nodes available: Insufficient cpu / memory" --> Action1["Lower pod resource requests or scale cluster / node capacity"]
    Reason -- "node(s) had untolerated taint" --> Action2["Add matching toleration to pod spec or remove taint from node"]
    Reason -- "node(s) didn't match Pod's node affinity/selector" --> Action3["Correct labels on node (kubectl label node ...) or adjust pod spec"]
    Reason -- "0/N nodes available: node(s) had volume node-affinity conflict" --> Action4["PVC is bound to PV in a different availability zone than scheduled node"]
    Reason -- "No events recorded" --> Action5["kube-scheduler is dead or control plane disconnected"]
```
**Diagnostic Explanation:**  
If a Pod is `Pending`, the `kube-scheduler` has failed to bind it to a node. The `Events` table of `kubectl describe pod` lists the exact predicate that failed on every node.

---

## 42. Pod CrashLoopBackOff: Exit Code Analysis
```mermaid
flowchart TD
    Crash["Pod in CrashLoopBackOff"] --> GetCode["Run: kubectl describe pod <pod-name><br/>Inspect Last State: Exit Code"]
    
    GetCode --> ExitCode{"Analyze Exit Code"}
    
    ExitCode -- "Exit Code 0" --> Reason0["Container completed work and exited normally.<br/>Fix: Add long-running process or command (e.g. sleep infinity)"]
    ExitCode -- "Exit Code 1" --> Reason1["Application general error / syntax error.<br/>Check: kubectl logs <pod-name> --previous"]
    ExitCode -- "Exit Code 137" --> Reason137["OOMKilled (Out of Memory - 128 + 9 SIGKILL).<br/>Fix: Increase resources.limits.memory in pod spec"]
    ExitCode -- "Exit Code 139" --> Reason139["Segmentation Fault (SIGSEGV). Corrupted binary or library."]
    ExitCode -- "Exit Code 143" --> Reason143["Graceful Termination (128 + 15 SIGTERM). Stopped by orchestrator."]
    ExitCode -- "Exit Code 255" --> Reason255["Entrypoint or CMD command does not exist in container image."]
```
**Diagnostic Explanation:**  
Exit codes convey the precise termination cause:
* Exit Code 0: Task finished (Jobs use this; long-running services crash without a persistent foreground daemon).
* Exit Code 137: Memory limit exceeded (OOMKilled) or external `kill -9`.
* Always run `kubectl logs <pod-name> --previous` to see what printed immediately before the crash.

---

## 43. ImagePullBackOff & Private Registry Credential Failure
```mermaid
flowchart TD
    ImageErr["Pod in ImagePullBackOff / ErrImagePull"] --> Describe["Run: kubectl describe pod <pod-name>"]
    Describe --> CheckMsg{"Analyze Failed Event Message"}
    
    CheckMsg -- "manifest for <image>:<tag> not found" --> FixTag["Image tag does not exist. Correct tag in pod spec."]
    CheckMsg -- "repository does not exist or may require 'docker login'" --> FixAuth["Private Registry Authentication Required"]
    CheckMsg -- "dial tcp: lookup registry... i/o timeout" --> FixDNS["Worker node cannot resolve DNS or internet gateway down"]
    
    FixAuth --> CreateSecret["Create Docker Registry Secret:<br/>kubectl create secret docker-registry reg-cred<br/>--docker-server=... --docker-username=... --docker-password=..."]
    CreateSecret --> AttachSecret["Add imagePullSecrets to Pod Spec:<br/>spec.imagePullSecrets:<br/>  - name: reg-cred"]
    AttachSecret --> PodPulls["Kubelet Authenticates & Pulls Image"]
```
**Diagnostic Explanation:**  
`ImagePullBackOff` indicates that the container image cannot be downloaded. Ensure the image tag is exact and that `imagePullSecrets` are defined in the pod manifest or bound to the ServiceAccount.

---

## 44. CreateContainerConfigError & Missing ConfigMap/Secret
```mermaid
flowchart TD
    ConfigErr["Pod in CreateContainerConfigError"] --> Describe["Run: kubectl describe pod <pod-name>"]
    Describe --> InspectMsg{"Analyze Event Message"}
    
    InspectMsg -- "configmap '<name>' not found" --> CreateCM["Create missing ConfigMap in the SAME namespace as pod"]
    InspectMsg -- "secret '<name>' not found" --> CreateSec["Create missing Secret in the SAME namespace as pod"]
    InspectMsg -- "key '<key>' not found" --> AddKey["Add missing key-value pair to ConfigMap or Secret"]
    
    CreateCM --> KubeletAutoStarts["Kubelet automatically detects created resource and starts Pod"]
    CreateSec --> KubeletAutoStarts
    AddKey --> KubeletAutoStarts
```
**Diagnostic Explanation:**  
`CreateContainerConfigError` occurs before the container process is launched because a referenced `configMapKeyRef` or `secretKeyRef` does not exist in the pod's namespace. The pod transitions to `Running` automatically once the missing resource is created.

---

## 45. Service Connectivity Failure: ClusterIP Unreachable
```mermaid
flowchart TD
    SvcFail["Cannot reach Service ClusterIP (curl http://<cluster-ip>:<port>)"] --> Step1["1. Verify Endpoints:<br/>kubectl get endpoints <service-name>"]
    
    Step1 --> HasEndpoints{"Are Pod IPs listed under ENDPOINTS?"}
    HasEndpoints -- None / <none> --> CheckSelector["Compare Service spec.selector with Pod metadata.labels.<br/>Labels MUST match exactly!"]
    CheckSelector --> CheckProbes["Check if backing Pods are failing Readiness probes.<br/>Unready pods are stripped from endpoints!"]
    
    HasEndpoints -- Valid Pod IPs --> Step2["2. Test direct Pod IP connectivity:<br/>curl http://<pod-ip>:<targetPort>"]
    Step2 -- Direct Pod Fails --> CheckApp["App inside container not listening on expected port or bound only to 127.0.0.1"]
    
    Step2 -- Direct Pod Succeeds --> Step3["3. Inspect kube-proxy & iptables:<br/>kubectl get pods -n kube-system -l k8s-app=kube-proxy"]
    Step3 --> ProxyHealthy{"kube-proxy running on all nodes?"}
    ProxyHealthy -- No --> RestartProxy["Restart kube-proxy daemonset"]
    ProxyHealthy -- Yes --> NetPolCheck["Check for NetworkPolicies blocking ingress on target pod"]
```
**Diagnostic Explanation:**  
A healthy Service requires:
1. Exact label selector matching pod labels.
2. Backing pods passing readiness probes.
3. Target container listening on `0.0.0.0` (not `127.0.0.1`).
4. Active `kube-proxy` iptables/IPVS rules on every node.

---

## 46. NodePort Service Port Refused & Firewall Mismatch
```mermaid
flowchart TD
    NPFail["Cannot reach NodePort (curl http://<node-ip>:<nodePort>)"] --> Step1["Check Service Definition: kubectl get svc <name>"]
    Step1 --> VerifyType{"Is service type NodePort?"}
    VerifyType -- No --> FixType["Set spec.type: NodePort"]
    
    VerifyType -- Yes --> Step2["Identify allocated NodePort (Range 30000-32767)"]
    Step2 --> LocalTest["SSH into Node & test locally:<br/>curl http://127.0.0.1:<nodePort>"]
    
    LocalTest -- Works on Node --> ExternalFW["Local node port works -> External firewall / Cloud Security Group is blocking port"]
    LocalTest -- Connection Refused --> ProxyCheck["Check kube-proxy logs for iptables programming errors"]
```
**Diagnostic Explanation:**  
If a NodePort works via `curl http://127.0.0.1:<port>` on the node itself but fails from outside, the host firewall (`ufw`, `firewalld`) or cloud security group is blocking the port range 30000–32767.

---

## 47. Ingress 404 Not Found & 502/503 Bad Gateway
```mermaid
flowchart TD
    IngressErr["HTTP Error via Ingress"] --> Code{"HTTP Status Code?"}
    
    Code -- 404 Not Found --> CheckHostPath["Verify Ingress Host & Path:<br/>1. Does request Host header match spec.rules[].host?<br/>2. Does path match pathType (Prefix vs Exact)?<br/>3. Verify default backend configuration"]
    
    Code -- 502 Bad Gateway --> CheckTarget["Target backend Service / Pod is refusing connection.<br/>Verify container is listening on targetPort specified in Service"]
    
    Code -- 503 Service Unavailable --> CheckEndP["Service has 0 healthy endpoints.<br/>Check pod readiness probes and replica counts"]
```
**Diagnostic Explanation:**  
* **404 Not Found:** Ingress controller received the request, but no rule matched the `Host` or `Path`.
* **502 Bad Gateway:** Ingress routed traffic to the upstream pod, but the pod refused the TCP connection (port mismatch).
* **503 Service Unavailable:** No backing pods are in `Ready` state.

---

## 48. Gateway API HTTPRoute Detached & Unresolved ParentRef
```mermaid
flowchart TD
    RouteFail["HTTPRoute Not Serving Traffic"] --> InspectRoute["Run: kubectl describe httproute <name>"]
    InspectRoute --> CheckConditions["Check Status -> Conditions"]
    
    CheckConditions --> ParentRefCond{"Accepted: True & Programmed: True?"}
    
    ParentRefCond -- "Accepted: False / ResolvedRefs: False" --> RefIssue{"Why is ParentRef Rejected?"}
    RefIssue -- "Gateway not found" --> CheckGWName["Verify spec.parentRefs[].name matches an existing Gateway"]
    RefIssue -- "Cross-namespace reference not allowed" --> ReferenceGrant["Create ReferenceGrant in Gateway namespace to allow cross-namespace routes"]
    RefIssue -- "SectionName / Port mismatch" --> FixPort["Ensure HTTPRoute parentRef sectionName matches listener name in Gateway"]
    
    ParentRefCond -- "Accepted: True" --> BackendCheck["Verify backendRefs point to valid Services with endpoints"]
```
**Diagnostic Explanation:**  
Gateway API routes decouple routing from gateways. An `HTTPRoute` must be accepted by the parent `Gateway`. If they reside in different namespaces, a `ReferenceGrant` resource is mandatory for security authorization.

---

## 49. NetworkPolicy Dropped Packet Triage
```mermaid
flowchart TD
    NetPolIssue["Pods Cannot Communicate / Timeouts Occur"] --> CheckCNI["1. Verify CNI Supports NetworkPolicies<br/>(Calico, Cilium, Weave support NetPol; Flannel DOES NOT without Canal)"]
    
    CheckCNI -- Flannel Only --> UpgradeCNI["Install Calico or Canal to enforce NetworkPolicies"]
    CheckCNI -- Supported --> Step2["2. Inspect Policies in Namespace:<br/>kubectl get netpol -n <namespace>"]
    
    Step2 --> EvaluateRules["Evaluate podSelector and policyTypes:<br/>Does any NetPol select the target Pod?"]
    EvaluateRules -- Selected --> CheckDefaultDeny["Selected pod is now in Default-Deny mode for that traffic direction"]
    
    CheckDefaultDeny --> VerifyWhitelist["Verify Ingress/Egress Whitelist Rules:<br/>1. podSelector matches client?<br/>2. namespaceSelector matches client namespace?<br/>3. ports[].port matches target port?"]
    VerifyWhitelist -- Mismatch --> FixNetPol["Update NetworkPolicy YAML to permit required traffic"]
```
**Diagnostic Explanation:**  
NetworkPolicies are silent drop filters. If `flannel` is used alone, policies are silently ignored without error. When debugging, test reachability with `kubectl exec -it <pod> -- nc -zvw3 <ip> <port>`.

---

## 50. PersistentVolume & Claim Stuck in Pending / Binding Failure
```mermaid
flowchart TD
    PVCFail["PVC Stuck in Pending"] --> DescribePVC["Run: kubectl describe pvc <pvc-name>"]
    DescribePVC --> CheckEvents["Read Events Section"]
    
    CheckEvents --> EventMsg{"Analyze Event Message"}
    
    EventMsg -- "waiting for first consumer to be created" --> NormalBehavior["StorageClass uses volumeBindingMode: WaitForFirstConsumer.<br/>PVC will remain Pending until a Pod using it is scheduled!"]
    
    EventMsg -- "no persistent volumes available" --> StaticIssue["Static Provisioning: No existing PV matches size, accessModes, or storageClassName"]
    StaticIssue --> FixPV["Create PV with capacity >= PVC request and identical accessModes"]
    
    EventMsg -- "provisioning failed" --> DynamicIssue["Dynamic Provisioning: CSI driver error or invalid StorageClass parameters"]
```
**Diagnostic Explanation:**  
`volumeBindingMode: WaitForFirstConsumer` is standard practice. It delays volume creation until the Pod is placed on a node, ensuring the storage volume is provisioned in the same availability zone as the node.

---

## 51. Volume Mount Failure: Multi-Attach Error & Node Lock
```mermaid
flowchart TD
    AttachFail["Pod in ContainerCreating: Volume Attach Failed"] --> Describe["Run: kubectl describe pod <pod-name>"]
    Describe --> ReadErr{"Multi-Attach error for volume ... Volume is already exclusively attached to one node"}
    
    ReadErr --> Cause["Previous node did not release disk lock during sudden crash / cordon"]
    Cause --> Step1["1. Identify old node holding attachment:<br/>kubectl get volumeattachments"]
    Step1 --> Step2["2. Delete orphaned VolumeAttachment object:<br/>kubectl delete volumeattachment <attachment-id>"]
    Step2 --> Step3["3. Alternatively, force delete terminated pod on old node:<br/>kubectl delete pod <old-pod> --force --grace-period=0"]
    Step3 --> VolumeMounts["Kubelet attaches volume to new node & starts Pod"]
```
**Diagnostic Explanation:**  
Cloud block storage (EBS, GPD, Cinder) can only attach to one VM at a time (`ReadWriteOnce`). When a node crashes, the `csi-attacher` waits for safe detachment before allowing a new host to mount the volume.

---

## 52. Dynamic Storage Provisioner Failure & StorageClass Tree
```mermaid
flowchart TD
    DynFail["Dynamic PVC Provisioning Fails"] --> SC["Inspect StorageClass: kubectl get sc <name> -o yaml"]
    SC --> CheckDriver["Check provisioner field (e.g. ebs.csi.aws.com, standard)"]
    
    CheckDriver --> CheckDriverPods["Verify CSI Controller Pods are Running:<br/>kubectl get pods -A | grep csi"]
    CheckDriverPods -- CSI Pods Down --> FixCSI["Restart CSI controller deployment"]
    CheckDriverPods -- Running --> CheckLogs["Inspect CSI provisioner logs:<br/>kubectl logs -n kube-system <csi-provisioner-pod>"]
    CheckLogs --> IAMAuth["Cloud IAM permission denied / invalid disk type parameter in StorageClass"]
```
**Diagnostic Explanation:**  
Dynamic volume provisioning depends on the in-cluster CSI storage controller. If PVC provisioning fails without events, inspect the `csi-provisioner` container logs in `kube-system`.

---

## 53. RBAC Unauthorized (403 Forbidden) Audit
```mermaid
flowchart TD
    RBACFail["API Error: 403 Forbidden: User 'X' cannot 'verb' 'resource' in namespace 'Y'"] --> Step1["Test permissions with auth can-i:<br/>kubectl auth can-i <verb> <resource> --as=<user> -n <namespace>"]
    
    Step1 --> CheckRole["Inspect Role / ClusterRole:<br/>Does any rule grant verb on resource?"]
    CheckRole -- Missing Verb/Resource --> UpdateRole["Add required apiGroups, resources, and verbs to Role"]
    
    CheckRole -- Rule Exists --> CheckBinding["Inspect RoleBinding / ClusterRoleBinding"]
    CheckBinding --> CheckSubject{"Does subjects[] match User/Group/ServiceAccount exactly?"}
    CheckBinding -- Namespace Mismatch --> FixBinding["Ensure ServiceAccount namespace in subjects matches its true namespace"]
    CheckBinding -- Typo in Name --> FixSubject["Correct user/group/serviceaccount name"]
```
**Diagnostic Explanation:**  
Always use `kubectl auth can-i <verb> <resource> --as=<user> -n <ns>` to verify permissions without switching contexts. Common errors include forgetting `apiGroups` (e.g., `apps` for deployments) or referencing a ServiceAccount in the wrong namespace in `subjects`.

---

## 54. Certificate Expiration & kubeadm certs Renewal
```mermaid
flowchart TD
    CertAlert["Cluster Down / Cert Expiration Warning"] --> CheckDates["Run: kubeadm certs check-expiration"]
    CheckDates --> ScanTable["Inspect Expiration Date for all Control Plane Certificates"]
    
    ScanTable --> Expired{"Any Certificate Expired?"}
    Expired -- Yes --> RenewCommand["Run: kubeadm certs renew all"]
    RenewCommand --> RestartPods["Restart Control Plane Static Pods:<br/>Move manifests temporarily out of /etc/kubernetes/manifests/ and back<br/>or: kill -s SIGHUP $(pgrep kube-apiserver)"]
    RestartPods --> UpdateAdminConf["Update local admin.conf:<br/>cp /etc/kubernetes/admin.conf ~/.kube/config"]
    UpdateAdminConf --> Verify["Verify kubectl get nodes succeeds"]
```
**Diagnostic Explanation:**  
Kubernetes control plane certificates created by `kubeadm` expire after 1 year. The renewal process takes less than 2 minutes using `kubeadm certs renew all`, followed by reloading the static pods.

---

## 55. Cluster Upgrade Failure & Node Version Skew Recovery
```mermaid
flowchart TD
    UpgradeFail["kubeadm upgrade plan or apply fails"] --> CheckError{"Analyze Upgrade Error"}
    
    CheckError -- "version skew violation" --> SkewRule["Kubernetes requires upgrading minor versions sequentially (e.g. 1.30 -> 1.31 -> 1.32). NEVER skip minor versions!"]
    
    CheckError -- "control plane not ready" --> HealthCheck["Ensure all nodes are Ready and etcd is healthy before starting upgrade"]
    
    CheckError -- "apt-get / package hold error" --> Unhold["Unhold packages: sudo apt-mark unhold kubeadm kubelet kubectl<br/>Install target version: sudo apt-get install -y kubeadm=1.31.2-1.1<br/>Hold packages: sudo apt-mark hold kubeadm"]
    
    Unhold --> Reapply["Run: sudo kubeadm upgrade apply v1.31.2"]
```
**Diagnostic Explanation:**  
Upgrades must follow strict sequence: Control Plane first (`kubeadm upgrade apply`, then upgrade `kubelet`), followed by worker nodes one-by-one (`kubeadm upgrade node`, drain, upgrade `kubelet`, uncordon).

---

## 56. Worker Node Join Failure: Token & Discovery Timeout
```mermaid
flowchart TD
    JoinFail["kubeadm join times out or throws token error"] --> CheckMsg{"Analyze Join Error"}
    
    CheckMsg -- "token has expired" --> CreateToken["Generate new join token on Control Plane:<br/>kubeadm token create --print-join-command"]
    
    CheckMsg -- "discovery token CA hash mismatch" --> GetHash["Compute correct CA hash on Control Plane:<br/>openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt |<br/>openssl rsa -pubin -outform der 2>/dev/null |<br/>openssl dgst -sha256 -hex | sed 's/^.* //'"]
    
    CheckMsg -- "connection refused / timeout to 6443" --> TestNet["Test network connectivity from worker to control plane:<br/>nc -zvw3 <control-plane-ip> 6443"]
    
    CreateToken --> RunJoin["Execute corrected kubeadm join command on worker"]
```
**Diagnostic Explanation:**  
Bootstrap tokens expire after 24 hours. If joining a worker node after token expiration, generate a fresh join command using `kubeadm token create --print-join-command`.

---

## 57. High CPU & Memory Throttling: CFS Quota Investigation
```mermaid
flowchart TD
    Throttle["Application Latency Spikes / High CPU Alarm"] --> Step1["Check Pod Resource Metrics:<br/>kubectl top pods -n <namespace>"]
    Step1 --> Step2["Check Node Resource Metrics:<br/>kubectl top nodes"]
    
    Step2 --> CheckCgroup["SSH to Worker Node & Inspect CFS Throttling:<br/>cat /sys/fs/cgroup/cpu/kubepods/.../cpu.stat"]
    CheckCgroup --> MetricEval{"nr_throttled > 0 and throttled_time is high?"}
    
    MetricEval -- Yes --> FixLimit["Pod is hitting CPU Limits ceiling.<br/>Increase resources.limits.cpu or remove CPU limit (best practice for latency-sensitive apps)"]
    MetricEval -- No --> AppProfile["Application thread contention or external bottleneck"]
```
**Diagnostic Explanation:**  
CPU throttling occurs when a container attempts to burst beyond its CFS quota. Removing or raising CPU limits allows workloads to utilize idle CPU cycles without degrading latency.

---

## 58. DiskPressure & Node Eviction: Ephemeral Storage Cleanup
```mermaid
flowchart TD
    DiskPress["Node Condition: DiskPressure = True<br/>Pods Evicted with The node was low on resource: ephemeral-storage"] --> SSH["SSH to Affected Node"]
    SSH --> CheckDisk["Check Disk Usage: df -h /"]
    
    CheckDisk --> Step1["1. Prune unused images and exited containers:<br/>crictl rmi --prune"]
    Step1 --> Step2["2. Clean up large container logs:<br/>truncate -s 0 /var/log/pods/*/*/*.log"]
    Step2 --> Step3["3. Inspect /var/lib/kubelet for orphaned pod directories"]
    
    Step3 --> Recover["Disk utilization drops below threshold (85%) -> Node DiskPressure clears to False"]
```
**Diagnostic Explanation:**  
When node disk utilization exceeds 85%, kubelet initiates hard eviction of Pods consuming excessive ephemeral storage. Clearing old container images with `crictl rmi --prune` immediately restores disk headroom.

---

## 59. PID Pressure & Kernel Process Exhaustion
```mermaid
flowchart TD
    PIDPress["Node Condition: PIDPressure = True"] --> CheckPIDs["SSH to Node & Check Process Count:<br/>ps -eLf | wc -l<br/>sysctl kernel.pid_max"]
    
    CheckPIDs --> FindCulprit["Identify container leaking threads/processes:<br/>ps aux --sort -nlwp | head -n 20"]
    FindCulprit --> KillProcess["Drain node & restart runaway container"]
    
    KillProcess --> EnforceLimit["Add Pod PID Limits in kubelet configuration:<br/>podPidsLimit: 4096 in /var/lib/kubelet/config.yaml"]
```
**Diagnostic Explanation:**  
A fork-bomb or process leak inside a container can exhaust the Linux kernel PID table, causing the entire host to freeze. Modern kubelets enforce `podPidsLimit` to isolate process leaks to the offending container.

---

## 60. StatefulSet Out-of-Order Pod Startup & PVC Orphan Cleanup
```mermaid
flowchart TD
    StatefulFail["StatefulSet pod db-1 will not start"] --> Step1["Check previous ordinal db-0:<br/>kubectl get pod db-0"]
    Step1 --> IsReady{"Is db-0 in Running & Ready state?"}
    
    IsReady -- No --> FixDB0["StatefulSets require sequential startup.<br/>Fix db-0 before db-1 can be scheduled!"]
    
    IsReady -- Yes --> CheckPVC["Check PVC: kubectl get pvc data-db-1"]
    CheckPVC --> PVCMissing{"Does PVC exist?"}
    PVCMissing -- No --> RecreatePVC["Ensure volumeClaimTemplates is correctly defined in StatefulSet spec"]
```
**Diagnostic Explanation:**  
By default (`podManagementPolicy: OrderedReady`), StatefulSets require pod $N-1$ to pass all readiness checks before pod $N$ is created. If pod 0 is crashing, pod 1 will never start.

---

## 61. Helm Release Stuck in Pending-Install / Pending-Upgrade
```mermaid
flowchart TD
    HelmStuck["Helm command fails: release X has another operation in progress"] --> ListReleases["Run: helm list -a"]
    ListReleases --> CheckStatus{"Status: pending-install or pending-upgrade?"}
    
    CheckStatus -- Yes --> Step1["Identify Helm Secret storing release state:<br/>kubectl get secret -l owner=helm,name=<release-name>"]
    Step1 --> Step2["Delete the pending secret version:<br/>kubectl delete secret sh.helm.release.v1.<name>.v<latest-rev>"]
    Step2 --> Step3["Re-run helm rollback or helm upgrade"]
```
**Diagnostic Explanation:**  
Helm 3 stores release state in Kubernetes Secrets within the release namespace. When a deployment is interrupted, the release state gets stuck in `pending-upgrade`. Deleting the hung secret releases the state lock.

---

## 62. Custom Resource Definition (CRD) Validation & Operator Errors
```mermaid
flowchart TD
    CRDFail["Error creating Custom Resource: validation failure"] --> Step1["Inspect CRD Schema: kubectl describe crd <crd-name>"]
    Step1 --> CheckVersion["Verify apiVersion and kind match CRD spec.group and spec.names"]
    
    CheckVersion --> Step2["Inspect Operator Logs:<br/>kubectl logs -n <operator-ns> -l app=<operator-name>"]
    Step2 --> OperatorCrash{"Is operator reconciler throwing panic / errors?"}
    OperatorCrash -- Yes --> RBACCheck["Verify Operator ServiceAccount has RBAC rights to manage the Custom Resource"]
```
**Diagnostic Explanation:**  
Custom Resources require valid OpenAPI v3 schemas in the CRD definition. If a valid CR is created but never reconciled, inspect the operator pod logs for RBAC authorization failures.

---

## 63. DaemonSet Pod Missing on Specific Worker Node
```mermaid
flowchart TD
    DSMissing["DaemonSet pod not running on worker-02"] --> DescribeNode["Inspect Node: kubectl describe node worker-02"]
    DescribeNode --> CheckTaints["Check Taints on worker-02"]
    
    CheckTaints --> HasCustomTaint{"Does node have custom taints?"}
    HasCustomTaint -- Yes --> AddToleration["Add matching toleration to DaemonSet spec.template.spec.tolerations"]
    
    HasCustomTaint -- No --> CheckSelector["Check nodeSelector & nodeAffinity in DaemonSet spec"]
    CheckSelector --> LabelMatch{"Does worker-02 have required labels?"}
    LabelMatch -- No --> LabelNode["Label node: kubectl label node worker-02 <key>=<value>"]
    LabelMatch -- Yes --> CheckResources["Check if worker-02 is out of CPU or memory"]
```
**Diagnostic Explanation:**  
DaemonSet pods automatically tolerate standard node conditions, but custom operational taints (e.g., `gpu=true:NoSchedule`) or specific `nodeSelectors` will prevent DaemonSet scheduling unless declared.

---

## 64. Master Exam Day Time-Management & Emergency Task Rescue
```mermaid
flowchart TD
    ExamTask["New CKA Exam Task Presented"] --> Step1["1. IMMEDIATELY SWITCH CONTEXT:<br/>kubectl config use-context <context-name>"]
    Step1 --> Step2["2. Set Namespace Variable:<br/>NS=<task-namespace> (or append -n $NS to all commands)"]
    
    Step2 --> AssessTime{"Can this task be completed in under 6 minutes?"}
    AssessTime -- No / Complex & Confusing --> FlagTask["FLAG TASK FOR REVIEW & MOVE TO NEXT TASK IMMEDIATELY"]
    
    AssessTime -- Yes --> ImperativeFirst["Use Imperative Generators:<br/>kubectl create / run ... --dry-run=client -o yaml > task.yaml"]
    ImperativeFirst --> ApplyTask["vim task.yaml && kubectl apply -f task.yaml"]
    ApplyTask --> FastVerify["Run Quick Verification:<br/>kubectl get pod/svc -n $NS && curl test"]
    FastVerify --> PassNext["Task Complete -> Proceed to Next Task"]
```
**Diagnostic Explanation:**  
The golden rule of the CKA exam: **Never spend more than 8 minutes on a single task on the first pass**. If a task is unclear, flag it, skip it, and capture all easy points across the remaining tasks before returning.
