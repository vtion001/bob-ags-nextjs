targetScope = 'resourceGroup'

@description('Azure region')
param location string

@description('Base name for resources')
param baseName string

resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: '${baseName}acr'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

output loginServer string = acr.properties.loginServer
output name string = acr.name
output adminUsername string = acr.properties.adminUsername
output adminPassword string = acr.listCredentials().passwords[0].value
