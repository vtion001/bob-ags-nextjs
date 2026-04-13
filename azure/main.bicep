targetScope = 'resourceGroup'

@description('Base name for all resources')
param baseName string = 'bob'

@description('Azure region for resources (Southeast Asia = closest to Philippines)')
param location string = 'southeastasia'

@description('PostgreSQL administrator password')
@secure()
param postgresPassword string

@description('Redis access key')
@secure()
param redisKey string

@description('Laravel APP_KEY (base64 encoded)')
@secure()
param laravelAppKey string

// =============================================================================
// ACR — Azure Container Registry
// =============================================================================
module acr 'acr.bicep' = {
  name: '${baseName}-acr'
  params: {
    location: location
    baseName: baseName
  }
}

// =============================================================================
// PostgreSQL — Azure Database for PostgreSQL Flexible
// =============================================================================
module postgres 'postgres.bicep' = {
  name: '${baseName}-postgres'
  params: {
    location: location
    baseName: baseName
    postgresPassword: postgresPassword
  }
}

// =============================================================================
// Redis — Azure Cache for Redis
// =============================================================================
module redis 'redis.bicep' = {
  name: '${baseName}-redis'
  params: {
    location: location
    baseName: baseName
    redisKey: redisKey
  }
}

// =============================================================================
// Laravel Container App
// =============================================================================
module laravel 'containerapp-laravel.bicep' = {
  name: '${baseName}-laravel-ca'
  params: {
    location: location
    baseName: baseName
    acrLoginServer: acr.outputs.loginServer
    acrUsername: acr.outputs.adminUsername
    acrPassword: acr.outputs.adminPassword
    postgresHost: postgres.outputs.host
    postgresDatabase: postgres.outputs.database
    postgresUser: postgres.outputs.username
    postgresPassword: postgresPassword
    redisHost: redis.outputs.host
    redisKey: redisKey
    laravelAppKey: laravelAppKey
    ctmAccessKey: ''
    ctmSecretKey: ''
    ctmAccountId: ''
    openrouterApiKey: ''
    assemblyaiApiKey: ''
  }
}

// =============================================================================
// Next.js Container App
// =============================================================================
module nextjs 'containerapp-nextjs.bicep' = {
  name: '${baseName}-nextjs-ca'
  params: {
    location: location
    baseName: baseName
    acrLoginServer: acr.outputs.loginServer
    acrUsername: acr.outputs.adminUsername
    acrPassword: acr.outputs.adminPassword
    nextPublicLaravelApiUrl: 'https://${laravel.outputs.fqdn}'
  }
}

// =============================================================================
// Outputs
// =============================================================================
output acrLoginServer string = acr.outputs.loginServer
output postgresHost string = postgres.outputs.host
output redisHost string = redis.outputs.host
output laravelUrl string = 'https://${laravel.outputs.fqdn}'
output nextjsUrl string = 'https://${nextjs.outputs.fqdn}'
output resourceGroup string = resourceGroup().name
