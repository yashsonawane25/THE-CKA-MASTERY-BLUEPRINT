# VOLUME II: THE CKA PRACTICAL WORKBOOK
# DOMAIN 3: SERVICES & NETWORKING (LABS 31–45)

---

## LAB 31: ClusterIP Service Creation and Endpoint Verification
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Create a ClusterIP Service to expose a backend Deployment and verify automatic endpoint generation.
- **Prerequisites:** Running cluster.
- **Cluster Environment:** Standard Kubernetes cluster.
- **Initial State:** Clean namespace `networking-lab`.
- **Task Description:**
  1. Create namespace `networking-lab`.
  2. Deploy a Deployment `backend-api` with 3 replicas of `nginx:1.27` in `networking-lab`.
  3. Create a ClusterIP Service named `backend-svc` exposing port 80 targeting containerPort 80.
  4. Inspect the Service endpoints and confirm all 3 Pod IPs appear in the endpoints list.
  5. Test internal connectivity to `backend-svc.networking-lab.svc.cluster.local` using a curl test pod.
- **Constraints:** Service must be of type `ClusterIP`.
- **Hints:** Use `kubectl expose deployment backend-api --name=backend-svc --port=80 --target-port=80 -n networking-lab`.
- **Expected Result:** `backend-svc` resolves internally and load balances across all 3 backend pods.
- **Verification:**
  ```bash
  kubectl get endpoints backend-svc -n networking-lab
  kubectl run curl-test --image=curlimages/curl --rm -it --restart=Never -n networking-lab -- http://backend-svc
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace networking-lab
  kubectl create deployment backend-api --image=nginx:1.27 --replicas=3 -n networking-lab
  kubectl expose deployment backend-api --name=backend-svc --port=80 --target-port=80 -n networking-lab
  ```
- **Common Mistakes:** Typo in the selector labels causing empty endpoints (`<none>`).
- **Troubleshooting:** Compare `kubectl get svc backend-svc -n networking-lab -o yaml` with `kubectl get pods -n networking-lab --show-labels`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace networking-lab
  ```

---

## LAB 32: NodePort Service Configuration on Static Ports
- **Difficulty:** Beginner
- **Estimated Duration:** 8 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Expose an application externally on a specific host NodePort within the range 30000–32767.
- **Prerequisites:** Multi-node or local cluster with port forwarding.
- **Cluster Environment:** Any cluster.
- **Initial State:** Deployment `web-portal` exists in `default`.
- **Task Description:**
  1. Create Deployment `web-portal` with 2 replicas of `nginx:1.27`.
  2. Create a NodePort Service named `web-portal-external` with:
     - `port: 80`
     - `targetPort: 80`
     - `nodePort: 32080`
  3. Query the NodePort on the worker node's IP using `curl` to verify accessibility.
- **Constraints:** `nodePort` must be explicitly set to 32080.
- **Hints:** NodePort range is 30000–32767.
- **Expected Result:** HTTP 200 OK received when curling `http://<node-ip>:32080`.
- **Verification:**
  ```bash
  NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}')
  curl -I http://${NODE_IP}:32080
  ```
- **Full Solution:**
  ```yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: web-portal
  spec:
    replicas: 2
    selector:
      matchLabels:
        app: web-portal
    template:
      metadata:
        labels:
          app: web-portal
      spec:
        containers:
        - name: nginx
          image: nginx:1.27
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: web-portal-external
  spec:
    type: NodePort
    selector:
      app: web-portal
    ports:
    - port: 80
      targetPort: 80
      nodePort: 32080
  ```
  ```bash
  kubectl apply -f nodeport-lab.yaml
  ```
- **Common Mistakes:** Specifying a `nodePort` below 30000 or above 32767, which fails API validation.
- **Troubleshooting:** Check if host firewall (ufw or iptables) is blocking traffic on port 32080.
- **Cleanup Instructions:**
  ```bash
  kubectl delete -f nodeport-lab.yaml
  ```

---

## LAB 33: Headless Service for Stateful Database Peer Discovery
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Create a Headless Service (`clusterIP: None`) and observe DNS A-record generation for individual StatefulSet Pods.
- **Prerequisites:** StatefulSet running.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `cluster-db`.
- **Task Description:**
  1. Create namespace `cluster-db`.
  2. Create a headless Service `db-discovery` with `clusterIP: None` in `cluster-db` targeting `role: datastore`.
  3. Deploy a StatefulSet `datastore` with 2 replicas using `redis:7.2-alpine` attached to `serviceName: db-discovery`.
  4. Launch an interactive test pod with `nslookup` to verify that `db-discovery.cluster-db.svc.cluster.local` returns direct IPs for both `datastore-0` and `datastore-1`.
  5. Verify direct lookup for `datastore-0.db-discovery.cluster-db.svc.cluster.local`.
- **Constraints:** `spec.clusterIP` must be set to `None`.
- **Hints:** Headless services bypass kube-proxy load balancing entirely.
- **Expected Result:** DNS returns individual pod IP records.
- **Verification:**
  ```bash
  kubectl run dns-test --image=busybox:1.36 --rm -it --restart=Never -n cluster-db -- nslookup db-discovery
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: cluster-db
  ---
  apiVersion: v1
  kind: Service
  metadata:
    name: db-discovery
    namespace: cluster-db
  spec:
    clusterIP: None
    selector:
      role: datastore
    ports:
    - port: 6379
      name: redis
  ---
  apiVersion: apps/v1
  kind: StatefulSet
  metadata:
    name: datastore
    namespace: cluster-db
  spec:
    serviceName: db-discovery
    replicas: 2
    selector:
      matchLabels:
        role: datastore
    template:
      metadata:
        labels:
          role: datastore
      spec:
        containers:
        - name: redis
          image: redis:7.2-alpine
  ```
  ```bash
  kubectl apply -f headless-db.yaml
  ```
- **Common Mistakes:** Missing `serviceName` in StatefulSet spec, which breaks individual pod DNS records.
- **Troubleshooting:** Run `kubectl get endpoints db-discovery -n cluster-db` to verify registered endpoints.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace cluster-db
  ```

---

## LAB 34: EndpointSlice Inspection and Manual Endpoint Injection
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Create a Service without selectors and manually attach an external IP address via `Endpoints` and `EndpointSlices`.
- **Prerequisites:** Working cluster.
- **Cluster Environment:** Any cluster.
- **Initial State:** External legacy database at `192.168.1.50:3306`.
- **Task Description:**
  1. Create a Service named `external-mysql` with no `spec.selector` on port 3306 targeting port 3306.
  2. Create an `Endpoints` object with the exact same name `external-mysql` pointing to IP `192.168.1.50:3306`.
  3. Verify that Kubernetes automatically generates a matching `EndpointSlice` for the Service.
- **Constraints:** Do not use `spec.selector` on the Service.
- **Hints:** When a Service omits `selector`, Kubernetes does not create endpoints automatically, allowing manual declaration.
- **Expected Result:** `kubectl describe svc external-mysql` lists `Endpoints: 192.168.1.50:3306`.
- **Verification:**
  ```bash
  kubectl get endpoints external-mysql
  kubectl get endpointslices -l kubernetes.io/service-name=external-mysql
  ```
- **Full Solution:**
  ```yaml
  apiVersion: v1
  kind: Service
  metadata:
    name: external-mysql
  spec:
    ports:
    - port: 3306
      targetPort: 3306
  ---
  apiVersion: v1
  kind: Endpoints
  metadata:
    name: external-mysql
  subsets:
  - addresses:
    - ip: 192.168.1.50
    ports:
    - port: 3306
  ```
  ```bash
  kubectl apply -f manual-endpoints.yaml
  ```
- **Common Mistakes:** Naming the `Endpoints` object differently than the `Service` object. They must match exactly!
- **Troubleshooting:** Run `kubectl describe endpoints external-mysql` to check address format.
- **Cleanup Instructions:**
  ```bash
  kubectl delete svc external-mysql
  kubectl delete endpoints external-mysql
  ```

---

## LAB 35: CoreDNS Resolution Triage and Custom Upstream Forwarding
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Modify the CoreDNS ConfigMap `Corefile` to add custom upstream DNS forwarders and verify cache behavior.
- **Prerequisites:** Cluster admin access.
- **Cluster Environment:** Any cluster.
- **Initial State:** Default CoreDNS ConfigMap in `kube-system`.
- **Task Description:**
  1. Backup the existing `coredns` ConfigMap in `kube-system` to `/tmp/coredns-backup.yaml`.
  2. Edit `coredns` ConfigMap to configure upstream DNS forwarder `forward . 8.8.8.8 1.1.1.1`.
  3. Restart CoreDNS pods to pick up the updated Corefile.
  4. Launch a test pod and verify resolution of an external domain (e.g., `google.com`) and internal Service (`kubernetes.default`).
- **Constraints:** Do not corrupt the Corefile syntax.
- **Hints:** CoreDNS automatically reloads within 30 seconds, or restart pods with `kubectl rollout restart deployment coredns -n kube-system`.
- **Expected Result:** DNS resolution succeeds for both internal and external queries.
- **Verification:**
  ```bash
  kubectl run dns-check --image=busybox:1.36 --rm -it --restart=Never -- nslookup google.com
  kubectl run dns-check --image=busybox:1.36 --rm -it --restart=Never -- nslookup kubernetes.default
  ```
- **Full Solution:**
  ```bash
  kubectl get configmap coredns -n kube-system -o yaml > /tmp/coredns-backup.yaml
  # Modify forward line in Corefile to: forward . 8.8.8.8 1.1.1.1
  kubectl edit configmap coredns -n kube-system
  kubectl rollout restart deployment coredns -n kube-system
  kubectl rollout status deployment coredns -n kube-system
  ```
- **Common Mistakes:** Introducing syntax errors in Corefile curly braces `{}` causing CoreDNS crash loop.
- **Troubleshooting:** Check logs: `kubectl logs -n kube-system -l k8s-app=kube-dns`.
- **Cleanup Instructions:**
  ```bash
  kubectl apply -f /tmp/coredns-backup.yaml
  kubectl rollout restart deployment coredns -n kube-system
  ```

---

## LAB 36: Ingress Controller Routing with Path-Based Dispatching
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Author an Ingress resource with `pathType: Prefix` dispatching traffic across two independent microservices.
- **Prerequisites:** Ingress Controller running.
- **Cluster Environment:** Standard cluster with ingress-nginx.
- **Initial State:** Namespace `ecommerce`.
- **Task Description:**
  1. Create namespace `ecommerce`.
  2. Deploy `catalog-api` (1 replica, image `nginx:1.27`, port 80) and expose with Service `catalog-svc`.
  3. Deploy `orders-api` (1 replica, image `httpd:alpine`, port 80) and expose with Service `orders-svc`.
  4. Create an Ingress `shop-ingress` in `ecommerce` using `ingressClassName: nginx` matching host `shop.example.local`:
     - Path `/catalog` $\to$ `catalog-svc:80`
     - Path `/orders` $\to$ `orders-svc:80`
  5. Test URL dispatching with `curl` using the Host header.
- **Constraints:** Use `pathType: Prefix`.
- **Hints:** Pass `--header "Host: shop.example.local"` to `curl`.
- **Expected Result:** Traffic to `/catalog` reaches `catalog-api`; traffic to `/orders` reaches `orders-api`.
- **Verification:**
  ```bash
  kubectl get ingress shop-ingress -n ecommerce
  ```
- **Full Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: shop-ingress
    namespace: ecommerce
    annotations:
      nginx.ingress.kubernetes.io/rewrite-target: /
  spec:
    ingressClassName: nginx
    rules:
    - host: shop.example.local
      http:
        paths:
        - path: /catalog
          pathType: Prefix
          backend:
            service:
              name: catalog-svc
              port:
                number: 80
        - path: /orders
          pathType: Prefix
          backend:
            service:
              name: orders-svc
              port:
                number: 80
  ```
  ```bash
  kubectl create namespace ecommerce
  kubectl create deployment catalog-api --image=nginx:1.27 -n ecommerce
  kubectl expose deployment catalog-api --name=catalog-svc --port=80 -n ecommerce
  kubectl create deployment orders-api --image=httpd:alpine -n ecommerce
  kubectl expose deployment orders-api --name=orders-svc --port=80 -n ecommerce
  kubectl apply -f ingress-lab.yaml
  ```
- **Common Mistakes:** Omitting the rewrite-target annotation when backend containers expect `/` root paths.
- **Troubleshooting:** Run `kubectl describe ingress shop-ingress -n ecommerce` to verify backend endpoints.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace ecommerce
  ```

---

## LAB 37: Ingress TLS Termination with Cryptographic Secrets
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Generate a self-signed TLS certificate pair, create a `kubernetes.io/tls` Secret, and configure Ingress SSL termination.
- **Prerequisites:** OpenSSL installed on workstation.
- **Cluster Environment:** Ingress-enabled cluster.
- **Initial State:** Service `secure-portal-svc` running in `default`.
- **Task Description:**
  1. Generate a self-signed TLS cert and private key for domain `portal.company.com`:
     - `tls.crt` and `tls.key`.
  2. Create a TLS Secret named `portal-tls-secret` from the cert and key.
  3. Create an Ingress resource `secure-portal-ingress` terminating TLS for `portal.company.com` using `portal-tls-secret`.
  4. Verify that HTTPS requests to the Ingress controller succeed.
- **Constraints:** Secret must be of type `kubernetes.io/tls`.
- **Hints:** Use `kubectl create secret tls portal-tls-secret --cert=tls.crt --key=tls.key`.
- **Expected Result:** Ingress terminates TLS cleanly on port 443.
- **Verification:**
  ```bash
  kubectl get secret portal-tls-secret -o yaml
  kubectl describe ingress secure-portal-ingress | grep -A 5 TLS
  ```
- **Full Solution:**
  ```bash
  # 1. Generate cert
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /tmp/tls.key -out /tmp/tls.crt \
    -subj "/CN=portal.company.com/O=Company"

  # 2. Create Secret
  kubectl create secret tls portal-tls-secret --cert=/tmp/tls.crt --key=/tmp/tls.key

  # 3. Create Ingress
  cat <<EOF | kubectl apply -f -
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: secure-portal-ingress
  spec:
    ingressClassName: nginx
    tls:
    - hosts:
      - portal.company.com
      secretName: portal-tls-secret
    rules:
    - host: portal.company.com
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: web-portal-svc
              port:
                number: 80
  EOF
  ```
- **Common Mistakes:** Creating a generic secret instead of a TLS secret (`kubectl create secret generic` lacks required data fields `tls.crt` and `tls.key`).
- **Troubleshooting:** Verify Secret keys with `kubectl describe secret portal-tls-secret`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete ingress secure-portal-ingress
  kubectl delete secret portal-tls-secret
  rm -f /tmp/tls.key /tmp/tls.crt
  ```

---

## LAB 38: Next-Gen Traffic Management with Gateway API (`GatewayClass` & `Gateway`)
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Inspect available GatewayClasses and deploy a modern Gateway resource declaring HTTP and HTTPS entry point listeners.
- **Prerequisites:** Gateway API CRDs installed on cluster.
- **Cluster Environment:** Standard Kubernetes v1.31+ cluster.
- **Initial State:** GatewayClass `cilium` or `envoy` installed.
- **Task Description:**
  1. Verify installed GatewayClasses using `kubectl get gatewayclasses`.
  2. Create namespace `gateway-infra`.
  3. Author a `Gateway` resource named `edge-gateway` in namespace `gateway-infra`.
  4. Configure two listeners:
     - `http-listener`: port 80, protocol HTTP, allowedRoutes from all namespaces.
     - `https-listener`: port 443, protocol HTTPS, allowedRoutes from same namespace.
  5. Inspect the Gateway status conditions to verify it transitions to `Programmed: True`.
- **Constraints:** Must use `gateway.networking.k8s.io/v1`.
- **Hints:** Check `kubectl explain gateway.spec.listeners`.
- **Expected Result:** `edge-gateway` is created and reports Programmed condition.
- **Verification:**
  ```bash
  kubectl get gateway edge-gateway -n gateway-infra
  ```
- **Full Solution:**
  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: Gateway
  metadata:
    name: edge-gateway
    namespace: gateway-infra
  spec:
    gatewayClassName: eg-gateway-class
    listeners:
    - name: http-listener
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: All
    - name: https-listener
      port: 443
      protocol: HTTPS
      allowedRoutes:
        namespaces:
          from: Same
      tls:
        mode: Terminate
        certificateRefs:
        - name: edge-tls-cert
  ```
  ```bash
  kubectl create namespace gateway-infra
  kubectl apply -f gateway.yaml
  ```
- **Common Mistakes:** Referencing a non-existent `gatewayClassName`.
- **Troubleshooting:** Run `kubectl describe gateway edge-gateway -n gateway-infra` to check listener validation errors.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace gateway-infra
  ```

---

## LAB 39: Gateway API `HTTPRoute` with Weighted Traffic Splitting
- **Difficulty:** Advanced
- **Estimated Duration:** 15 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Implement a canary release using Gateway API `HTTPRoute` with a 90/10 weighted backend traffic split.
- **Prerequisites:** Gateway resource `prod-gateway` running.
- **Cluster Environment:** Gateway API enabled cluster.
- **Initial State:** Namespace `canary-demo` with Services `web-v1-svc` and `web-v2-svc`.
- **Task Description:**
  1. In namespace `canary-demo`, create two Deployments: `web-v1` (image `nginx:1.26`) and `web-v2` (image `nginx:1.27`).
  2. Expose both with ClusterIP Services `web-v1-svc` and `web-v2-svc` on port 80.
  3. Create an `HTTPRoute` named `web-canary-route` attaching to parent Gateway `prod-gateway`.
  4. Configure path `/` matching hostname `app.company.internal`.
  5. Split traffic: 90% weight to `web-v1-svc`, 10% weight to `web-v2-svc`.
  6. Verify route status condition shows `Accepted: True`.
- **Constraints:** Do not use legacy Ingress annotations.
- **Hints:** Use `spec.rules[*].backendRefs[*].weight`.
- **Expected Result:** HTTPRoute distributes traffic across backends proportionally to weights.
- **Verification:**
  ```bash
  kubectl describe httproute web-canary-route -n canary-demo | grep -A 8 Rules
  ```
- **Full Solution:**
  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: web-canary-route
    namespace: canary-demo
  spec:
    parentRefs:
    - name: prod-gateway
    hostnames:
    - "app.company.internal"
    rules:
    - matches:
      - path:
          type: PathPrefix
          value: /
      backendRefs:
      - name: web-v1-svc
        port: 80
        weight: 90
      - name: web-v2-svc
        port: 80
        weight: 10
  ```
  ```bash
  kubectl apply -f canary-route.yaml
  ```
- **Common Mistakes:** Summing weights to something other than 100 or using negative integers.
- **Troubleshooting:** Run `kubectl get httproute web-canary-route -n canary-demo -o yaml` and check `status.parents`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace canary-demo
  ```

---

## LAB 40: Gateway API Cross-Namespace Route Attachment
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Securely attach an `HTTPRoute` residing in namespace `apps` to a centralized `Gateway` in namespace `infra` using `allowedRoutes`.
- **Prerequisites:** Multi-namespace Gateway API setup.
- **Cluster Environment:** Gateway API enabled cluster.
- **Initial State:** Namespaces `infra` and `apps` exist.
- **Task Description:**
  1. In namespace `infra`, create Gateway `shared-gw` whose HTTP listener explicitly allows routes from namespaces with label `tenant: allowed`.
  2. Label namespace `apps` with `tenant: allowed`.
  3. In namespace `apps`, create `HTTPRoute` named `tenant-route` referencing parent Gateway `shared-gw` in namespace `infra`.
  4. Verify the route is accepted by the gateway.
- **Constraints:** Route attachment must be rejected if the namespace label is removed.
- **Hints:** Use `allowedRoutes.namespaces.from: Selector` on the Gateway listener.
- **Expected Result:** `tenant-route` shows `Accepted: True` in conditions.
- **Verification:**
  ```bash
  kubectl describe httproute tenant-route -n apps | grep "Accepted:"
  ```
- **Full Solution:**
  ```bash
  kubectl create namespace infra
  kubectl create namespace apps
  kubectl label namespace apps tenant=allowed
  ```
  ```yaml
  apiVersion: gateway.networking.k8s.io/v1
  kind: Gateway
  metadata:
    name: shared-gw
    namespace: infra
  spec:
    gatewayClassName: eg-gateway-class
    listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: Selector
          selector:
            matchLabels:
              tenant: allowed
  ---
  apiVersion: gateway.networking.k8s.io/v1
  kind: HTTPRoute
  metadata:
    name: tenant-route
    namespace: apps
  spec:
    parentRefs:
    - name: shared-gw
      namespace: infra
    rules:
    - backendRefs:
      - name: app-svc
        port: 80
  ```
- **Common Mistakes:** Forgetting `parentRefs[*].namespace: infra` when attaching from a foreign namespace.
- **Troubleshooting:** If status is `Refused`, check namespace label with `kubectl get ns apps --show-labels`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace infra apps
  ```

---

## LAB 41: Default-Deny All Ingress NetworkPolicy Enforcement
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Lock down an entire namespace by applying a default-deny Ingress NetworkPolicy, and observe immediate traffic drop.
- **Prerequisites:** Cluster with policy-enforcing CNI (Calico or Cilium).
- **Cluster Environment:** NetworkPolicy capable cluster.
- **Initial State:** Namespace `isolated-ns` with a working NGINX pod.
- **Task Description:**
  1. Create namespace `isolated-ns`.
  2. Deploy Pod `web` (`nginx:1.27`) and expose with Service `web-svc` in `isolated-ns`.
  3. Verify a curl pod in `default` can reach `web-svc.isolated-ns`.
  4. Author and apply a NetworkPolicy `default-deny-ingress` in `isolated-ns` selecting all pods (`podSelector: {}`) with `policyTypes: [Ingress]`.
  5. Verify that subsequent curls from `default` immediately hang and time out.
- **Constraints:** Do not block egress traffic.
- **Hints:** `podSelector: {}` acts as a wildcard matching all pods in that namespace.
- **Expected Result:** Incoming connections are dropped at the CNI layer.
- **Verification:**
  ```bash
  kubectl run test-curl --image=curlimages/curl --rm -it --restart=Never -- --connect-timeout 3 http://web-svc.isolated-ns
  # Expected: Connection timed out
  ```
- **Full Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: default-deny-ingress
    namespace: isolated-ns
  spec:
    podSelector: {}
    policyTypes:
    - Ingress
  ```
  ```bash
  kubectl create namespace isolated-ns
  kubectl run web --image=nginx:1.27 -n isolated-ns --port=80
  kubectl expose pod web --name=web-svc --port=80 -n isolated-ns
  kubectl apply -f default-deny.yaml
  ```
- **Common Mistakes:** Testing on a cluster running Flannel without Calico, where NetworkPolicies are silently ignored.
- **Troubleshooting:** Run `kubectl describe netpol default-deny-ingress -n isolated-ns` to confirm `Allowing ingress traffic: <none>`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace isolated-ns
  ```

---

## LAB 42: Inter-Pod Ingress Filtering with `podSelector` and `namespaceSelector`
- **Difficulty:** Intermediate
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Implement a fine-grained Ingress rule allowing traffic to database pods strictly from frontend pods in a production namespace.
- **Prerequisites:** NetworkPolicy capable CNI.
- **Cluster Environment:** Any test cluster.
- **Initial State:** Namespaces `frontend-ns` and `backend-ns`.
- **Task Description:**
  1. Create namespace `frontend-ns` and label it `env: prod`.
  2. Create namespace `backend-ns`.
  3. In `backend-ns`, run Pod `db` with label `app: db` on port 5432.
  4. Author a NetworkPolicy `allow-frontend-to-db` in `backend-ns`:
     - Targets pods labeled `app: db`.
     - Allows ingress on TCP port 5432 strictly from pods labeled `app: frontend` residing in namespaces labeled `env: prod`.
  5. Verify pods with other labels cannot connect.
- **Constraints:** Enforce both namespace and pod label constraints simultaneously (AND logic).
- **Hints:** Put `namespaceSelector` and `podSelector` under the SAME array dash `-` in `from:`.
- **Expected Result:** Only matching pods can establish TCP connections on port 5432.
- **Verification:**
  ```bash
  kubectl describe netpol allow-frontend-to-db -n backend-ns
  ```
- **Full Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: allow-frontend-to-db
    namespace: backend-ns
  spec:
    podSelector:
      matchLabels:
        app: db
    policyTypes:
    - Ingress
    ingress:
    - from:
      - namespaceSelector:
          matchLabels:
            env: prod
        podSelector:
          matchLabels:
            app: frontend
      ports:
      - protocol: TCP
        port: 5432
  ```
  ```bash
  kubectl create namespace frontend-ns
  kubectl label namespace frontend-ns env=prod
  kubectl create namespace backend-ns
  kubectl apply -f netpol-db.yaml
  ```
- **Common Mistakes:** Putting `namespaceSelector` and `podSelector` on separate dashes, converting the rule into a loose OR condition.
- **Troubleshooting:** Verify namespace labels with `kubectl get ns --show-labels`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace frontend-ns backend-ns
  ```

---

## LAB 43: Restricting Outbound Egress with Port 53 DNS Whitelisting
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Restrict egress traffic for secure pods while explicitly allowing UDP/TCP port 53 to CoreDNS to prevent broken name resolution.
- **Prerequisites:** NetworkPolicy capable CNI.
- **Cluster Environment:** Standard cluster.
- **Initial State:** Namespace `restricted-apps`.
- **Task Description:**
  1. Create namespace `restricted-apps`.
  2. Deploy Pod `secure-worker` in `restricted-apps`.
  3. Author a NetworkPolicy `restrict-egress` that:
     - Applies to all pods in `restricted-apps`.
     - Allows egress strictly to IP range `10.0.0.0/16`.
     - Explicitly permits egress to CoreDNS on port 53 (UDP and TCP).
  4. Verify that DNS resolution continues to work inside `secure-worker`.
- **Constraints:** Do not use `policyTypes: [Egress]` without port 53 allowance.
- **Hints:** Allow egress to `namespaceSelector: {}` on port 53 to reach `kube-system` CoreDNS.
- **Expected Result:** `nslookup` succeeds inside `secure-worker`, but outbound curls to public internet fail.
- **Verification:**
  ```bash
  kubectl exec -it secure-worker -n restricted-apps -- nslookup kubernetes.default
  # Expected: Resolves successfully
  ```
- **Full Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: restrict-egress
    namespace: restricted-apps
  spec:
    podSelector: {}
    policyTypes:
    - Egress
    egress:
    - to:
      - ipBlock:
          cidr: 10.0.0.0/16
    - to:
      - namespaceSelector: {}
      ports:
      - protocol: UDP
        port: 53
      - protocol: TCP
        port: 53
  ```
  ```bash
  kubectl create namespace restricted-apps
  kubectl run secure-worker --image=busybox:1.36 -n restricted-apps -- sleep 3600
  kubectl apply -f egress-netpol.yaml
  ```
- **Common Mistakes:** Forgetting that CoreDNS also listens on TCP port 53 for large query responses.
- **Troubleshooting:** If DNS fails, test by curling the CoreDNS ClusterIP directly to see if packets are dropped.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace restricted-apps
  ```

---

## LAB 44: External IP CIDR Ingress Filtering using `ipBlock`
- **Difficulty:** Intermediate
- **Estimated Duration:** 10 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Author an `ipBlock` NetworkPolicy rule allowing traffic from a corporate subnet while carving out an exception CIDR block.
- **Prerequisites:** NetworkPolicy capable CNI.
- **Cluster Environment:** Any cluster.
- **Initial State:** Namespace `corporate-network`.
- **Task Description:**
  1. Create namespace `corporate-network`.
  2. Deploy Pod `internal-api` in `corporate-network` listening on port 80.
  3. Create NetworkPolicy `allow-corp-cidr` selecting `internal-api`:
     - Allow Ingress from CIDR `192.168.0.0/16`.
     - Except sub-block `192.168.100.0/24` (untrusted DMZ).
     - Port: TCP 80.
  4. Inspect the resulting policy with `kubectl describe`.
- **Constraints:** Use `ipBlock` with `except`.
- **Hints:** `except` must be an array of CIDRs contained within the parent `cidr`.
- **Expected Result:** Policy is accepted and displays allowed CIDRs and excluded subnets.
- **Verification:**
  ```bash
  kubectl describe netpol allow-corp-cidr -n corporate-network
  ```
- **Full Solution:**
  ```yaml
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: allow-corp-cidr
    namespace: corporate-network
  spec:
    podSelector:
      matchLabels:
        app: internal-api
    policyTypes:
    - Ingress
    ingress:
    - from:
      - ipBlock:
          cidr: 192.168.0.0/16
          except:
          - 192.168.100.0/24
      ports:
      - protocol: TCP
        port: 80
  ```
  ```bash
  kubectl create namespace corporate-network
  kubectl run internal-api --image=nginx:alpine -n corporate-network -l app=internal-api
  kubectl apply -f ipblock-netpol.yaml
  ```
- **Common Mistakes:** Placing an `except` CIDR that is not a mathematical subnet of the outer `cidr`.
- **Troubleshooting:** Validate YAML syntax with `kubectl apply --dry-run=client -f ipblock-netpol.yaml`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete namespace corporate-network
  ```

---

## LAB 45: Live Packet Tracing with Ephemeral Debug Pods and Netshoot
- **Difficulty:** Advanced
- **Estimated Duration:** 12 minutes
- **Domain:** Services & Networking (20%)
- **Learning Objective:** Deploy an ephemeral troubleshooting container (`nicolaka/netshoot`) into a target Pod's network namespace to trace live TCP packets with `tcpdump`.
- **Prerequisites:** Cluster with EphemeralContainers enabled (standard in v1.25+).
- **Cluster Environment:** Any cluster.
- **Initial State:** Running Pod `web-target` in `default`.
- **Task Description:**
  1. Deploy Pod `web-target` running `nginx:1.27`.
  2. Use `kubectl debug` to attach an ephemeral container running image `nicolaka/netshoot` into `web-target` sharing its network namespace.
  3. Inside the debug container, run `tcpdump -i eth0 -nn -s0 -v port 80`.
  4. From another terminal, generate traffic to `web-target`.
  5. Observe the live SYN, SYN-ACK, and ACK handshake in the tcpdump output.
- **Constraints:** Do not modify the original Pod specification or restart the container.
- **Hints:** Use `kubectl debug -it web-target --image=nicolaka/netshoot --target=web-target`.
- **Expected Result:** Live packet capture displays TCP conversation streams.
- **Verification:**
  ```bash
  # Observed output inside debug container:
  # IP client.38290 > web-target.80: Flags [S], seq ...
  ```
- **Full Solution:**
  ```bash
  kubectl run web-target --image=nginx:1.27
  # In Terminal 1:
  kubectl debug -it web-target --image=nicolaka/netshoot -- /bin/bash
  # Inside netshoot shell:
  tcpdump -i any port 80 -n

  # In Terminal 2:
  POD_IP=$(kubectl get pod web-target -o jsonpath='{.status.podIP}')
  kubectl run temp-curl --image=curlimages/curl --rm -it --restart=Never -- http://${POD_IP}
  ```
- **Common Mistakes:** Omitting the ephemeral container image, defaulting to alpine without networking tools.
- **Troubleshooting:** If `kubectl debug` fails, check if the cluster has RBAC permission for subresource `pods/ephemeralcontainers`.
- **Cleanup Instructions:**
  ```bash
  kubectl delete pod web-target
  ```
