# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART IV: SERVICES AND NETWORKING
## CHAPTERS 39–45: NETWORKING FUNDAMENTALS, CNI, SERVICES, COREDNS & ENDPOINTSLICES

---

### CHAPTER 39–41: KUBERNETES NETWORKING & CNI ARCHITECTURE

#### 1. Container Network Interface (CNI)
CNI is a standard specification defining plugins to configure network interfaces when containers are started and destroyed.
* Located at: `/opt/cni/bin/` (Executables: `bridge`, `loopback`, `host-local`, `calico`, `flannel`).
* Network configurations located at: `/etc/cni/net.d/` (Evaluated alphabetically in lexicographical order).

#### 2. Pod-to-Pod Communication Across Nodes
1. Pod A (`10.244.1.5`) sends a packet to Pod B (`10.244.2.10`).
2. The packet traverses `veth0` into the host Linux bridge (`cbr0`).
3. The host routing table directs packets destined for `10.244.2.0/24` to the CNI overlay device (e.g., `flannel.1` or `calico-tun`).
4. The overlay interface encapsulates the inner IP packet inside an outer UDP packet (Port 4789/8472 VXLAN) addressed to Worker Node 2 (`192.168.1.20`).
5. Worker Node 2 decapsulates the UDP packet and delivers the original IP packet to Pod B via its local bridge.

---

### CHAPTER 42 & 43: KUBERNETES SERVICE TYPES & PACKET NAT

#### 1. Service Types Compared
* **ClusterIP (Default):** Allocates a virtual cluster-internal IP reachable only from within the cluster.
* **NodePort:** Allocates a high-range static port (30000–32767) on every node in the cluster. Traffic sent to `<NodeIP>:<NodePort>` is forwarded to the Service.
* **LoadBalancer:** Automatically provisions a cloud load balancer (e.g., AWS NLB, GCP Network Load Balancer) that routes to the NodePort.
* **ExternalName:** Maps the Service to a DNS CNAME record (e.g., `my-db.external-service.com`) without proxying.

#### 2. Service YAML Definition
```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: production
spec:
  type: ClusterIP
  selector:
    app: backend
  ports:
  - name: http
    port: 80         # Port exposed on the ClusterIP
    targetPort: 8080 # Port listening on the container
```

---

### CHAPTER 44 & 45: COREDNS DISCOVERY & ENDPOINTSLICES

#### 1. DNS Resolution Architecture
CoreDNS operates as a redundant, scalable deployment in `kube-system`. Its service IP is typically `10.96.0.10`.
* Standard FQDN Structure: `<service-name>.<namespace>.svc.<cluster-domain>`
* Example: `backend-service.production.svc.cluster.local`
* Headless Service Pod FQDN: `<pod-name>.<headless-svc>.<namespace>.svc.<cluster-domain>`

#### 2. Customizing CoreDNS via ConfigMap
To add custom DNS upstreams or stub zones, edit `ConfigMap/coredns`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: coredns
  namespace: kube-system
data:
  Corefile: |
    .:53 {
        errors
        health {
           lameduck 5s
        }
        ready
        kubernetes cluster.local in-addr.arpa ip6.arpa {
           pods insecure
           fallthrough in-addr.arpa ip6.arpa
           ttl 30
        }
        forward . 8.8.8.8 1.1.1.1
        cache 30
        loop
        reload
        loadbalance
    }
```

#### 3. EndpointSlices vs. Endpoints
Legacy `Endpoints` stored all IP addresses in a single object. Modern Kubernetes utilizes `EndpointSlices` (`discovery.k8s.io/v1`), partitioning endpoint lists into scalable subsets of up to 100 endpoints per slice.
```bash
# Query EndpointSlices for a specific service
kubectl get endpointslices -l kubernetes.io/service-name=backend-service
```
