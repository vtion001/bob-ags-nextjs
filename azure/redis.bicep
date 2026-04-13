targetScope = 'resourceGroup'

@description('Azure region')
param location string

@description('Base name for resources')
param baseName string

@description('Redis access key')
@secure()
param redisKey string

resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: '${baseName}-redis'
  location: location
  sku: {
    name: 'Standard'
    family: 'C'
    capacity: 1
  }
  properties: {
    redisVersion: 'latest'
    minimumTlsVersion: '1.2'
    skuName: 'Standard'
  }
}

resource redisKey 'Microsoft.Cache/redis/accessKeys@2023-08-01' = {
  parent: redis
  name: 'default'
}

output host string = redis.properties.hostName
output primaryKey string = redisKey.listKeys().primaryKey
