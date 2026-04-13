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

@description('PostgreSQL host')
param postgresHost string

@description('PostgreSQL database name')
param postgresDatabase string = 'bob'

@description('PostgreSQL username')
param postgresUser string

@description('PostgreSQL password')
@secure()
param postgresPassword string

@description('Redis host')
param redisHost string

@description('Redis key')
@secure()
param redisKey string

@description('Laravel APP_KEY')
@secure()
param laravelAppKey string

@description('CTM access key')
param ctmAccessKey string = ''

@description('CTM secret key')
@secure()
param ctmSecretKey string = ''

@description('CTM account ID')
param ctmAccountId string = ''

@description('OpenRouter API key')
@secure()
param openrouterApiKey string = ''

@description('AssemblyAI API key')
@secure()
param assemblyaiApiKey string = ''

// Container App Environment
resource containerAppEnv 'Microsoft.App/managedEnvironments@2023-05-01' = {
  name: '${baseName}-env'
  location: location
}

// Laravel Container App
resource laravelApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: '${baseName}-laravel'
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      activeRevisionsMode: 'Single'
      ingress: {
        external: false
        targetPort: 8000
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
        {
          name: 'postgres-password'
          value: postgresPassword
        }
        {
          name: 'redis-key'
          value: redisKey
        }
        {
          name: 'laravel-app-key'
          value: laravelAppKey
        }
        {
          name: 'ctm-secret-key'
          value: ctmSecretKey
        }
        {
          name: 'openrouter-api-key'
          value: openrouterApiKey
        }
        {
          name: 'assemblyai-api-key'
          value: assemblyaiApiKey
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'laravel'
          image: '${acrLoginServer}/bob-laravel:latest'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            { name: 'APP_ENV', value: 'production' }
            { name: 'APP_DEBUG', value: 'false' }
            { name: 'APP_KEY', secretRef: 'laravel-app-key' }
            { name: 'APP_URL', value: 'http://localhost:8000' }
            { name: 'DB_CONNECTION', value: 'pgsql' }
            { name: 'DB_HOST', value: postgresHost }
            { name: 'DB_PORT', value: '5432' }
            { name: 'DB_DATABASE', value: postgresDatabase }
            { name: 'DB_USERNAME', value: postgresUser }
            { name: 'DB_PASSWORD', secretRef: 'postgres-password' }
            { name: 'SESSION_DRIVER', value: 'redis' }
            { name: 'CACHE_DRIVER', value: 'redis' }
            { name: 'REDIS_HOST', value: redisHost }
            { name: 'REDIS_PASSWORD', secretRef: 'redis-key' }
            { name: 'REDIS_CLIENT', value: 'predis' }
            {
              name: 'SANCTUM_STATEFUL_DOMAINS'
              value: '${baseName}-nextjs.${environment().suffixes.azureAppGwDns}'
            }
            { name: 'SESSION_LIFETIME', value: '120' }
            { name: 'CTM_ACCESS_KEY', value: ctmAccessKey }
            { name: 'CTM_SECRET_KEY', secretRef: 'ctm-secret-key' }
            { name: 'CTM_ACCOUNT_ID', value: ctmAccountId }
            { name: 'OPENROUTER_API_KEY', secretRef: 'openrouter-api-key' }
            { name: 'ASSEMBLYAI_API_KEY', secretRef: 'assemblyai-api-key' }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: { path: '/', port: 8000 }
              initialDelaySeconds: 30
              periodSeconds: 15
            }
            {
              type: 'Readiness'
              httpGet: { path: '/', port: 8000 }
              initialDelaySeconds: 10
              periodSeconds: 5
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 3
      }
    }
  }
}

output fqdn string = laravelApp.properties.configuration.ingress.fqdn
output name string = laravelApp.name
