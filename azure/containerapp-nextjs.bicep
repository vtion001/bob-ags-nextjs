targetScope = 'resourceGroup'

@description('Azure region')
param location string

@description('Base name for resources')
param baseName string

@description('ACR login server')
param acrLoginServer string

@description('ACR admin username')
param acrUsername string

@description('ACR admin password')
@secure()
param acrPassword string

@description('Laravel API URL (internal CA URL)')
param nextPublicLaravelApiUrl string

// Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${baseName}-env'
  location: location
}

// Next.js Container App
resource nextjsApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${baseName}-nextjs'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acrLoginServer
          username: acrUsername
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acrPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'nextjs'
          image: '${acrLoginServer}/bob-nextjs:latest'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            {
              name: 'NEXT_PUBLIC_LARAVEL_API_URL'
              value: nextPublicLaravelApiUrl
            }
            {
              name: 'NEXTAUTH_SECRET'
              value: 'change-this-in-production-min32chars'
            }
            {
              name: 'NEXTAUTH_URL'
              value: 'https://${baseName}-nextjs.${environment().suffixes.azureAppGwDns}'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/', port: 3000 }
              initialDelaySeconds: 10
              periodSeconds: 15
            }
            {
              type: 'Readiness'
              httpGet: { path: '/', port: 3000 }
              initialDelaySeconds: 5
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 10
      }
    }
  }
}

output fqdn string = nextjsApp.properties.configuration.ingress.fqdn
output name string = nextjsApp.name
