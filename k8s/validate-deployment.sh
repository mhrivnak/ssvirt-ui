#!/bin/bash

# SSVIRT UI Deployment Validation Script
# This script validates that the SSVIRT UI deployment is working correctly

set -e

echo "🔍 Validating SSVIRT UI Kubernetes deployment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check cluster connectivity
echo "📡 Checking cluster connectivity..."
kubectl cluster-info > /dev/null 2>&1 || {
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
}
echo "✅ Connected to cluster"

# Check if deployment exists
echo "📦 Checking deployment..."
if kubectl get deployment ssvirt-ui > /dev/null 2>&1; then
    echo "✅ Deployment 'ssvirt-ui' found"
else
    echo "❌ Deployment 'ssvirt-ui' not found"
    echo "💡 Run: kubectl apply -k k8s/"
    exit 1
fi

# Check deployment status
echo "🔄 Checking deployment status..."
READY_REPLICAS=$(kubectl get deployment ssvirt-ui -o jsonpath='{.status.readyReplicas}' 2>/dev/null || echo "0")
DESIRED_REPLICAS=$(kubectl get deployment ssvirt-ui -o jsonpath='{.spec.replicas}')

if [ "$READY_REPLICAS" = "$DESIRED_REPLICAS" ] && [ "$READY_REPLICAS" != "0" ]; then
    echo "✅ Deployment is ready ($READY_REPLICAS/$DESIRED_REPLICAS replicas)"
else
    echo "⚠️  Deployment not fully ready ($READY_REPLICAS/$DESIRED_REPLICAS replicas)"
    echo "📋 Pod status:"
    kubectl get pods -l app=ssvirt-ui
fi

# Check service
echo "🌐 Checking service..."
if kubectl get service ssvirt-ui > /dev/null 2>&1; then
    echo "✅ Service 'ssvirt-ui' found"
    SERVICE_IP=$(kubectl get service ssvirt-ui -o jsonpath='{.spec.clusterIP}')
    echo "📍 Service IP: $SERVICE_IP"
else
    echo "❌ Service 'ssvirt-ui' not found"
fi

# Check OpenShift route (if running on OpenShift)
if kubectl get route ssvirt-ui > /dev/null 2>&1; then
    echo "🛣️  OpenShift route found"
    ROUTE_HOST=$(kubectl get route ssvirt-ui -o jsonpath='{.spec.host}')
    echo "🌍 Route URL: https://$ROUTE_HOST"
elif kubectl api-resources | grep -q routes; then
    echo "⚠️  Running on OpenShift but route 'ssvirt-ui' not found"
else
    echo "ℹ️  Not running on OpenShift (no route resources available)"
fi

# Check pod logs for errors
echo "📋 Checking for errors in pod logs..."
POD_NAME=$(kubectl get pods -l app=ssvirt-ui -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -n "$POD_NAME" ]; then
    ERROR_COUNT=$(kubectl logs "$POD_NAME" --tail=50 2>/dev/null | grep -i "error\|exception\|failed" | wc -l || echo "0")
    if [ "$ERROR_COUNT" -gt "0" ]; then
        echo "⚠️  Found $ERROR_COUNT potential errors in logs"
        echo "🔍 Recent errors:"
        kubectl logs "$POD_NAME" --tail=50 | grep -i "error\|exception\|failed" | tail -5
    else
        echo "✅ No obvious errors in recent logs"
    fi
else
    echo "⚠️  No pods found to check logs"
fi

# Test connectivity (if possible)
echo "🧪 Testing application connectivity..."
if kubectl get pods -l app=ssvirt-ui | grep -q "Running"; then
    echo "🔗 Testing HTTP connectivity..."
    if kubectl exec deployment/ssvirt-ui -- curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -q "200"; then
        echo "✅ Application responding on port 8080"
    else
        echo "⚠️  Application may not be responding correctly"
    fi
else
    echo "⚠️  No running pods to test connectivity"
fi

# Summary
echo ""
echo "📊 Deployment Summary:"
echo "  Deployment: $(kubectl get deployment ssvirt-ui -o jsonpath='{.status.readyReplicas}')/$(kubectl get deployment ssvirt-ui -o jsonpath='{.spec.replicas}') ready"
echo "  Service: $(kubectl get service ssvirt-ui -o jsonpath='{.spec.clusterIP}'):$(kubectl get service ssvirt-ui -o jsonpath='{.spec.ports[0].port}')"

if kubectl get route ssvirt-ui > /dev/null 2>&1; then
    echo "  Route: https://$(kubectl get route ssvirt-ui -o jsonpath='{.spec.host}')"
fi

echo ""
echo "🎉 Validation complete!"

# Provide next steps
if [ "$READY_REPLICAS" = "$DESIRED_REPLICAS" ] && [ "$READY_REPLICAS" != "0" ]; then
    echo "✅ Your SSVIRT UI deployment appears to be working correctly"
    if kubectl get route ssvirt-ui > /dev/null 2>&1; then
        echo "🌍 Access your application at: https://$(kubectl get route ssvirt-ui -o jsonpath='{.spec.host}')"
    else
        echo "🔧 For testing, you can use port forwarding:"
        echo "   kubectl port-forward svc/ssvirt-ui 8080:8080"
        echo "   Then access: http://localhost:8080"
    fi
else
    echo "⚠️  Some issues detected. Check the deployment status with:"
    echo "   kubectl describe deployment ssvirt-ui"
    echo "   kubectl logs -l app=ssvirt-ui"
fi