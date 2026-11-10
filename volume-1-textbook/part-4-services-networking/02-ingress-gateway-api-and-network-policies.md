# VOLUME I: THE COMPLETE CKA TEXTBOOK
# PART IV: SERVICES AND NETWORKING
## CHAPTERS 46–49: INGRESS, GATEWAY API, NETWORKPOLICIES & NETWORK TROUBLESHOOTING

---

### CHAPTER 46: INGRESS AND INGRESS CONTROLLERS

#### 1. Ingress Resource Architecture
An Ingress resource (`networking.k8s.io/v1`) defines routing rules from outside the cluster to internal Services. An **Ingress Controller** (e.g., ingress-nginx) must be installed to evaluate and enforce these rules.

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: corporate-ingress
  namespace: web
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
  - host: store.example.com
    http:
      paths:
      - path: /products
        pathType: Prefix
        backend:
          service:
            name: product-service
            port:
              number: 80
      - path: /cart
        pathType: Prefix
        backend:
          service:
            name: cart-service
            port:
              number: 80
```

---

### CHAPTER 47: GATEWAY API DEEP DIVE

#### 1. Why Gateway API Replaces Ingress
Ingress suffered from monolithic configuration where cluster administrators and application teams collided in a single resource. Gateway API decouples routing into distinct roles:
1. **Infrastructure Provider:** Defines `GatewayClass`.
2. **Cluster Operator:** Deploys `Gateway` (declares IP addresses, ports, and TLS certs).
3. **Application Developer:** Attaches `HTTPRoute` or `GRPCRoute` (defines paths, weights, and header rewrites).

#### 2. Complete Gateway API Architecture & Manifests

**Step 1: Gateway Resource (Cluster Operator)**
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: prod-gateway
  namespace: gateway-infra
spec:
  gatewayClassName: standard-gateway
  listeners:
  - name: http-listener
    protocol: HTTP
    port: 80
    allowedRoutes:
      namespaces:
        from: All
```

**Step 2: Advanced HTTPRoute with Canary Traffic Splitting (Developer)**
```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: checkout-route
  namespace: store
spec:
  parentRefs:
  - name: prod-gateway
    namespace: gateway-infra
  hostnames:
  - "checkout.example.com"
  rules:
  # Rule 1: Header-based routing for beta testers
  - matches:
    - headers:
      - name: X-Beta-Tester
        value: "true"
    backendRefs:
    - name: checkout-v2-canary
      port: 8080
  # Rule 2: 90/10 Canary traffic split for regular users
  - matches:
    - path:
        type: PathPrefix
        value: /checkout
    backendRefs:
    - name: checkout-v1-stable
      port: 8080
      weight: 90
    - name: checkout-v2-canary
      port: 8080
      weight: 10
```

#### 3. Cross-Namespace Authorization via ReferenceGrant
When an `HTTPRoute` references a `Gateway` or `Service` in a different namespace, a `ReferenceGrant` must explicitly allow the reference:
```yaml
apiVersion: gateway.networking.k8s.io/v1beta1
kind: ReferenceGrant
metadata:
  name: allow-store-to-gateway
  namespace: gateway-infra
spec:
  from:
  - group: gateway.networking.k8s.io
    kind: HTTPRoute
    namespace: store
  to:
  - group: gateway.networking.k8s.io
    kind: Gateway
```

---

### CHAPTER 48: NETWORKPOLICIES

#### 1. The Default-Deny Security Model
By default, all pods in Kubernetes can receive and send traffic without restriction. Applying a `NetworkPolicy` isolates matching pods, switching them to default-deny.

**Default-Deny All Ingress Traffic:**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: secure-zone
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

**Fine-Grained 3-Tier NetworkPolicy:**
Allow ingress to `db` pods on port 5432 *only* from `backend` pods in namespace `api`:
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-backend-to-db
  namespace: data
spec:
  podSelector:
    matchLabels:
      role: database
  policyTypes:
  - Ingress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          environment: production
      podSelector:
        matchLabels:
          app: backend
    ports:
    - protocol: TCP
      port: 5432
```
*CRITICAL SYNTAX NOTE:* In the `from` list, separating `namespaceSelector` and `podSelector` with a hyphen (`-`) creates an **OR** relationship. Omitting the hyphen between them creates an **AND** relationship!

---

### CHAPTER 49: NETWORK TROUBLESHOOTING RUNBOOK

```bash
# 1. Test intra-pod TCP connectivity
kubectl run net-probe --rm -it --image=nicolaka/netshoot -- nc -zvw3 10.244.1.20 80

# 2. Inspect host iptables forwarding rules for drops
sudo iptables -L FORWARD -n -v | grep DROP

# 3. Check CNI IP allocation leaks
cat /var/lib/cni/networks/k8s-pod-network/*

# 4. Verify Gateway API route status
kubectl describe httproute checkout-route -n store
```
