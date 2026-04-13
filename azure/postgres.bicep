targetScope = 'resourceGroup'

@description('Azure region')
param location string

@description('Base name for resources')
param baseName string

@description('PostgreSQL administrator password')
@secure()
param postgresPassword string

resource postgresServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-06-01' = {
  name: '${baseName}-postgres'
  location: location
  sku: {
    name: 'B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: 'bob_admin'
    administratorLoginPassword: postgresPassword
    storage: {
      storageSizeGB: 32
    }
    highAvailability: {
      mode: 'Disabled'
    }
    backup: {
      backupRetentionDays: 7
    }
    extensions: [
      {
        name: 'uuid_ossp'
      }
    ]
  }
}

resource postgresDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-06-01' = {
  parent: postgresServer
  name: 'bob'
  properties: {}
}

resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-06-01' = {
  parent: postgresServer
  name: 'allow-azure-internal'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

output host string = postgresServer.properties.fqdn
output database string = postgresDatabase.name
output username string = 'bob_admin'
