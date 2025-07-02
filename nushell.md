Directory structure:
└── vfarcic-nu-scripts/
    ├── ack.nu
    ├── argo-workflows.nu
    ├── argocd.nu
    ├── aso.nu
    ├── atlas.nu
    ├── aws-storage-policy.json
    ├── azure-permissions.json
    ├── backstage.nu
    ├── cert-manager.nu
    ├── CLAUDE.md
    ├── cnpg.nu
    ├── common.nu
    ├── crossplane.nu
    ├── devbox.json
    ├── devbox.lock
    ├── dot.nu
    ├── external-secrets.nu
    ├── gatekeeper.nu
    ├── github.nu
    ├── image.nu
    ├── ingress.nu
    ├── kro.nu
    ├── kubernetes.nu
    ├── kubevela.nu
    ├── kyverno.nu
    ├── mcp.nu
    ├── memory.json
    ├── port.nu
    ├── prometheus.nu
    ├── registry.nu
    ├── renovate.json
    ├── storage.nu
    ├── tests.nu
    ├── values-prometheus.yaml
    ├── velero.nu
    ├── .teller.yml
    ├── docs/
    │   └── development.md
    ├── prompts/
    │   ├── create-diagram.md
    │   ├── create-service.md
    │   └── observe-service.md
    └── .cursor/
        └── rules/
            └── fetch_mcp_memory_instructions.mdc


Files Content:

================================================
FILE: ack.nu
================================================
#!/usr/bin/env nu

# Installs and configures AWS Controllers for Kubernetes (ACK)
#
# Examples:
# > main apply ack --cluster_name my-cluster --region us-west-2
def --env "main apply ack" [
    --cluster_name = "dot"
    --region = "us-east-1"
    --apply_irsa = true
] {

    print $"\nApplying (ansi yellow_bold)ACK Controllers(ansi reset)...\n"

    if AWS_ACCESS_KEY_ID not-in $env {
        $env.AWS_ACCESS_KEY_ID = input $"(ansi yellow_bold)Enter AWS Access Key ID: (ansi reset)"
    }
    $"export AWS_ACCESS_KEY_ID=($env.AWS_ACCESS_KEY_ID)\n"
        | save --append .env

    if AWS_SECRET_ACCESS_KEY not-in $env {
        $env.AWS_SECRET_ACCESS_KEY = input $"(ansi yellow_bold)Enter AWS Secret Access Key: (ansi reset)"
    }
    $"export AWS_SECRET_ACCESS_KEY=($env.AWS_SECRET_ACCESS_KEY)\n"
        | save --append .env

    let password = (
        aws ecr-public get-login-password --region us-east-1
    )

    (
        helm registry login --username AWS --password $password 
            public.ecr.aws
    )

    mut aws_account_id = ""
    mut oidc_provider = ""

    if $apply_irsa {

        if AWS_ACCOUNT_ID in $env {
            $aws_account_id = $env.AWS_ACCOUNT_ID
        } else {
            $aws_account_id = (
                aws sts get-caller-identity --query "Account"
                    --output text
            )
        }

        if OIDC_PROVIDER in $env {
            $oidc_provider = $env.OIDC_PROVIDER
        } else {
            $oidc_provider = (
                aws eks describe-cluster --name $cluster_name
                    --region $region
                    --query "cluster.identity.oidc.issuer"
                    --output text | str replace "https://" ""
            )
        }

    }

    let controllers = [
        {name: "ec2", version: "1.3.7"},
        {name: "rds", version: "1.4.14"},
    ]
    for controller in $controllers {

        let ack_controller_iam_role = $"ack-($controller.name)-controller"

        (
            helm upgrade --install $ack_controller_iam_role
                oci://public.ecr.aws/aws-controllers-k8s/($controller.name)-chart
                $"--version=($controller.version)"
                --create-namespace --namespace ack-system
                --set aws.region=us-east-1
        )

        if $apply_irsa {

            {
                Version: "2012-10-17",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: {
                            Federated: $"arn:aws:iam::($aws_account_id):oidc-provider/($oidc_provider)"
                        },
                        "Action": "sts:AssumeRoleWithWebIdentity",
                        "Condition": {
                            "StringEquals": {
                                $"($oidc_provider):sub": $"system:serviceaccount:ack-system:($ack_controller_iam_role)"
                            }
                        }
                    }
                ]
            } | to json | save trust.json --force

            do --ignore-errors {(
                aws iam create-role
                    --role-name $ack_controller_iam_role
                    --assume-role-policy-document file://trust.json
                    --description $"IRSA role for ACK ($controller.name) controller deployment on EKS cluster using Helm charts"
            )}

            let policy_arns = (
                get policy_arns --controller $controller.name
            )

            for policy_arn in $policy_arns {(
                aws iam attach-role-policy
                    --role-name $ack_controller_iam_role
                    --policy-arn $policy_arn
            )}

            let role_arn = (
                aws iam get-role --role-name $ack_controller_iam_role
                    --query Role.Arn --output text
            )

            (
                kubectl --namespace ack-system
                    annotate serviceaccount $ack_controller_iam_role
                    $"eks.amazonaws.com/role-arn=($role_arn)"
            )

            (
                kubectl --namespace ack-system
                    rollout restart deployment
                    $"($ack_controller_iam_role)-($controller.name)-chart"
            )

            (
                kubectl --namespace ack-system wait
                    --for=condition=ready pods
                    --selector $"app.kubernetes.io/instance=($ack_controller_iam_role)"
            )

        }

    }

}

# Removes AWS Controllers for Kubernetes (ACK) and deletes associated IAM roles
def --env "main delete ack" [] {

    let controllers = [
        "ec2",
        "rds"
    ]
    for controller in $controllers {

        let ack_controller_iam_role = $"ack-($controller)-controller"

        let policy_arns = (
            get policy_arns --controller $controller
        )

        for policy_arn in $policy_arns {
            
        do --ignore-errors {(
            aws iam detach-role-policy
                --role-name ($ack_controller_iam_role)
                --policy-arn ($policy_arn)
            )}
        }

        aws iam delete-role --role-name $ack_controller_iam_role

    }

}

def "get policy_arns" [
    --controller = "ec2"
] {
    
    let base_url = $"https://raw.githubusercontent.com/aws-controllers-k8s/($controller)-controller/main"

    let policy_arn_url = $"($base_url)/config/iam/recommended-policy-arn"

    http get $policy_arn_url | lines

}


================================================
FILE: argo-workflows.nu
================================================
#!/usr/bin/env nu

# Installs Argo Workflows with container registry credentials
#
# Examples:
# > main apply argoworkflows my-user my-password user@example.com --registry ghcr.io
def "main apply argoworkflows" [
    registry_user: string     # Container image registry user
    registry_password: string # Container image registry password
    registry_email: string    # Container image registry email
    --registry = "ghcr.io"    # Container image registry
] {

    kubectl create namespace argo

    (
        kubectl --namespace argo apply 
            --filename "https://github.com/argoproj/argo-workflows/releases/download/v3.6.0/quick-start-minimal.yaml"
    )

    let auth = ( $"($registry_user):($registry_password)" | base64 )

    let json = {
        "auths": {
            $"($registry)": {
                "auth": $"($auth)"
            }
        }
    } | to json

    (
        kubectl --namespace argo create secret
            docker-registry regcred
            $"--docker-server=($registry)"
            --docker-username=($registry_user)
            --docker-password=($registry_password)
            --docker-email=($registry_email)
    )
    
    (
        kubectl --namespace argo create secret
            generic registry-creds
            --from-literal $"password=($registry_password)"
            --from-literal $"config.json=($json)"
    )

}



================================================
FILE: argocd.nu
================================================
#!/usr/bin/env nu

# Installs ArgoCD with optional ingress and applications setup
#
# Examples:
# > main apply argocd --host_name argocd.example.com --ingress_class_name nginx
def "main apply argocd" [
    --host-name = "",
    --apply-apps = true,
    --ingress-class-name = "traefik"
] {

    let git_url = git config --get remote.origin.url

    {
        configs: {
            secret: {
                argocdServerAdminPassword: "$2a$10$m3eTlEdRen0nS86c5Zph5u/bDFQMcWZYdG3NVdiyaACCqoxLJaz16"
                argocdServerAdminPasswordMtime: "2021-11-08T15:04:05Z"
            }
            cm: {
                application.resourceTrackingMethod: annotation
                timeout.reconciliation: 60s
            }
            params: { "server.insecure": true }
        }
        server: {
            ingress: {
                enabled: true
                ingressClassName: $ingress_class_name
                hostname: $host_name
            }
            extraArgs: [
                --insecure
            ]
        }
    } | save argocd-values.yaml --force

    helm repo add argo https://argoproj.github.io/argo-helm

    helm repo update
  
    (
        helm upgrade --install argocd argo/argo-cd
            --namespace argocd --create-namespace
            --values argocd-values.yaml --wait
    )

    mkdir argocd

    {
        apiVersion: argoproj.io/v1alpha1
        kind: Application
        metadata: {
            name: apps
            namespace: argocd
        }
        spec: {
            project: default
            source: {
                repoURL: $git_url
                targetRevision: HEAD
                path: apps
            }
            destination: {
                server: "https://kubernetes.default.svc"
                namespace: a-team
            }
            syncPolicy: {
                automated: {
                    selfHeal: true
                    prune: true
                    allowEmpty: true
                }
            }
        }
    } | save argocd/app.yaml --force

    if $apply_apps {
        
        kubectl apply --filename argocd/app.yaml

    }

}



================================================
FILE: aso.nu
================================================
#!/usr/bin/env nu

def --env "main apply aso" [
    --namespace = "default"
    --apply_creds = true
    --sync_period = "1h"
] {

    (
        helm upgrade --install aso2 azure-service-operator
            --repo https://raw.githubusercontent.com/Azure/azure-service-operator/main/v2/charts
            --namespace=azureserviceoperator-system
            --create-namespace
            --set crdPattern='resources.azure.com/*;dbforpostgresql.azure.com/*'
            --wait
    )

    if $apply_creds {

        mut azure_tenant = ""
        if AZURE_TENANT not-in $env {
            $azure_tenant = input $"(ansi yellow_bold)Enter Azure Tenant: (ansi reset)"
        } else {
            $azure_tenant = $env.AZURE_TENANT
        }
        $"export AZURE_TENANT=($azure_tenant)\n" | save --append .env

        az login --tenant $azure_tenant

        let subscription_id = (az account show --query id -o tsv)

        let azure_data = (
            az ad sp create-for-rbac --sdk-auth --role Owner
                --scopes $"/subscriptions/($subscription_id)" | from json
        )

        {
            apiVersion: "v1"
            kind: "Secret"
            metadata: {
                name: "aso-credential"
                namespace: $namespace
            }
            stringData: {
                AZURE_SUBSCRIPTION_ID: $azure_data.subscriptionId
                AZURE_TENANT_ID: $azure_data.tenantId
                AZURE_CLIENT_ID: $azure_data.clientId
                AZURE_CLIENT_SECRET: $azure_data.clientSecret
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "v1"
            kind: "Secret"
            metadata: {
                name: "aso-controller-settings"
                namespace: "azureserviceoperator-system"
            }
            stringData: {
                MAX_CONCURRENT_RECONCILES: "1"
                AZURE_SYNC_PERIOD: $sync_period
            }
        } | to yaml | kubectl apply --filename -

        (
            kubectl --namespace azureserviceoperator-system
                rollout restart deployment
                azureserviceoperator-controller-manager
        )

    }

}



================================================
FILE: atlas.nu
================================================
#!/usr/bin/env nu

# Installs the Atlas Operator for database schema migrations
def "main apply atlas" [] {

    print $"\nInstalling (ansi yellow_bold)Atlas Operator(ansi reset)...\n"

    (
        helm upgrade --install atlas-operator 
            oci://ghcr.io/ariga/charts/atlas-operator 
            --namespace atlas-operator --create-namespace
            --wait
    )

}



================================================
FILE: aws-storage-policy.json
================================================
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeVolumes",
                "ec2:DescribeSnapshots",
                "ec2:CreateTags",
                "ec2:CreateVolume",
                "ec2:CreateSnapshot",
                "ec2:DeleteSnapshot"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObject",
                "s3:PutObjectTagging",
                "s3:AbortMultipartUpload",
                "s3:ListMultipartUploadParts"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET}/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::${BUCKET}"
            ]
        }
    ]
}



================================================
FILE: azure-permissions.json
================================================
{
  "Name": "Velero",
  "Description": "Velero related permissions to perform backups, restores and deletions",
  "Actions": [
    "Microsoft.Compute/disks/read",
    "Microsoft.Compute/disks/write",
    "Microsoft.Compute/disks/endGetAccess/action",
    "Microsoft.Compute/disks/beginGetAccess/action",
    "Microsoft.Compute/snapshots/read",
    "Microsoft.Compute/snapshots/write",
    "Microsoft.Compute/snapshots/delete",
    "Microsoft.Storage/storageAccounts/listkeys/action",
    "Microsoft.Storage/storageAccounts/regeneratekey/action",
    "Microsoft.Storage/storageAccounts/read",
    "Microsoft.Storage/storageAccounts/blobServices/containers/delete",
    "Microsoft.Storage/storageAccounts/blobServices/containers/read",
    "Microsoft.Storage/storageAccounts/blobServices/containers/write",
    "Microsoft.Storage/storageAccounts/blobServices/generateUserDelegationKey/action"
  ],
  "DataActions": [
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/delete",
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/read",
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/write",
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/move/action",
    "Microsoft.Storage/storageAccounts/blobServices/containers/blobs/add/action"
  ],
  "AssignableScopes": [
    "/subscriptions/7f9f9b08-7d00-43c9-9d30-f10bb79e9a61"
  ]
}


================================================
FILE: backstage.nu
================================================
#!/usr/bin/env nu

# Configures a Backstage instance with Crossplane integration
def --env "main configure backstage" [] {

    rm --force --recursive backstage
    
    print $"
When asked for a name for the Backstage app make sure to keep the default value (ansi yellow_bold)backstage(ansi reset)
Press the (ansi yellow_bold)enter key(ansi reset) to continue.
"
    input

    npx @backstage/create-app@latest

    cd backstage

    for package in [
        "@terasky/backstage-plugin-crossplane-common@1.1.0",
        "@terasky/backstage-plugin-crossplane-permissions-backend@1.1.1",
        "@terasky/backstage-plugin-kubernetes-ingestor@1.5.0",
        "@terasky/backstage-plugin-scaffolder-backend-module-terasky-utils@1.1.0"
    ] {
        yarn --cwd packages/backend add $package
    }

    for package in [
        "@terasky/backstage-plugin-crossplane-resources-frontend@1.4.0"
    ] {
        yarn --cwd packages/app add $package
    }

    open app-config.yaml
        | upsert backend.csp.upgrade-insecure-requests false
        | upsert crossplane.enablePermissions false
        | upsert kubernetesIngestor.components.enabled true
        | upsert kubernetesIngestor.components.taskRunner.frequency 10
        | upsert kubernetesIngestor.components.taskRunner.timeout 600
        | upsert kubernetesIngestor.components.excludedNamespaces []
        | upsert kubernetesIngestor.components.excludedNamespaces.0 "kube-public"
        | upsert kubernetesIngestor.components.excludedNamespaces.1 "kube-system"
        | upsert kubernetesIngestor.components.customWorkloadTypes []
        | upsert kubernetesIngestor.components.customWorkloadTypes.0 { group: "core.oam.dev", apiVersion: "v1beta1", plural: "applications" }
        | upsert kubernetesIngestor.components.disableDefaultWorkloadTypes "${DISABLE_DEFAULT_WORKLOAD_TYPES-false}"
        | upsert kubernetesIngestor.components.onlyIngestAnnotatedResources false
        | upsert kubernetesIngestor.crossplane.claims.ingestAllClaims true
        | upsert kubernetesIngestor.crossplane.xrds.publishPhase.allowedTargets ["github.com"]
        | upsert kubernetesIngestor.crossplane.xrds.publishPhase.target "github.com"
        | upsert kubernetesIngestor.crossplane.xrds.publishPhase.target "github.com"
        | upsert kubernetesIngestor.crossplane.xrds.publishPhase.allowRepoSelection true
        | upsert kubernetesIngestor.crossplane.xrds.enabled true
        | upsert kubernetesIngestor.crossplane.xrds.taskRunner.frequency 10
        | upsert kubernetesIngestor.crossplane.xrds.taskRunner.timeout 600
        | upsert kubernetesIngestor.crossplane.xrds.ingestAllXRDs true
        | upsert kubernetesIngestor.crossplane.xrds.convertDefaultValuesToPlaceholders true
        | upsert kubernetes {}
        | upsert kubernetes.frontend.podDelete.enabled true
        | upsert kubernetes.serviceLocatorMethod.type "multiTenant"
        | upsert kubernetes.clusterLocatorMethods [{}]
        | upsert kubernetes.clusterLocatorMethods.0.type "config"
        | upsert kubernetes.clusterLocatorMethods.0.clusters [{}]
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.url "${KUBE_URL}"
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.name "kind"
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.authProvider "serviceAccount"
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.skipTLSVerify true
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.skipMetricsLookup true
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.serviceAccountToken "${KUBE_SA_TOKEN}"
        | upsert kubernetes.clusterLocatorMethods.0.clusters.0.caData "${KUBE_CA_DATA}"
        | save app-config.yaml --force

    {
        app: {
            baseUrl: "${BACKSTAGE_HOST}"
        }
        backend: {
            baseUrl: "${BACKSTAGE_HOST}"
            database: {
                client: "pg"
                connection: {
                    host: "${DB_HOST}"
                    port: 5432
                    user: "${user}"
                    password: "${password}"
                }
            }
        }
    } | to yaml | save app-config.production.yaml --force

    open packages/app/src/components/catalog/EntityPage.tsx
        | (
            str replace
            `} from '@backstage/plugin-kubernetes';`
            `} from '@backstage/plugin-kubernetes';

import { CrossplaneAllResourcesTable, CrossplaneResourceGraph, isCrossplaneAvailable } from '@terasky/backstage-plugin-crossplane-resources-frontend';`
        ) | (
            str replace
            `const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>`
            `const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route if={isCrossplaneAvailable} path="/crossplane-resources" title="Crossplane Resources">
      <CrossplaneAllResourcesTable />
    </EntityLayout.Route>
    <EntityLayout.Route if={isCrossplaneAvailable} path="/crossplane-graph" title="Crossplane Graph">
      <CrossplaneResourceGraph />
    </EntityLayout.Route>`
        ) | (
            str replace
            `const componentPage = (
  <EntitySwitch>`
            `const componentPage = (
  <EntitySwitch>
    <EntitySwitch.Case if={isComponentType('crossplane-claim')}>
      {serviceEntityPage}
    </EntitySwitch.Case>`
        ) | save packages/app/src/components/catalog/EntityPage.tsx --force

    open packages/backend/src/index.ts
        | (
            str replace
            `backend.start();`
            `backend.add(import('@terasky/backstage-plugin-crossplane-permissions-backend'));
backend.add(import('@terasky/backstage-plugin-kubernetes-ingestor'));
backend.add(import('@terasky/backstage-plugin-scaffolder-backend-module-terasky-utils'));

backend.start();`
        ) | save packages/backend/src/index.ts --force

    cd ..

    get cluster data --create_service_account true

    $"export NODE_OPTIONS=--no-node-snapshot\n" | save --append .env

}

# Builds and publishes a Backstage Docker image and Helm chart
def --env "main build backstage" [
    tag: string
    --image = "ghcr.io/vfarcic/idp-full-backstage"
    --github_org = "vfarcic"
] {

    docker login $image

    cd backstage

    yarn install --immutable

    yarn tsc

    yarn build:backend

    (
        docker buildx build
            --file packages/backend/Dockerfile
            --tag $"($image):($tag)"
            --platform linux/amd64
            .
    )

    docker image push $"($image):($tag)"

    cd ..

    open charts/backstage/Chart.yaml
        | upsert version $tag
        | upsert appVersion $tag
        | save charts/backstage/Chart.yaml --force

    open charts/backstage/values.yaml
        | upsert image.repository $image
        | upsert image.tag $tag
        | save charts/backstage/values.yaml --force

    helm package charts/backstage

    helm push $"backstage-($tag).tgz" $"oci://ghcr.io/($image)"

    start $"https://github.com/users/($github_org)/packages/container/package/idp-full-backstage"

    print $"
Click (ansi yellow_bold)Package settings(ansi reset).
Click the (ansi yellow_bold)Change visibility(ansi reset) button, select (ansi yellow_bold)Public(ansi reset), type (ansi yellow_bold)idp-full-backstage(ansi reset) to confirm, and click the (ansi yellow_bold)I understand the consequences, change package visibility(ansi reset) button.
Press the (ansi yellow_bold)enter key(ansi reset) to continue.
"
    input

    start $"https://github.com/users/($github_org)/packages/container/package/idp-full-backstage%2Fbackstage"

    print $"
Click (ansi yellow_bold)Package settings(ansi reset).
Click the (ansi yellow_bold)Change visibility(ansi reset) button, select (ansi yellow_bold)Public(ansi reset), type (ansi yellow_bold)idp-full-backstage/backstage(ansi reset) to confirm, and click the (ansi yellow_bold)I understand the consequences, change package visibility(ansi reset) button.
Press the (ansi yellow_bold)enter key(ansi reset) to continue.
"
    input

    rm $"backstage-($tag).tgz"

}

# Deploys Backstage to Kubernetes with necessary configuration
def --env "main apply backstage" [
    tag: string                                   # Available versions can be seen at https://github.com/users/vfarcic/packages/container/idp-full-backstage%2Fbackstage/versions
    --kubeconfig = "kubeconfig-dot.yaml"
    --ingress_host = "backstage.127.0.0.1.nip.io"
    --github_token = "FIXME"
    --create_service_account = false
    --disable_default_workload_types = false
] {

    let cluster_data = (
        get cluster data  
            --kubeconfig $kubeconfig
            --create_service_account $create_service_account
    )

    {
        apiVersion: "v1"
        kind: "Secret"
        metadata: {
            name: "backstage-config"
            namespace: "backstage"
        }
        type: "Opaque"
        data: {
            KUBE_URL: ($cluster_data.kube_url | encode base64)
            KUBE_SA_TOKEN: $cluster_data.token_encoded
            KUBE_CA_DATA: ($cluster_data.kube_ca_data | encode base64)
            GITHUB_TOKEN: ($github_token | encode base64)
        }
    }
        | to yaml
        | kubectl --namespace backstage apply --filename -

    (
        helm upgrade --install cnpg cloudnative-pg
            --repo https://cloudnative-pg.github.io/charts
            --namespace cnpg-system --create-namespace --wait
    )

    (
        helm upgrade --install backstage
            oci://ghcr.io/vfarcic/idp-full-backstage/backstage
            --namespace backstage --create-namespace
            --set $"ingress.host=($ingress_host)"
            --set $"ingrestor.disableDefaultWorkloadTypes=($disable_default_workload_types)"
            --version $tag --wait
    )

    sleep 60sec

    print $"Backstage is available at (ansi yellow_bold)http://($ingress_host)(ansi reset)"

    start $"http://($ingress_host)"

}

def "get cluster data" [
    --kubeconfig = "kubeconfig-dot.yaml"
    --create_service_account = false
] {

    if $create_service_account {

        {
            apiVersion: "v1"
            kind: "Namespace"
            metadata: {
                name: "backstage"
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "v1"
            kind: "ServiceAccount"
            metadata: {
                name: "backstage"
                namespace: "backstage"
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "v1"
            kind: "Secret"
            metadata: {
                name: "backstage"
                namespace: "backstage"
                annotations: {
                    "kubernetes.io/service-account.name": "backstage"
                }
            }
            type: "kubernetes.io/service-account-token"
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "rbac.authorization.k8s.io/v1"
            kind: "ClusterRoleBinding"
            metadata: {
                name: "backstage"
            }
            subjects: [{
                kind: "ServiceAccount"
                name: "backstage"
                namespace: "backstage"
            }]
            roleRef: {
                kind: "ClusterRole"
                name: "cluster-admin"
                apiGroup: "rbac.authorization.k8s.io"
            }
        } | to yaml | kubectl apply --filename -

    }

    let kube_url = open $kubeconfig
        | get clusters.0.cluster.server
    $"export KUBE_URL=($kube_url)\n" | save --append .env

    let kube_ca_data = open $kubeconfig
        | get clusters.0.cluster.certificate-authority-data
    $"export KUBE_CA_DATA=($kube_ca_data)\n" | save --append .env

    let token_encoded = (
        kubectl --namespace backstage get secret backstage
            --output yaml
    )
        | from yaml
        | get data.token

    let token = ($token_encoded | decode base64 | decode)
    $"export KUBE_SA_TOKEN=($token)\n" | save --append .env

    {
        kube_url: $kube_url,
        kube_ca_data: $kube_ca_data,
        token_encoded: $token_encoded,
        token: $token
    }

}



================================================
FILE: cert-manager.nu
================================================
#!/usr/bin/env nu

# Installs cert-manager for managing TLS certificates in Kubernetes
def "main apply certmanager" [] {

    (
        helm upgrade --install cert-manager cert-manager
            --repo https://charts.jetstack.io
            --namespace cert-manager --create-namespace
            --set crds.enabled=true --wait
    )

}


================================================
FILE: CLAUDE.md
================================================
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Lint/Test Commands
- Run tests: `./tests.nu` or directly with `go test -v $"(pwd)/..."`
- Run a specific test: Currently no single test runner, uses Go testing
- No explicit lint commands found

## Code Style Guidelines
- Use `#!/usr/bin/env nu` shebang at the beginning of all scripts
- Define functions with `def` or `def --env` for environment-changing functions
- Function parameters: `[param1, param2]` with defaults as `--param = value`
- Variables: Use `let` for constants, `mut` for mutable variables
- String interpolation: `$"text(variable)text"`
- Comments: Use `#` with a space following
- Indentation: 4 spaces
- Error handling: Check conditions and use `exit 1` with descriptive messages
- Function naming: Prefix with `main` for primary commands, followed by action
- Organize related functions within topic-specific scripts (e.g., `kubernetes.nu`)
- When asked to show or get files, open them in VS Code using `code` command
- Always add latest specific version of devbox packages
- Always open files you create or edit in VS Code


================================================
FILE: cnpg.nu
================================================
#!/usr/bin/env nu

# Installs Cloud-Native PostgreSQL (CNPG) operator
def "main apply cnpg" [] {

     print $"\nInstalling (ansi yellow_bold)Cloud-Native PostgreSQL \(CNPG\)(ansi reset)...\n"

    (
        helm upgrade --install cnpg cloudnative-pg
            --repo https://cloudnative-pg.github.io/charts
            --namespace cnpg-system --create-namespace --wait
    )

}



================================================
FILE: common.nu
================================================
#!/usr/bin/env nu

# Prompts user to select a cloud provider from available options
#
# Returns:
# The selected provider name and saves it to .env file
def "main get provider" [
    --providers = [aws azure google kind upcloud]  # List of cloud providers to choose from
] {

    let message = $"
Right now, only providers listed below are supported in this demo.
Please send an email to (ansi yellow_bold)viktor@farcic.com(ansi reset) if you'd like to add additional providers.

(ansi yellow_bold)Select a provider(ansi green_bold)"

    let provider = $providers | input list $message
    print $"(ansi reset)"

    $"export PROVIDER=($provider)\n" | save --append .env

    $provider
}

# Prints a reminder to source the environment variables
def "main print source" [] {

    print $"
Execute `(ansi yellow_bold)source .env(ansi reset)` to load the environment variables.
"

}

# Removes temporary files created during script execution
def "main delete temp_files" [] {

    rm --force .env

    rm --force kubeconfig*.yaml

}

# Retrieves and configures credentials for the specified cloud provider
#
# Examples:
# > main get creds aws
# > main get creds azure
def --env "main get creds" [
    provider: string,  # The cloud provider to configure credentials for (aws, azure, google)
] {

    mut creds = {provider: $provider}

    if $provider == "google" {

        gcloud auth login


    } else if $provider == "aws" {

        mut aws_access_key_id = ""
        if AWS_ACCESS_KEY_ID in $env {
            $aws_access_key_id = $env.AWS_ACCESS_KEY_ID
        } else {
            $aws_access_key_id = input $"(ansi green_bold)Enter AWS Access Key ID: (ansi reset)"
        }
        $"export AWS_ACCESS_KEY_ID=($aws_access_key_id)\n"
            | save --append .env
        $creds = ( $creds | upsert aws_access_key_id $aws_access_key_id )

        mut aws_secret_access_key = ""
        if AWS_SECRET_ACCESS_KEY in $env {
            $aws_secret_access_key = $env.AWS_SECRET_ACCESS_KEY
        } else {
            $aws_secret_access_key = input $"(ansi green_bold)Enter AWS Secret Access Key: (ansi reset)" --suppress-output
            print ""
        }
        $"export AWS_SECRET_ACCESS_KEY=($aws_secret_access_key)\n"
            | save --append .env
        $creds = ( $creds | upsert aws_secret_access_key $aws_secret_access_key )

        mut aws_account_id = ""
        if AWS_ACCOUNT_ID in $env {
            $aws_account_id = $env.AWS_ACCOUNT_ID
        } else {
            $aws_account_id = input $"(ansi green_bold)Enter AWS Account ID: (ansi reset)"
        }
        $"export AWS_ACCOUNT_ID=($aws_account_id)\n"
            | save --append .env
        $creds = ( $creds | upsert aws_account_id $aws_account_id )

    } else if $provider == "azure" {

        mut tenant_id = ""

        if AZURE_TENANT in $env {
            $tenant_id = $env.AZURE_TENANT
        } else {
            $tenant_id = input $"(ansi green_bold)Enter Azure Tenant ID: (ansi reset)"
        }
        $creds = ( $creds | upsert tenant_id $tenant_id )

        az login --tenant $tenant_id
    
    } else {

        print $"(ansi red_bold)($provider)(ansi reset) is not a supported."
        exit 1

    }

    $creds

}



================================================
FILE: crossplane.nu
================================================
#!/usr/bin/env nu

# Installs and configures Crossplane with optional cloud provider setup
#
# Examples:
# > main apply crossplane --provider aws
# > main apply crossplane --provider google --app
# > main apply crossplane --provider azure --db-config --github-config --github-user user --github-token token
def --env "main apply crossplane" [
    --provider = none,       # Which provider to use. Available options are `none`, `google`, `aws`, and `azure`
    --app-config = false,    # Whether to apply DOT App Configuration
    --db-config = false,     # Whether to apply DOT SQL Configuration
    --github-config = false, # Whether to apply DOT GitHub Configuration
    --github-user: string,   # GitHub user required for the DOT GitHub Configuration and optinal for the DOT App Configuration
    --github-token: string,  # GitHub token required for the DOT GitHub Configuration and optinal for the DOT App Configuration
    --policies = false,      # Whether to create Validating Admission Policies
    --skip-login = false,    # Whether to skip the login (only for Azure)
    --preview = false        # Whether to use the preview version of Crossplane
    --db-provider = false    # Whether to apply database provider (not needed if --db-config is `true`)
] {

    print $"\nInstalling (ansi green_bold)Crossplane(ansi reset)...\n"

    helm repo add crossplane https://charts.crossplane.io/stable

    helm repo add crossplane-preview https://charts.crossplane.io/preview

    helm repo update

    if $preview {

        (
            helm upgrade --install crossplane "crossplane-preview/crossplane"
                --namespace crossplane-system --create-namespace
                --set args='{"--enable-usages"}'
                --wait --devel
        )
    
    } else {

        (
            helm upgrade --install crossplane "crossplane/crossplane"
                --namespace crossplane-system --create-namespace
                --set args='{"--enable-usages"}'
                --wait
        )

    }

    mut provider_data = {}
    if $provider == "google" {
        $provider_data = setup google
    } else if $provider == "aws" {
        setup aws
    } else if $provider == "azure" {
        setup azure --skip-login $skip_login
    } else if $provider == "upcloud" {
        setup upcloud
    }

    if $app_config {

        print $"\n(ansi green_bold)Applying `dot-application` Configuration...(ansi reset)\n"

        mut version = "v2.0.2"
        if not $preview {
            $version = "v0.7.41"
        }

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Configuration"
            metadata: { name: "crossplane-app" }
            spec: { package: $"xpkg.upbound.io/devops-toolkit/dot-application:($version)" }
        } | to yaml | kubectl apply --filename -

        if $policies {

            {
                apiVersion: "admissionregistration.k8s.io/v1"
                kind: "ValidatingAdmissionPolicy"
                metadata: { name: "dot-app" }
                spec: {
                    failurePolicy: "Fail"
                    matchConstraints: {
                        resourceRules: [{
                            apiGroups:   ["devopstoolkit.live"]
                            apiVersions: ["*"]
                            operations:  ["CREATE", "UPDATE"]
                            resources:   ["appclaims"]
                        }]
                    }
                    validations: [
                        {
                            expression: "has(object.spec.parameters.scaling) && has(object.spec.parameters.scaling.enabled) && object.spec.parameters.scaling.enabled"
                            message: "`spec.parameters.scaling.enabled` must be set to `true`."
                        }, {
                            expression: "has(object.spec.parameters.scaling) && object.spec.parameters.scaling.min > 1"
                            message: "`spec.parameters.scaling.min` must be greater than `1`."
                        }
                    ]
                }
            } | to yaml | kubectl apply --filename -

            {
                apiVersion: "admissionregistration.k8s.io/v1"
                kind: "ValidatingAdmissionPolicyBinding"
                metadata: { name: "dot-app" }
                spec: {
                    policyName: "dot-app"
                    validationActions: ["Deny"]
                }
            } | to yaml | kubectl apply --filename -

        }

    }

    if ($db_config or $db_provider) and $provider == "google" {

        start $"https://console.cloud.google.com/marketplace/product/google/sqladmin.googleapis.com?project=($provider_data.project_id)"
        
        print $"\n(ansi yellow_bold)ENABLE(ansi reset) the API.\nPress the (ansi yellow_bold)enter key(ansi reset) to continue.\n"
        input

    }

    if $db_config {

        print $"\n(ansi green_bold)Applying `dot-sql` Configuration...(ansi reset)\n"

        mut version = "v2.1.10"
        if not $preview {
            $version = "v1.1.21"
        }

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Configuration"
            metadata: { name: "crossplane-sql" }
            spec: { package: $"xpkg.upbound.io/devops-toolkit/dot-sql:($version)" }
        } | to yaml | kubectl apply --filename -

    } else if $db_provider {

        apply db-provider $provider
        
    }

    if $github_config {

        print $"\n(ansi green_bold)Applying `dot-github` Configuration...(ansi reset)\n"

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Configuration"
            metadata: { name: "devops-toolkit-dot-github" }
            spec: { package: "xpkg.upbound.io/devops-toolkit/dot-github:v0.0.57" }
        } | to yaml | kubectl apply --filename -

    }

    if $db_config or $github_config or $app_config {

        print $"\n(ansi green_bold)Applying Kubernetes and Helm providers...(ansi reset)\n"

        {
            apiVersion: "rbac.authorization.k8s.io/v1"
            kind: "ClusterRole"
            metadata: {
                name: "crossplane-all"
                labels: {
                    "rbac.crossplane.io/aggregate-to-crossplane": "true"
                }
            }
            rules: [{
                apiGroups: ["*"]
                resources: ["*"]
                verbs: ["*"]
            }]
        } | to yaml | kubectl apply --filename -
    

        {
            apiVersion: "v1"
            kind: "ServiceAccount"
            metadata: {
                name: "crossplane-provider-helm"
                namespace: "crossplane-system"
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "rbac.authorization.k8s.io/v1"
            kind: "ClusterRoleBinding"
            metadata: {  name: crossplane-provider-helm }
            subjects: [{
                kind: "ServiceAccount"
                name: "crossplane-provider-helm"
                namespace: "crossplane-system"
            }]
            roleRef: {
                kind: "ClusterRole"
                name: "cluster-admin"
                apiGroup: "rbac.authorization.k8s.io"
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "pkg.crossplane.io/v1beta1"
            kind: "DeploymentRuntimeConfig"
            metadata: { name: "crossplane-provider-helm" }
            spec: { deploymentTemplate: { spec: {
                selector: {}
                template: { spec: {
                    containers: [{ name: "package-runtime" }]
                    serviceAccountName: "crossplane-provider-helm"
                } }
            } } }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Provider"
            metadata: { name: "crossplane-provider-helm" }
            spec: {
                package: "xpkg.upbound.io/crossplane-contrib/provider-helm:v0.19.0"
                runtimeConfigRef: { name: "crossplane-provider-helm" }
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "v1"
            kind: "ServiceAccount"
            metadata: {
                name: "crossplane-provider-kubernetes"
                namespace: "crossplane-system"
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "rbac.authorization.k8s.io/v1"
            kind: "ClusterRoleBinding"
            metadata: { name: "crossplane-provider-kubernetes" }
            subjects: [{
                kind: "ServiceAccount"
                name: "crossplane-provider-kubernetes"
                namespace: "crossplane-system"
            }]
            roleRef: {
                kind: "ClusterRole"
                name: "cluster-admin"
                apiGroup: "rbac.authorization.k8s.io"
            }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "pkg.crossplane.io/v1beta1"
            kind: "DeploymentRuntimeConfig"
            metadata: { name: "crossplane-provider-kubernetes" }
            spec: { deploymentTemplate: { spec: {
                selector: {}
                template: { spec: {
                    containers: [{ name: "package-runtime" }]
                    serviceAccountName: "crossplane-provider-kubernetes"
                } }
            } } }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Provider"
            metadata: { name: "crossplane-provider-kubernetes" }
            spec: {
                package: "xpkg.upbound.io/crossplane-contrib/provider-kubernetes:v0.15.0"
                runtimeConfigRef: { name: "crossplane-provider-kubernetes" }
            }
        } | to yaml | kubectl apply --filename -

    }

    if $db_config or $app_config or $github_config or $db_provider {
        wait crossplane
    }

    if ($db_config and $provider != "none") or $db_provider {

        if $provider == "google" {
            (
                apply providerconfig $provider
                    --google-project-id $provider_data.project_id
            )
        } else {
            apply providerconfig $provider
        }


    }

    if ($github_user | is-not-empty) and ($github_token | is-not-empty) {

        {
            apiVersion: v1,
            kind: Secret,
            metadata: {
                name: github,
                namespace: crossplane-system
            },
            type: Opaque,
            stringData: {
                credentials: $"{\"token\":\"($github_token)\",\"owner\":\"($github_user)\"}"
            }
        } | to yaml | kubectl apply --filename -

        if $app_config or $github_config {

            {
                apiVersion: "github.upbound.io/v1beta1",
                kind: ProviderConfig,
                metadata: {
                    name: default
                },
                spec: {
                    credentials: {
                        secretRef: {
                            key: credentials,
                            name: github,
                            namespace: crossplane-system,
                        },
                        source: Secret
                    }
                }
            } | to yaml | kubectl apply --filename -

        }

    }

}

# Deletes Crossplane resources and waits for managed resources to be cleaned up
#
# Examples:
# > main delete crossplane
# > main delete crossplane --kind AppClaim --name myapp --namespace default
def "main delete crossplane" [
    --kind: string,
    --name: string,
    --namespace: string
] {

    if ($kind | is-not-empty) and ($name | is-not-empty) and ($namespace | is-not-empty) { 
        kubectl --namespace $namespace delete $kind $name
    }

    print $"\nWaiting for (ansi green_bold)Crossplane managed resources(ansi reset) to be deleted...\n"
    
    mut command = { kubectl get managed --output name }
    if ($name | is-not-empty) {
        $command = {
            (
                kubectl get managed --output name
                    --selector $"crossplane.io/claim-name=($name)"
            )
        }
    }

    mut resources = (do $command)
    mut counter = ($resources | wc -l | into int)

    while $counter > 0 {
        print $"($resources)\nWaiting for remaining (ansi green_bold)($counter)(ansi reset) managed resources to be (ansi green_bold)removed(ansi reset)...\n"
        sleep 10sec
        $resources = (do $command)
        $counter = ($resources | wc -l | into int)
    }

}

def "main publish crossplane" [
    package: string
    --sources = ["compositions"]
    --version = ""
] {

    mut version = $version
    if $version == "" {
        $version = $env.VERSION
    }

    package generate --sources $sources

    crossplane xpkg login --token $env.UP_TOKEN

    (
        crossplane xpkg build --package-root package
            --package-file $"($package).xpkg"
    )

    (
        crossplane xpkg push --package-files $"($package).xpkg"
            $"xpkg.upbound.io/($env.UP_ACCOUNT)/dot-($package):($version)"
    )

    rm --force $"package/($package).xpkg"

    open config.yaml
        | upsert spec.package $"xpkg.upbound.io/devops-toolkit/dot-($package):($version)"
        | save config.yaml --force

}

def "package generate" [
    --sources = ["compositions"]
] {

    for source in $sources {
        kcl run $"kcl/($source).k" |
            save $"package/($source).yaml" --force
    }

}

def "apply providerconfig" [
    provider: string,
    --google-project-id: string,
] {

    if $provider == "google" {

        {
            apiVersion: "gcp.upbound.io/v1beta1"
            kind: "ProviderConfig"
            metadata: { name: "default" }
            spec: {
                projectID: $google_project_id
                credentials: {
                    source: "Secret"
                    secretRef: {
                        namespace: "crossplane-system"
                        name: "gcp-creds"
                        key: "creds"
                    }
                }
            }
        } | to yaml | kubectl apply --filename -

    } else if $provider == "aws" {

        {
            apiVersion: "aws.upbound.io/v1beta1"
            kind: "ProviderConfig"
            metadata: { name: default }
            spec: {
                credentials: {
                    source: Secret
                    secretRef: {
                        namespace: crossplane-system
                        name: aws-creds
                        key: creds
                    }
                }
            }
        } | to yaml | kubectl apply --filename -
    
    } else if $provider == "azure" {

        {
            apiVersion: "azure.upbound.io/v1beta1"
            kind: "ProviderConfig"
            metadata: { name: default }
            spec: {
                credentials: {
                    source: "Secret"
                    secretRef: {
                        namespace: "crossplane-system"
                        name: "azure-creds"
                        key: "creds"
                    }
                }
            }
        } | to yaml | kubectl apply --filename -

    } else if $provider == "upcloud" {

        {
            apiVersion: "provider.upcloud.com/v1beta1"
            kind: "ProviderConfig"
            metadata: { name: default }
            spec: {
                credentials: {
                    source: "Secret"
                    secretRef: {
                        namespace: "crossplane-system"
                        name: "upcloud-creds"
                        key: "creds"
                    }
                }
            }
        } | to yaml | kubectl apply --filename -

    }

}

def "apply db-provider" [
    provider: string
] {

    if $provider == "google" {

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Provider"
            metadata: { name: "provider-gcp-sql" }
            spec: { package: "xpkg.crossplane.io/crossplane-contrib/provider-gcp-sql:v1.14.0" }
        } | to yaml | kubectl apply --filename -

    } else if $provider == "aws" {

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Provider"
            metadata: { name: "provider-aws-rds" }
            spec: { package: "xpkg.crossplane.io/crossplane-contrib/provider-aws-rds:v1.23.0" }
        } | to yaml | kubectl apply --filename -

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Provider"
            metadata: { name: "provider-aws-ec2" }
            spec: { package: "xpkg.crossplane.io/crossplane-contrib/provider-aws-ec2:v1.23.0" }
        } | to yaml | kubectl apply --filename -

    } else if $provider == "azure" {

        {
            apiVersion: "pkg.crossplane.io/v1"
            kind: "Provider"
            metadata: { name: "provider-azure-dbforpostgresql" }
            spec: { package: "xpkg.crossplane.io/crossplane-contrib/provider-azure-dbforpostgresql:v1.13.0" }
        } | to yaml | kubectl apply --filename -

    }
}


# Waits for all Crossplane providers to be deployed and healthy
def "wait crossplane" [] {

    print $"\n(ansi green_bold)Waiting for Crossplane providers to be deployed...(ansi reset)\n"

    sleep 60sec

    (
        kubectl wait
            --for=condition=healthy provider.pkg.crossplane.io
            --all --timeout 30m
    )

}

def "setup google" [] {

    mut project_id = ""

    print $"\nInstalling (ansi green_bold)Crossplane Google Cloud Provider(ansi reset)...\n"

    if PROJECT_ID in $env {
        $project_id = $env.PROJECT_ID
    } else {

        gcloud auth login

        $project_id = $"dot-(date now | format date "%Y%m%d%H%M%S")"
        $env.PROJECT_ID = $project_id
        $"export PROJECT_ID=($project_id)\n" | save --append .env

        gcloud projects create $project_id

        start $"https://console.cloud.google.com/billing/enable?project=($project_id)"

        print $"
Select the (ansi yellow_bold)Billing account(ansi reset) and press the (ansi yellow_bold)SET ACCOUNT(ansi reset) button.
Press the (ansi yellow_bold)enter key(ansi reset) to continue.
"
        input

    }

    let sa_name = "devops-toolkit"

    let sa = $"($sa_name)@($project_id).iam.gserviceaccount.com"

    let project = $project_id

    do --ignore-errors {(
        gcloud iam service-accounts create $sa_name
            --project $project
    )}

    sleep 5sec

    (
        gcloud projects add-iam-policy-binding
            --role roles/admin $project
            --member $"serviceAccount:($sa)"
    )

    (
        gcloud iam service-accounts keys
            create gcp-creds.json --project $project
            --iam-account $sa
    )

    (
        kubectl --namespace crossplane-system
            create secret generic gcp-creds
            --from-file creds=./gcp-creds.json
    )

    { project_id: $project }

}

def "setup aws" [] {

    print $"\nInstalling (ansi green_bold)Crossplane AWS Provider(ansi reset)...\n"

    if AWS_ACCESS_KEY_ID not-in $env {
        $env.AWS_ACCESS_KEY_ID = input $"(ansi yellow_bold)Enter AWS Access Key ID: (ansi reset)"
    }
    $"export AWS_ACCESS_KEY_ID=($env.AWS_ACCESS_KEY_ID)\n"
        | save --append .env

    if AWS_SECRET_ACCESS_KEY not-in $env {
        $env.AWS_SECRET_ACCESS_KEY = input $"(ansi yellow_bold)Enter AWS Secret Access Key: (ansi reset)"
    }
    $"export AWS_SECRET_ACCESS_KEY=($env.AWS_SECRET_ACCESS_KEY)\n"
        | save --append .env

    $"[default]
aws_access_key_id = ($env.AWS_ACCESS_KEY_ID)
aws_secret_access_key = ($env.AWS_SECRET_ACCESS_KEY)
" | save aws-creds.conf --force

    (
        kubectl --namespace crossplane-system
            create secret generic aws-creds
            --from-file creds=./aws-creds.conf
            --from-literal $"accessKeyID=($env.AWS_ACCESS_KEY_ID)"
            --from-literal $"secretAccessKey=($env.AWS_SECRET_ACCESS_KEY)"
    )

}

def "setup azure" [
    --skip-login = false
] {

    print $"\nInstalling (ansi green_bold)Crossplane Azure Provider(ansi reset)...\n"

    mut azure_tenant = ""
    if AZURE_TENANT not-in $env {
        $azure_tenant = input $"(ansi yellow_bold)Enter Azure Tenant: (ansi reset)"
    } else {
        $azure_tenant = $env.AZURE_TENANT
    }
    $"export AZURE_TENANT=($azure_tenant)\n" | save --append .env

    if $skip_login == false { az login --tenant $azure_tenant }

    let subscription_id = (az account show --query id -o tsv)

    (
        az ad sp create-for-rbac --sdk-auth --role Owner
            --scopes $"/subscriptions/($subscription_id)"
            | save azure-creds.json --force
    )

    (
        kubectl --namespace crossplane-system
            create secret generic azure-creds
            --from-file creds=./azure-creds.json
    )

}

def "setup upcloud" [] {

    print $"\nInstalling (ansi green_bold)Crossplane UpCloud Provider(ansi reset)...\n"

    if UPCLOUD_USERNAME not-in $env {
        $env.UPCLOUD_USERNAME = input $"(ansi yellow_bold)UpCloud Username: (ansi reset)"
    }
    $"export UPCLOUD_USERNAME=($env.UPCLOUD_USERNAME)\n"
        | save --append .env

    if UPCLOUD_PASSWORD not-in $env {
        $env.UPCLOUD_PASSWORD = input $"(ansi yellow_bold)UpCloud Password: (ansi reset)"
    }
    $"export UPCLOUD_PASSWORD=($env.UPCLOUD_PASSWORD)\n"
        | save --append .env

    {
        apiVersion: "v1"
        kind: "Secret"
        metadata: {
            name: "upcloud-creds"
        }
        type: "Opaque"
        stringData: {
            creds: $"{\"username\": \"($env.UPCLOUD_USERNAME)\", \"password\": \"($env.UPCLOUD_PASSWORD)\"}"
        }
    } | to yaml | kubectl --namespace crossplane-system apply --filename -

}


================================================
FILE: devbox.json
================================================
{
  "packages": [
    "nushell@0.103.0",
    "teller@2.0.7",
    "git@2.49.0"
  ]
}



================================================
FILE: devbox.lock
================================================
{
  "lockfile_version": "1",
  "packages": {
    "git@2.49.0": {
      "last_modified": "2025-05-12T14:38:58Z",
      "resolved": "github:NixOS/nixpkgs/eaeed9530c76ce5f1d2d8232e08bec5e26f18ec1#git",
      "source": "devbox-search",
      "version": "2.49.0",
      "systems": {
        "aarch64-darwin": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/yrqzwxj67k2gzcdiwnk01y7i2ciby1ka-git-2.49.0",
              "default": true
            },
            {
              "name": "doc",
              "path": "/nix/store/lh6m9j3i9fsk60zpkkix7571jn10ly75-git-2.49.0-doc"
            }
          ],
          "store_path": "/nix/store/yrqzwxj67k2gzcdiwnk01y7i2ciby1ka-git-2.49.0"
        },
        "aarch64-linux": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/rs24n34brzvcmgld6mgfg0dd7ynv26pp-git-2.49.0",
              "default": true
            },
            {
              "name": "debug",
              "path": "/nix/store/wgki5jsxgg6lxqh98jgbj9dnwv7f68cw-git-2.49.0-debug"
            },
            {
              "name": "doc",
              "path": "/nix/store/3h7fnw0qhy92c8iyrv2i64r6wywsnjsa-git-2.49.0-doc"
            }
          ],
          "store_path": "/nix/store/rs24n34brzvcmgld6mgfg0dd7ynv26pp-git-2.49.0"
        },
        "x86_64-darwin": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/5pczg3s6h9pxckbrah2j7mzp85wvy04s-git-2.49.0",
              "default": true
            },
            {
              "name": "doc",
              "path": "/nix/store/c1004qcr8byaga2vb64mrmsam9kxfb86-git-2.49.0-doc"
            }
          ],
          "store_path": "/nix/store/5pczg3s6h9pxckbrah2j7mzp85wvy04s-git-2.49.0"
        },
        "x86_64-linux": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/z8z1mhfnvw40dwljqazxv0343sv5ds2g-git-2.49.0",
              "default": true
            },
            {
              "name": "debug",
              "path": "/nix/store/w547h0xwq9489xnqg1ddqlh1v71xvng8-git-2.49.0-debug"
            },
            {
              "name": "doc",
              "path": "/nix/store/rjjf5h1qcwgdxs9w23h6p0bhavgaknyh-git-2.49.0-doc"
            }
          ],
          "store_path": "/nix/store/z8z1mhfnvw40dwljqazxv0343sv5ds2g-git-2.49.0"
        }
      }
    },
    "github:NixOS/nixpkgs/nixpkgs-unstable": {
      "last_modified": "2025-04-13T09:22:33Z",
      "resolved": "github:NixOS/nixpkgs/18dd725c29603f582cf1900e0d25f9f1063dbf11?lastModified=1744536153&narHash=sha256-awS2zRgF4uTwrOKwwiJcByDzDOdo3Q1rPZbiHQg%2FN38%3D"
    },
    "nushell@0.103.0": {
      "last_modified": "2025-03-19T14:38:57Z",
      "resolved": "github:NixOS/nixpkgs/2a725d40de138714db4872dc7405d86457aa17ad#nushell",
      "source": "devbox-search",
      "version": "0.103.0",
      "systems": {
        "aarch64-darwin": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/7dcvklmwwvfjzqgak8ziv104lsff0cfv-nushell-0.103.0",
              "default": true
            }
          ],
          "store_path": "/nix/store/7dcvklmwwvfjzqgak8ziv104lsff0cfv-nushell-0.103.0"
        },
        "aarch64-linux": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/5apwqfpy0nkblh6bqvnyg40yhhvvx1y1-nushell-0.103.0",
              "default": true
            }
          ],
          "store_path": "/nix/store/5apwqfpy0nkblh6bqvnyg40yhhvvx1y1-nushell-0.103.0"
        },
        "x86_64-darwin": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/i4w79bzcxqcjv8qjb91s24sa7xwvalq8-nushell-0.103.0",
              "default": true
            }
          ],
          "store_path": "/nix/store/i4w79bzcxqcjv8qjb91s24sa7xwvalq8-nushell-0.103.0"
        },
        "x86_64-linux": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/wp7rmayh32cy2ypr6ya21b7g2dqpcqw2-nushell-0.103.0",
              "default": true
            }
          ],
          "store_path": "/nix/store/wp7rmayh32cy2ypr6ya21b7g2dqpcqw2-nushell-0.103.0"
        }
      }
    },
    "teller@2.0.7": {
      "last_modified": "2025-05-12T14:38:58Z",
      "resolved": "github:NixOS/nixpkgs/eaeed9530c76ce5f1d2d8232e08bec5e26f18ec1#teller",
      "source": "devbox-search",
      "version": "2.0.7",
      "systems": {
        "aarch64-darwin": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/gwcwxrmaqfymk6djq7lb1axx7zzhz04d-teller-2.0.7",
              "default": true
            }
          ],
          "store_path": "/nix/store/gwcwxrmaqfymk6djq7lb1axx7zzhz04d-teller-2.0.7"
        },
        "aarch64-linux": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/7klyxhcsv7y4lklwaw9szb4ayf5gk2a8-teller-2.0.7",
              "default": true
            }
          ],
          "store_path": "/nix/store/7klyxhcsv7y4lklwaw9szb4ayf5gk2a8-teller-2.0.7"
        },
        "x86_64-darwin": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/a35s1af9fgvbxvd4q2j2krhvpqzjbs6m-teller-2.0.7",
              "default": true
            }
          ],
          "store_path": "/nix/store/a35s1af9fgvbxvd4q2j2krhvpqzjbs6m-teller-2.0.7"
        },
        "x86_64-linux": {
          "outputs": [
            {
              "name": "out",
              "path": "/nix/store/mj7i4vzsbkchkadvapw98y29iw935py1-teller-2.0.7",
              "default": true
            }
          ],
          "store_path": "/nix/store/mj7i4vzsbkchkadvapw98y29iw935py1-teller-2.0.7"
        }
      }
    }
  }
}



================================================
FILE: dot.nu
================================================
#!/usr/bin/env nu

source ack.nu
source argo-workflows.nu
source argocd.nu
source atlas.nu
source backstage.nu
source cert-manager.nu
source cnpg.nu
source common.nu
source crossplane.nu
source external-secrets.nu
source gatekeeper.nu
source github.nu
source image.nu
source ingress.nu
source kro.nu
source kubernetes.nu
source kubevela.nu
source kyverno.nu
source port.nu
source prometheus.nu
source registry.nu
source storage.nu
source velero.nu
source mcp.nu

def main [] {}




================================================
FILE: external-secrets.nu
================================================
#!/usr/bin/env nu

# Installs External Secrets Operator (ESO) with optional cloud provider configuration
#
# Examples:
# > main apply external_secrets --provider google --google_project_id my-project
# > main apply external_secrets --provider azure --azure_key_vault_name my-vault
def "main apply external_secrets" [
    --provider: string               # Supported values: `google`, `azure`
    --google_project_id: string    # Used only if `provider` is `google`
    --azure_key_vault_name: string # Used only if `provider` is `azure`
] {

    print $"\nInstalling (ansi yellow_bold)External Secrets Operator \(ESO\)(ansi reset)...\n"

    (
        helm repo add external-secrets
            https://charts.external-secrets.io
    )

    helm repo update

    (
        helm upgrade --install
            external-secrets external-secrets/external-secrets
            --namespace external-secrets --create-namespace
            --wait
    )

    if $provider == "google" {

        {
            apiVersion: "external-secrets.io/v1beta1"
            kind: "ClusterSecretStore"
            metadata: { name: "google" }
            spec: { provider: { gcpsm: {
                auth: { secretRef: { secretAccessKeySecretRef: {
                    name: "gcp-creds"
                    key: "creds"
                    namespace: "crossplane-system"
                } } }
                projectID: $google_project_id
            } } }
        } | to yaml | kubectl apply --filename -

        start $"https://console.developers.google.com/apis/api/secretmanager.googleapis.com/overview?project=($google_project_id)"
            
        print $"
(ansi yellow_bold)ENABLE(ansi reset) the API.
Press the (ansi yellow_bold)enter key(ansi reset) to continue.
"
        input

    } else if $provider == "azure" {

        # FIXME: Uncomment and rewrite
        
        # az keyvault create --name $RESOURCE_GROUP \
        #     --resource-group $RESOURCE_GROUP

        # az keyvault key create --vault-name $RESOURCE_GROUP --name "ContosoFirstKey" --protection software

        # export AZURE_UPN=$(az ad user list | jq ".[0].userPrincipalName" -r)

        # export AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)

        # az role assignment create \
        #     --role "Key Vault Secrets Officer" \
        #     --assignee $AZURE_UPN \
        #     --scope "/subscriptions/$AZURE_SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.KeyVault/vaults/$RESOURCE_GROUP"

        {
            apiVersion: "external-secrets.io/v1beta1"
            kind: "ClusterSecretStore"
            metadata: { name: "azure" }
            spec: { provider: { azurekv: {
                authType: "ManagedIdentity"
                vaultUrl: $"https://($azure_key_vault_name).vault.azure.net"
            } } }
        } | to yaml | kubectl apply --filename -

    } else if $provider == "aws" {

        {
            apiVersion: "external-secrets.io/v1beta1"
            kind: "ClusterSecretStore"
            metadata: { name: "aws" }
            spec: {
                provider: { aws: {
                    service: "SecretsManager"
                    region: "us-east-1"
                    auth: { secretRef: {
                        accessKeyIDSecretRef: {
                            name: "aws-creds"
                            key: "accessKeyID"
                            namespace: "crossplane-system"
                        }
                        secretAccessKeySecretRef: {
                            name: "aws-creds"
                            key: "secretAccessKey"
                            namespace: "crossplane-system"
                        }
                    } }
                } }
            }
        } | to yaml | kubectl apply --filename -

    }

}



================================================
FILE: gatekeeper.nu
================================================
#!/usr/bin/env nu

# Installs Gatekeeper (Open Policy Agent) for Kubernetes policy enforcement
def "main apply opa" [] {

    (
        helm repo add gatekeeper
            https://open-policy-agent.github.io/gatekeeper/charts
    )

    helm repo update

    (
        helm upgrade --install gatekeeper gatekeeper/gatekeeper 
            --namespace gatekeeper-system --create-namespace
            --wait
    )

}



================================================
FILE: github.nu
================================================
#!/usr/bin/env nu

# Retrieves GitHub credentials (token and organization/username)
#
# Returns:
# A record with org and token fields, and saves values to .env file
def --env "main get github" [] {

    mut github_token = ""
    if "GITHUB_TOKEN" in $env {
        $github_token = $env.GITHUB_TOKEN
    } else if "REGISTRY_PASSWORD" in $env {
        $github_token = $env.REGISTRY_PASSWORD
    } else {
        let value = input $"(ansi green_bold)Enter GitHub token:(ansi reset) "
        $github_token = $value
    }
    $"export GITHUB_TOKEN=($github_token)\n" | save --append .env

    mut github_org = ""
    if "GITHUB_ORG" in $env {
        $github_org = $env.GITHUB_ORG
    } else if "REGISTRY_USER" in $env {
        $github_org = $env.REGISTRY_USER
    } else {
        let value = input $"(ansi green_bold)Enter GitHub user or organization where you forked the repo:(ansi reset) "
        $github_org = $value
    }
    $"export GITHUB_ORG=($github_org)\n" | save --append .env

    {org: $github_org, token: $github_token}

}



================================================
FILE: image.nu
================================================
#!/usr/bin/env nu

# Builds a container image
def "main build image" [
    tag: string                                  # The tag of the image (e.g., 0.0.1)
    --registry = "ghcr.io"                       # Image registry (e.g., ghcr.io)
    --registry_user = "vfarcic"                  # Image registry user (e.g., vfarcic)
    --image = "silly-demo"                       # Image name (e.g., silly-demo)
    --builder = "docker"                         # Image builder; currently supported are: `docker` and `kaniko`
    --push = true                                # Whether to push the image to the registry
    --dockerfile = "Dockerfile"                  # Path to Dockerfile
    --context = "."                              # Path to the context
] {

    if $builder == "docker" {

        (
            docker image build
                --tag $"($registry)/($registry_user)/($image):latest"
                --tag $"($registry)/($registry_user)/($image):($tag)"
                --file $dockerfile
                $context
        )

        if $push {

            docker image push $"($registry)/($registry_user)/($image):latest"

            docker image push $"($registry)/($registry_user)/($image):($tag)"

        }

    } else if $builder == "kaniko" {

        (
            executor --dockerfile=Dockerfile --context=.
                $"--destination=($registry)/($registry_user)/($image):($tag)"
                $"--destination=($registry)/($registry_user)/($image):latest"
        )

    } else {

        echo $"Unsupported builder: ($builder)"

    } 

}

# Retrieves a container registry address
def "main get container_registry" [] {

    mut registry = ""
    if "CONTAINER_REGISTRY" in $env {
        $registry = $env.CONTAINER_REGISTRY
    } else {
        let value = input $"(ansi green_bold)Enter container image registry \(e.g., `ghcr.io/vfarcic`\):(ansi reset) "
        $registry = $value
    }
    $"export CONTAINER_REGISTRY=($registry)\n" | save --append .env

    $registry

}



================================================
FILE: ingress.nu
================================================
#!/usr/bin/env nu

# Applies Ingress
#
# Examples:
# > main apply ingress contour --provider aws
def --env "main apply ingress" [
    class = "contour"   # The class of Ingress controller to apply. Available options: traefik, contour, nginx
    --provider = "none" # The cloud provider. Available options: aws, azure, google, upcloud, kind
    --env_prefix = ""   # Prefix to add to environment variables
] {

    if $class == "traefik" {

        (
            helm upgrade --install traefik traefik
                --repo https://helm.traefik.io/traefik
                --namespace traefik --create-namespace --wait
        )

    } else if $class == "contour" {

        (
            helm upgrade --install contour 
                oci://registry-1.docker.io/bitnamicharts/contour
                --namespace contour --create-namespace --wait
        )
    
    } else if $class == "nginx" {

        if $provider == "kind" {

            (
                kubectl apply
                    --filename https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
            )

            sleep 10sec

            (
                kubectl --namespace ingress-nginx wait
                    --for=condition=Available
                    deployment ingress-nginx-controller
            )

            sleep 5sec

        }

    } else {

        print $"(ansi red_bold)($class)(ansi reset) is not a supported."
        exit 1

    }

    main get ingress $class --provider $provider --env_prefix $env_prefix

}

# Gets the IP and hostname for an Ingress controller
#
# Examples:
# > main get ingress contour --provider aws
# > main get ingress nginx --provider kind --env_prefix TEST_
def "main get ingress" [
    class = "traefik" # The class of Ingress controller to apply. Available options: traefik, contour, nginx
    --provider: string # The cloud provider. Available options: aws, azure, google, upcloud, kind
    --env_prefix = ""  # Prefix to add to environment variables
] {

    mut service_name = $class

    if $class == "contour" {
        $service_name = "contour-envoy"
    }
    
    mut ingress_ip = ""
  
    if $provider == "aws" or $provider == "upcloud" {

        sleep 30sec

        let ingress_hostname = (
            kubectl --namespace $class
                get service $service_name --output yaml
                | from yaml
                | get status.loadBalancer.ingress.0.hostname
        )

        while $ingress_ip == "" {
            print "Waiting for Ingress Service IP..."
            sleep 10sec
            $ingress_ip = (dig +short $ingress_hostname)
        }

        $ingress_ip = $ingress_ip | lines | first

    } else if $provider == "kind" {

        $ingress_ip = "127.0.0.1"

    } else {

        while $ingress_ip == "" {

            print $"Waiting for ($class) Ingress IP from ($service_name) Service..."

            sleep 10sec

            $ingress_ip = (
                kubectl --namespace $class
                    get service $service_name --output yaml
                    | from yaml
                    | get status.loadBalancer.ingress.0.ip
            )

        }
    }

    $"export ($env_prefix)INGRESS_IP=($ingress_ip)\n" | save --append .env
    $"export ($env_prefix)INGRESS_HOST=($ingress_ip).nip.io\n" | save --append .env

    {ip: $ingress_ip, host: $"($ingress_ip).nip.io", class: $class}

}

# Deletes an Ingress controller
#
# Examples:
# > main delete ingress contour
# > main delete ingress traefik
def --env "main delete ingress" [
    class = "contour"   # The class of Ingress controller to apply. Available options: traefik, contour, nginx
] {

    print $"Uninstalling (ansi yellow_bold)Ingress(ansi reset)..."

    if $class == "traefik" {

        helm uninstall traefik --namespace traefik

    } else if $class == "contour" {

        helm uninstall contour  --namespace contour
    
    }

}


================================================
FILE: kro.nu
================================================
#!/usr/bin/env nu

# Installs Kro (Kubernetes Resource Orchestrator) for orchestrating Kubernetes resources
def "main apply kro" [] {

    (
        helm upgrade --install kro oci://ghcr.io/kro-run/kro/kro
            --namespace kro --create-namespace
    )

}


================================================
FILE: kubernetes.nu
================================================
#!/usr/bin/env nu

# Creates a Kubernetes cluster with the specified provider
#
# Examples:
# > main create kubernetes aws --name my-cluster --min_nodes 3 --max_nodes 5
# > main create kubernetes kind --name test-cluster
def --env "main create kubernetes" [
    provider: string  # The Kubernetes provider to use (aws, azure, google, upcloud, kind)
    --name = "dot"  # Name of the Kubernetes cluster
    --min-nodes = 2  # Minimum number of nodes in the cluster
    --max-nodes = 4  # Maximum number of nodes in the cluster
    --node-size = "small" # Supported values: small, medium, large
    --auth = true  # Whether to perform authentication with the cloud provider
    --enable-ingress = true  # Whether to enable ingress for the kind provider
] {

    $env.KUBECONFIG = $"($env.PWD)/kubeconfig-($name).yaml"
    $"export KUBECONFIG=($env.KUBECONFIG)\n" | save --append .env
    $"export KUBECONFIG_($name | str upcase)=($env.KUBECONFIG)\n" | save --append .env

    if $provider == "google" {

        (
            create gke --name $name --node_size $node_size
                --min_nodes $min_nodes --max_nodes $max_nodes
                --auth $auth
        )

    } else if $provider == "aws" {

        (
            create eks  --name $name --node_size $node_size
                --min_nodes $min_nodes --max_nodes $max_nodes
        )

    } else if $provider == "azure" {

        (
            create aks --name $name --node_size $node_size
                --min_nodes $min_nodes --max_nodes $max_nodes
        )

    } else if $provider == "upcloud" {

        (
            create upcloud --name $name --node_size $node_size
                --min_nodes $min_nodes --max_nodes $max_nodes
        )

    } else if $provider == "kind" {

        mut config = {
            kind: "Cluster"
            apiVersion: "kind.x-k8s.io/v1alpha4"
            name: $name
            nodes: [{
                role: "control-plane"
            }]
        }

        if $enable_ingress {
            $config = $config | merge {
                nodes: [{
                    role: "control-plane"
                    kubeadmConfigPatches: ['kind: InitConfiguration
nodeRegistration:
  kubeletExtraArgs:
    node-labels: "ingress-ready=true"'
                    ]
                    extraPortMappings: [{
                        containerPort: 80
                        hostPort: 80
                        protocol: "TCP"
                    }, {
                        containerPort: 443
                        hostPort: 443
                        protocol: "TCP"
                    }]
                }]
            }
        }
        
        $config | to yaml | save $"kind.yaml" --force

        kind create cluster --config kind.yaml
    
    } else {

        print $"(ansi red_bold)($provider)(ansi reset) is not a supported."
        exit 1

    }

    $env.KUBECONFIG

}

# Lists the required packages for Kubernetes functionality
#
# Examples:
# > main packages kubernetes
def "main packages kubernetes" [] {

    print $"(ansi yellow_bold)Following Nix packages are required(ansi reset):
* kind
* kubectl
* awscli2
* eksctl
* google-cloud-sdk
* azure-cli
"

print $"(ansi yellow_bold)Following tools not available as Nix packages are required(ansi reset):
* upctl
"

}

# Destroys a Kubernetes cluster created with the specified provider
#
# Examples:
# > main destroy kubernetes aws --name my-cluster
# > main destroy kubernetes google --name test-cluster --delete_project false
def "main destroy kubernetes" [
    provider: string  # The Kubernetes provider to delete (aws, azure, google, upcloud, kind)
    --name = "dot"  # Name of the Kubernetes cluster to destroy
    --delete_project = true  # Whether to delete the associated cloud project
] {

    if $provider == "google" {

        rm --force $env.KUBECONFIG

        (
            gcloud container clusters delete $name
                --project $env.PROJECT_ID --zone us-east1-b --quiet
        )

        if $delete_project {
            gcloud projects delete $env.PROJECT_ID --quiet
        }
    
    } else if $provider == "aws" {

        let region = "us-east-1"

        (
            eksctl delete addon --name aws-ebs-csi-driver
                --cluster $name --region $region
        )

        (
            eksctl delete nodegroup --name primary
                --cluster $name --drain=false
                --region $region --parallel 10 --wait
        )

        (
            eksctl delete cluster
                --config-file $"eksctl-config-($name).yaml"
                --wait
        )

    } else if $provider == "azure" {

        (
            az aks delete --resource-group $env.RESOURCE_GROUP
                --name $name --yes
        )

        if $delete_project {

            az group delete --name $env.RESOURCE_GROUP --yes

        }

    } else if $provider == "upcloud" {

        print $"Deleting (ansi yellow_bold)Kubernetes(ansi reset)..."

        upctl kubernetes delete $name

        print $"Waiting for (ansi yellow_bold)10 minutes(ansi reset) to fully clean up the cluster..."

        sleep 600sec

        print $"Deleting (ansi yellow_bold)network(ansi reset)..."

        upctl network delete $name

    } else if $provider == "kind" {

        kind delete cluster --name $name

    }

    if "KUBECONFIG" in $env {
        rm --force $env.KUBECONFIG
    }

}

# Creates Kubernetes credentials in a kubeconfig file
#
# Examples:
# > main create kubernetes_creds --source_kuberconfig kubeconfig.yaml --destination_kuberconfig new-kubeconfig.yaml
def "main create kubernetes_creds" [
    --source_kuberconfig = "kubeconfig.yaml"  # Path to the source kubeconfig file
    --destination_kuberconfig = "kubeconfig_new.yaml"  # Path to the destination kubeconfig file
] {

    {
        apiVersion: "v1"
        kind: "ServiceAccount"
        metadata: {
            name: "creds"
            namespace: "kube-system"
        }
    } | to yaml | kubectl --kubeconfig $source_kuberconfig apply --filename -

    {
        apiVersion: "v1"
        kind: "Secret"
        metadata: {
            name: "creds"
            namespace: "kube-system"
            annotations: {
                "kubernetes.io/service-account.name": "creds"
            }
        }
        type: "kubernetes.io/service-account-token"
    } | to yaml | kubectl --kubeconfig $source_kuberconfig apply --filename -

    {
        apiVersion: "rbac.authorization.k8s.io/v1"
        kind: "ClusterRoleBinding"
        metadata: {
            name: "creds"
        }
        subjects: [{
            kind: "ServiceAccount"
            name: "creds"
            namespace: "kube-system"
        }]
        roleRef: {
            kind: "ClusterRole"
            name: "cluster-admin"
            apiGroup: "rbac.authorization.k8s.io"
        }
    }
        | to yaml
        | kubectl --kubeconfig $source_kuberconfig apply --filename -

    let kube_ca_data = open $source_kuberconfig
        | get clusters.0.cluster.certificate-authority-data

    let kube_url = open $source_kuberconfig
        | get clusters.0.cluster.server

    let token_encoded = (
        kubectl
            --kubeconfig $source_kuberconfig
            --namespace kube-system
            get secret creds --output yaml
    )
        | from yaml
        | get data.token

    let token = ($token_encoded | decode base64 | decode)

    {
        apiVersion: "v1"
        kind: "Config"
        clusters: [{
            name: "default-cluster"
            cluster: {
                certificate-authority-data: $kube_ca_data
                server: $"($kube_url):443"
            }
        }]
        contexts: [{
            name: "default-context"
            context: {
                cluster: "default-cluster"
                namespace: "default"
                user: "default-user"
            }
        }]
        current-context: "default-context"
        users: [{
            name: "default-user"
            user: {
                token: $token
            }
        }]
    } | to yaml | save $source_kuberconfig --force

}

# Creates a UpCloud Kubernetes cluster
#
# Examples:
# > create upcloud --name my-cluster --node_size medium --min_nodes 3 --max_nodes 5
def --env "create upcloud" [
    --name = "dot"  # Name of the Kubernetes cluster
    --node_size = "small" # Supported values: small, medium, large
    --min_nodes = 2  # Minimum number of nodes in the cluster
    --max_nodes = 4  # Maximum number of nodes in the cluster
] {

print $"
Visit https://signup.upcloud.com/?promo=devops50 to (ansi yellow_bold)sign up(ansi reset) and get $50+ credits.
Make sure that (ansi yellow_bold)Allow API connections from all networks(ansi reset) is checked inside the https://hub.upcloud.com/account/overview page.
Install `(ansi yellow_bold)upctl(ansi reset)` from https://upcloudltd.github.io/upcloud-cli if you do not have it already.
Press the (ansi yellow_bold)enter key(ansi reset) to continue.
"
        input

        mut upcloud_username = ""
        if UPCLOUD_USERNAME in $env {
            $upcloud_username = $env.UPCLOUD_USERNAME
        } else {
            $upcloud_username = input $"(ansi green_bold)Enter UpCloud username: (ansi reset)"
            $env.UPCLOUD_USERNAME = $upcloud_username
        }
        $"export UPCLOUD_USERNAME=($upcloud_username)\n"
            | save --append .env
    
        mut upcloud_password = ""
        if UPCLOUD_PASSWORD in $env {
            $upcloud_password = $env.UPCLOUD_PASSWORD
        } else {
            $upcloud_password = input $"(ansi green_bold)Enter UpCloud password: (ansi reset)" --suppress-output
            $env.UPCLOUD_PASSWORD = $upcloud_password
        }
        $"export UPCLOUD_PASSWORD=($upcloud_password)\n"
            | save --append .env
        print ""

        mut vm_size = "2xCPU-4GB"
        if $node_size == "medium" {
            $vm_size = "4xCPU-8GB"
        } else if $node_size == "large" {
            $vm_size = "8xCPU-32GB"
        }

        print $"Creating (ansi yellow_bold)network(ansi reset)..."

        do --ignore-errors {(
            upctl network create --name $name --zone us-nyc1
                --ip-network address="10.0.1.0/24,dhcp=true"
        )}

        print $"Creating (ansi yellow_bold)Kubernetes(ansi reset) cluster..."

        (
            upctl kubernetes create --name $name --zone us-nyc1
                --node-group $"count=($min_nodes),name=dot,plan=($vm_size)"
                --plan dev-md  --network $name --version "1.30"
                --kubernetes-api-allow-ip "0.0.0.0/0" --wait
        )

        print $"Getting (ansi yellow_bold)kubeconfig(ansi reset)..."

        (
            upctl kubernetes config $name --output yaml
                --write $env.KUBECONFIG
        )

        print $"Waiting for (ansi yellow_bold)5 minutes(ansi reset) to fully set up the cluster..."

        sleep 300sec

}

# Creates an Azure Kubernetes Service (AKS) cluster
#
# Examples:
# > create aks --name my-cluster --node_size medium --min_nodes 3 --max_nodes 5
def --env "create aks" [
    --name = "dot",  # Name of the Kubernetes cluster
    --min_nodes = 2,  # Minimum number of nodes in the cluster
    --max_nodes = 4,  # Maximum number of nodes in the cluster
    --node_size = "small" # Supported values: small, medium, large
    --auth = true  # Whether to perform authentication with Azure
] {

    mut tenant_id = ""
    let location = "eastus"

    if AZURE_TENANT in $env {
        $tenant_id = $env.AZURE_TENANT
    } else {
        $tenant_id = input $"(ansi green_bold)Enter Azure Tenant ID: (ansi reset)"
    }

    if $auth {
        az login --tenant $tenant_id
    }

    mut resource_group = ""
    if RESOURCE_GROUP in $env {
        $resource_group = $env.RESOURCE_GROUP
    } else {
        $resource_group = $"dot-(date now | format date "%Y%m%d%H%M%S")"
        $env.RESOURCE_GROUP = $resource_group
        $"export RESOURCE_GROUP=($resource_group)\n" | save --append .env
        az group create --name $resource_group --location $location
    }
    mut vm_size = "Standard_B2s"
    if $node_size == "medium" {
        $vm_size = "Standard_B4ms"
    } else if $node_size == "large" {
        $vm_size = "Standard_B8ms"
    }

    (
        az aks create --resource-group $resource_group --name $name
            --node-count $min_nodes --min-count $min_nodes
            --max-count $max_nodes
            --node-vm-size $vm_size
            --enable-managed-identity --generate-ssh-keys
            --enable-cluster-autoscaler --yes
    )

    (
        az aks get-credentials --resource-group $resource_group
            --name $name --file $env.KUBECONFIG
    )

}

# Creates a Google Kubernetes Engine (GKE) cluster
#
# Examples:
# > create gke --name my-cluster --node_size medium --min_nodes 3 --max_nodes 5 --auth true
def --env "create gke" [
    --name = "dot",  # Name of the Kubernetes cluster
    --min_nodes = 2,  # Minimum number of nodes in the cluster
    --max_nodes = 4,  # Maximum number of nodes in the cluster
    --node_size = "small" # Supported values: small, medium, large
    --auth = true  # Whether to perform authentication with Google Cloud
] {

    if $auth {
        gcloud auth login
    }

    mut project_id = ""
    if PROJECT_ID in $env and not $auth {
        $project_id = $env.PROJECT_ID
    } else {
        $project_id = $"dot-(date now | format date "%Y%m%d%H%M%S")"
        $env.PROJECT_ID = $project_id
        $"export PROJECT_ID=($project_id)\n" | save --append .env

        gcloud projects create $project_id

        start $"https://console.cloud.google.com/marketplace/product/google/container.googleapis.com?project=($project_id)"

        print $"
    (ansi yellow_bold)ENABLE(ansi reset) the API.
    Press the (ansi yellow_bold)enter key(ansi reset) to continue.
    "
        input
    }

    mut vm_size = "e2-standard-2"
    if $node_size == "medium" {
        $vm_size = "e2-standard-4"
    } else if $node_size == "large" {
        $vm_size = "e2-standard-8"
    }

    (
        gcloud container clusters create $name --project $project_id
            --zone us-east1-b --machine-type $vm_size
            --enable-autoscaling --num-nodes $min_nodes
            --min-nodes $min_nodes --max-nodes $max_nodes
            --enable-network-policy --no-enable-autoupgrade
    )

    (
        gcloud container clusters get-credentials $name
            --project $project_id --zone us-east1-b
    )

}

# Creates an Amazon Elastic Kubernetes Service (EKS) cluster
#
# Examples:
# > create eks --name my-cluster --node_size medium --min_nodes 3 --max_nodes 5
def --env "create eks" [
    --name = "dot",  # Name of the Kubernetes cluster
    --min_nodes = 2,  # Minimum number of nodes in the cluster
    --max_nodes = 4,  # Maximum number of nodes in the cluster
    --node_size = "small" # Supported values: small, medium, large
] {

    let region = "us-east-1"

    mut aws_access_key_id = ""
    if AWS_ACCESS_KEY_ID in $env {
        $aws_access_key_id = $env.AWS_ACCESS_KEY_ID
    } else {
        $aws_access_key_id = input $"(ansi green_bold)Enter AWS Access Key ID: (ansi reset)"
    }
    $"export AWS_ACCESS_KEY_ID=($aws_access_key_id)\n"
        | save --append .env

    mut aws_secret_access_key = ""
    if AWS_SECRET_ACCESS_KEY in $env {
        $aws_secret_access_key = $env.AWS_SECRET_ACCESS_KEY
    } else {
        $aws_secret_access_key = input $"(ansi green_bold)Enter AWS Secret Access Key: (ansi reset)" --suppress-output
    }
    $"export AWS_SECRET_ACCESS_KEY=($aws_secret_access_key)\n"
        | save --append .env

    let aws_account_id = (
        aws sts get-caller-identity --query "Account" 
            --output text
    )
    $"export AWS_ACCOUNT_ID=($aws_account_id)\n"
        | save --append .env

    $"[default]
aws_access_key_id = ($aws_access_key_id)
aws_secret_access_key = ($aws_secret_access_key)
" | save aws-creds.conf --force

    mut vm_size = "t3.medium"
    if $node_size == "medium" {
        $vm_size = "t3.xlarge"
    } else if $node_size == "large" {
        $vm_size = "t3.2xlarge"
    }

    {
        apiVersion: "eksctl.io/v1alpha5"
        kind: "ClusterConfig"
        metadata: {
            name: $name
            region: $region
            version: "1.31"
        }
        managedNodeGroups: [{
            name: "primary"
            instanceType: $vm_size
            minSize: $min_nodes
            maxSize: $max_nodes
            iam: {
                withAddonPolicies: {
                    autoScaler: true
                    ebs: true
                }
            }
        }]
    } | to yaml | save $"eksctl-config-($name).yaml" --force

    (
        eksctl create cluster
            --config-file $"eksctl-config-($name).yaml"
            --kubeconfig $env.KUBECONFIG
    )

    (
        eksctl create addon --name aws-ebs-csi-driver
            --cluster $name
            --service-account-role-arn $"arn:aws:iam::($aws_account_id):role/AmazonEKS_EBS_CSI_DriverRole"
            --region $region --force
    )

    (
        kubectl patch storageclass gp2
            --patch '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
    )

    (
        eksctl utils associate-iam-oidc-provider --cluster $name
            --region $region --approve
    )

    let oidc_provider = (
        aws eks describe-cluster --name $name --region $region
            --query "cluster.identity.oidc.issuer"
            --output text | str replace "https://" ""
    )
    $"export OIDC_PROVIDER=($oidc_provider)\n"
        | save --append .env

}


================================================
FILE: kubevela.nu
================================================
#!/usr/bin/env nu

# Installs KubeVela platform
#
# Examples:
# > main apply kubevela example.com --ingress_class nginx
def "main apply kubevela" [
    host: string
    --ingress_class = "nginx"
] {

    vela install

    # (
    #     vela addon enable velaux
    #         $"domain=vela.($host)"
    #         $"gatewayDriver=($ingress_class)"
    # )

    # start $"http://($host)"

}



================================================
FILE: kyverno.nu
================================================
#!/usr/bin/env nu

# Installs Kyverno policy engine for Kubernetes
def "main apply kyverno" [] {

    helm repo add kyverno https://kyverno.github.io/kyverno

    helm repo update

    (
        helm upgrade --install kyverno kyverno/kyverno
            --namespace kyverno --create-namespace
            --wait
    )

}



================================================
FILE: mcp.nu
================================================
#!/usr/bin/env nu

# Creates the MCP servers configuration file.
#
# Usage:
# > main apply mcp
# > main apply mcp --location my-custom-path.json
# > main apply mcp --location [ my-custom-path.json, another-path.json ]
# > main apply mcp --memory-file-path /custom/memory.json --anthropic-api-key XYZ --github-token ABC
# > main apply mcp --enable-playwright
# > main apply mcp --enable-context7
#
def --env "main apply mcp" [
    --location: list<string> = ["mcp.json"], # Path(s) where the MCP servers configuration file will be created (e.g., `".cursor/mcp.json", ".roo/mcp.json", ".vscode/mcp.json", "mcp.json"`)
    --memory-file-path: string = "",         # Path to the memory file for the memory MCP server. If empty, defaults to an absolute path for 'memory.json' in CWD.
    --anthropic-api-key: string = "",        # Anthropic API key for the taskmaster-ai MCP server. If empty, $env.ANTHROPIC_API_KEY is used if set.
    --github-token: string = "",             # GitHub Personal Access Token for the github MCP server. If empty, $env.GITHUB_TOKEN is used if set.
    --enable-playwright = false,             # Enable Playwright MCP server for browser automation
    --enable-context7 = false                # Enable Context7 MCP server
] {
    let resolved_memory_file_path = if $memory_file_path == "" {
        (pwd) | path join "memory.json" | path expand
    } else {
        $memory_file_path
    }

    let resolved_anthropic_api_key = if $anthropic_api_key != "" {
        $anthropic_api_key
    } else if ("ANTHROPIC_API_KEY" in $env) {
        $env.ANTHROPIC_API_KEY
    } else {
        ""
    }

    let resolved_github_token = if $github_token != "" {
        $github_token
    } else if ("GITHUB_TOKEN" in $env) {
        $env.GITHUB_TOKEN
    } else {
        ""
    }

    mut mcp_servers_map = {}

    $mcp_servers_map = $mcp_servers_map | upsert "memory" {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-memory"],
        env: {
            MEMORY_FILE_PATH: $resolved_memory_file_path
        }
    }

    if $enable_context7 {
        $mcp_servers_map = $mcp_servers_map | upsert "context7" {
            command: "npx",
            args: ["-y", "@upstash/context7-mcp"]
        }
    }

    if $resolved_anthropic_api_key != "" {
        $mcp_servers_map = $mcp_servers_map | upsert "taskmaster-ai" {
            command: "npx",
            args: ["-y", "--package=task-master-ai", "task-master-ai"],
            env: {
                ANTHROPIC_API_KEY: $resolved_anthropic_api_key
            }
        }
    }

    if $resolved_github_token != "" {
        $mcp_servers_map = $mcp_servers_map | upsert "github" {
            url: "https://api.githubcopilot.com/mcp/",
            headers: {
                Authorization: $"Bearer ($resolved_github_token)"
            }
        }
    }

    if $enable_playwright {
        $mcp_servers_map = $mcp_servers_map | upsert "playwright" {
            command: "npx",
            args: ["-y", "@playwright/mcp@latest"]
        }
    }

    let config_record = { mcpServers: $mcp_servers_map }

    for $output_location in $location {
        let parent_dir = $output_location | path dirname
        if not ($parent_dir | path exists) {
            mkdir $parent_dir
            print $"Created directory: ($parent_dir)"
        }
        $config_record | to json --indent 2 | save -f $output_location
        print $"MCP servers configuration file created at: ($output_location)"
    }
} 


================================================
FILE: memory.json
================================================
{"type":"entity","name":"Script change verification","observations":["Always check whether a change to a script works by running it with --help."],"entityType":"development guideline"}
{"type":"entity","observations":["When creating or working on scripts, always follow patterns from1 other scripts in this project."],"entityType":"guideline","name":"scripting_guidelines"}
{"type":"entity","name":"tool_usage_guideline_nushell","entityType":"guideline","observations":["When needing more information about Nushell, use Context7."]}
{"type":"entity","observations":["After every change to a script, validate it by running `./dot.nu <function_name> --help`. For example, for a function `main apply mcp` in a script, the validation command would be `./dot.nu apply mcp --help`."],"entityType":"guideline","name":"script_validation_guideline_dot_nu"}
{"type":"entity","entityType":"guideline","observations":["Always keep an extra line after `#!/usr/bin/env nu`."],"name":"nushell_script_formatting_guideline"}
{"type":"entity","name":"nushell_argument_comment_style","entityType":"guideline","observations":["Keep all comments for Nushell function arguments on the same line as the argument definition. For example, `arg_name: type, # Comment here` or `--flag_name: type = default, # Comment here`."]}
{"type":"entity","observations":["Do not manually create a 'Flags:' section in Nushell script docstrings. Nushell auto-generates flag help text from the comments written directly next to the flag definitions in the function signature."],"name":"nushell_docstring_flags_section","entityType":"guideline"}
{"type":"entity","name":"git_push_on_completion","entityType":"workflow_guideline","observations":["When the user indicates that the work is done (or uses a similar expression), push ALL accumulated changes to the Git repository."]}
{"type":"entity","entityType":"tool_preference_guideline","name":"git_vs_github_mcp_usage","observations":["Use the `git` CLI (via terminal commands) for standard Git operations like commit, push, pull, branch, etc. Use the GitHub MCP tools for interacting with GitHub-specific features like issues, pull requests, repository settings, and GitHub search."]}


================================================
FILE: port.nu
================================================
#!/usr/bin/env nu

# Installs Port.io for software catalog management
#
# Examples:
# > main apply port myuser my-repo
def "main apply port" [
    github_user: string
    github_repo: string
] {

    start "https://getport.io"
    
    print $"
(ansi yellow_bold)Sign Up(ansi reset) \(if not already registered\) and (ansi yellow_bold)Log In(ansi reset) to Port.
Press any key to continue.
"
    input

    mut port_client_id = ""
    if "PORT_CLIENT_ID" not-in $env {
        $port_client_id = input $"(ansi green_bold)Enter Port Client ID:(ansi reset)"
    } else {
        $port_client_id = $env.PORT_CLIENT_ID
    }
    $"export PORT_CLIENT_ID=($port_client_id)\n"
        | save --append .env

    mut port_client_secret = ""
    if "PORT_CLIENT_ID" not-in $env {
        $port_client_secret = input $"(ansi green_bold)Enter Port Client Secret:(ansi reset)"
    } else {
        $port_client_secret = $env.PORT_CLIENT_SECRET
    }
    $"export PORT_CLIENT_SECRET=($port_client_secret)\n"
        | save --append .env

    print $"
Install (ansi green_bold)Port's GitHub app(ansi reset).
Open https://docs.getport.io/build-your-software-catalog/sync-data-to-catalog/git/github/#installation for more information.
Press any key to continue.
"
    input

    (
        helm upgrade --install port-k8s-exporter port-k8s-exporter
            --repo https://port-labs.github.io/helm-charts
            --namespace port-k8s-exporter --create-namespace
            --set $"secret.secrets.portClientId=($port_client_id)"
            --set $"secret.secrets.portClientSecret=($port_client_secret)"
            --set stateKey="k8s-exporter"
            --set createDefaultResources=false
            --set "extraEnv[0].name"="dot"
            --set "extraEnv[0].value"=dot
            --wait
    )

}

# Guides cleanup of Port.io resources
def "main delete port" [] {

    print $"
Delete all items from the (ansi yellow_bold)Catalog(ansi reset), (ansi yellow_bold)Self-service(ansi reset), and (ansi yellow_bold)Builder > Data model(ansi reset) pages in Port's Web UI.
Press any key to continue.
"
    input

}


================================================
FILE: prometheus.nu
================================================
#!/usr/bin/env nu

def apply_prometheus [ingress_class: string, ingress_host: string] {

    open values-prometheus.yaml
        | upsert grafana.ingress.ingressClassName $ingress_class
        | upsert grafana.ingress.hosts.0 $"grafana.($ingress_host)"
        | upsert prometheus.ingress.ingressClassName $ingress_class
        | upsert prometheus.ingress.hosts.0 $"prometheus.($ingress_host)"
        | save values-prometheus.yaml --force

    (
        helm upgrade --install
            kube-prometheus-stack kube-prometheus-stack
            --repo https://prometheus-community.github.io/helm-charts
            --values values-prometheus.yaml
            --namespace prometheus-system --create-namespace
            --wait
    )

}


================================================
FILE: registry.nu
================================================
#!/usr/bin/env nu

# Returns registry information.
#
# Example: `{server: "my-server", user: "my-user", email: "my-email", password: "my-password"}`
def --env "main get registry" []: [
    string -> record 
] {

    mut server = ""
    if "REGISTRY_SERVER" not-in $env {
        $server = input $"(ansi green_bold)Enter container image registry \(e.g., ghcr.io\):(ansi reset) "
    } else {
        $server = $env.REGISTRY_SERVER
    }
    $"export REGISTRY_SERVER=($server)\n" | save --append .env

    mut user = ""
    if "REGISTRY_USER" not-in $env {
        $user = input $"(ansi green_bold)Enter container image registry user \(e.g., vfarcic\):(ansi reset) "
    } else {
        $user = $env.REGISTRY_USER
    }
    $"export REGISTRY_USER=($user)\n" | save --append .env

    mut email = ""
    if "REGISTRY_EMAIL" not-in $env {
        $email = input $"(ansi green_bold)Enter container image registry email \(e.g., viktor@farcic.com\):(ansi reset) "
    } else {
        $email = $env.REGISTRY_EMAIL
    }
    $"export REGISTRY_EMAIL=($email)\n" | save --append .env

    mut password = ""
    if "REGISTRY_PASSWORD" not-in $env {
        $password = input $"(ansi green_bold)Enter container image registry token:(ansi reset) "
    } else {
        $password = $env.REGISTRY_PASSWORD
    }
    $"export REGISTRY_PASSWORD=($password)\n" | save --append .env

    {server: $server, user: $user, email: $email, password: $password}

}



================================================
FILE: renovate.json
================================================
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended"
  ],
  "crossplane": {
    "fileMatch": ["crossplane/.+\\.yaml$"]
  },
  "packageRules": [
    {
        "matchManagers": ["crossplane"],
        "matchFileNames": ["providers/**"],
        "groupName": "providers"
    }
  ]
}



================================================
FILE: storage.nu
================================================
#!/usr/bin/env nu

# Creates cloud storage resources based on the specified provider
#
# Returns:
# A record with the storage bucket name
def create_storage [provider: string, auth = true] {

    let bucket = $"dot-(date now | format date "%Y%m%d%H%M%S")"
    $"export STORAGE_NAME=($bucket)\n" | save --append .env

    if $provider == "aws" {

        (
            aws s3api create-bucket --bucket $bucket
                --region us-east-1
        )
        
        aws iam create-user --user-name velero
        
        (
            aws iam put-user-policy --user-name velero
                --policy-name velero
                --policy-document file://aws-storage-policy.json
        )
        
        let access_key_id = (
            aws iam create-access-key --user-name velero
                | from json
                | get AccessKey.AccessKeyId
        )
        $"export STORAGE_ACCESS_KEY_ID=($access_key_id)\n"
            | save --append .env

    } else if $provider == "google" {

        if $auth {
            gcloud auth login
        }

        (
            gcloud storage buckets create $"gs://($bucket)"
                --project $env.PROJECT_ID --location us-east1
        )

        (
            gcloud iam service-accounts create velero
                --project $env.PROJECT_ID --display-name "Velero"
        )

        let sa_email = $"velero@($env.PROJECT_ID).iam.gserviceaccount.com"

        (
            gcloud iam roles create velero.server
                --project $env.PROJECT_ID
                --file google-permissions.yaml
        )

        (
            gcloud projects add-iam-policy-binding $env.PROJECT_ID
                --member $"serviceAccount:($sa_email)"
                --role $"projects/($env.PROJECT_ID)/roles/velero.server"
        )

        (
            gsutil iam ch
                $"serviceAccount:($sa_email):objectAdmin"
                $"gs://($bucket)"
        )

        (
            gcloud iam service-accounts keys create
                google-creds.json --iam-account $sa_email
        )

    } else if $provider == "azure" {

        let sa_id = $"velero(uuidgen | cut -d '-' -f5 | tr '[A-Z]' '[a-z]')"
        $"export AZURE_SA_ID=($sa_id)\n" | save --append .env

        (
            az storage account create
                --name $sa_id
                --resource-group $env.RESOURCE_GROUP
                --sku Standard_GRS --encryption-services blob
                --https-only true --min-tls-version TLS1_2
                --kind BlobStorage --access-tier Hot
        )

        (
            az storage container create --name velero
                --public-access off --account-name $sa_id
                --resource-group $env.RESOURCE_GROUP
        )

        let subscription_id = (az account list 
            --query '[?isDefault].id' --output tsv)

        open azure-permissions.json
            | upsert AssignableScopes.0 $"/subscriptions/($subscription_id)"
            | save azure-permissions.json --force

        (
            az role definition create
                --role-definition azure-permissions.json
                --resource-group $env.RESOURCE_GROUP
        )

        let tenant_id = (az account list
            --query '[?isDefault].tenantId' --output tsv)
        
        let client_secret = (az ad sp create-for-rbac
            --name velero --role Velero --query 'password'
            --output tsv
            --scopes  $"/subscriptions/($subscription_id)"
            --resource-group $env.RESOURCE_GROUP
        )

        let client_id = (az ad sp list --display-name "velero"
            --query '[0].appId' --output tsv)
        $"export AZURE_CLIENT_ID=($client_id)\n"
            | save --append .env

        $"AZURE_SUBSCRIPTION_ID=($subscription_id)
AZURE_TENANT_ID=($tenant_id)
AZURE_CLIENT_ID=($client_id)
AZURE_CLIENT_SECRET=($client_secret)
AZURE_RESOURCE_GROUP=($env.RESOURCE_GROUP)
AZURE_CLOUD_NAME=AzurePublicCloud" | save azure-creds.env --force

    } else {

        print $"(ansi red_bold)($provider)(ansi reset) is not a supported."
        exit 1

    }

    {name: $bucket}

}

# Destroys cloud storage resources created for the specified provider
def destroy_storage [provider: string, storage_name: string, delete_project = true] {

    if $provider == "aws" {

        do --ignore-errors {
            
            (
                aws iam delete-access-key --user-name velero
                    --access-key-id $env.STORAGE_ACCESS_KEY_ID
                    --region us-east-1
            )

            (
                aws iam delete-user-policy --user-name velero
                    --policy-name velero
                    --region us-east-1
            )

            aws iam delete-user --user-name velero

        }

        (        
            aws s3 rm $"s3://($storage_name)" --recursive
                --include "*"
        )

        (
            aws s3api delete-bucket --bucket $storage_name
                --region us-east-1
        )
    
    } else if $provider == "google" {

        (
            gcloud storage rm $"gs://($storage_name)" --recursive
                --project $env.PROJECT_ID
        )

        if $delete_project {
            gcloud projects delete $env.PROJECT_ID --quiet
        }

    } else if $provider == "azure" {

        (
            az storage container delete --name velero
                --account-name $env.AZURE_SA_ID
        )

        (
            az storage account delete
                --name $env.AZURE_SA_ID
                --resource-group $env.RESOURCE_GROUP --yes
        )

        az ad sp delete --id $env.AZURE_CLIENT_ID
        
        az role definition delete --name Velero

    } else {

        print $"(ansi red_bold)($provider)(ansi reset) is not a supported."
        exit 1

    }

}



================================================
FILE: tests.nu
================================================
#!/usr/bin/env nu

# Builds a container image
def "main run tests" [
    --language = "go" # The language of the project; supported values: `go`
] {

    if $language == "go" {
        go test -v $"(pwd)/..."
    }

}



================================================
FILE: values-prometheus.yaml
================================================
grafana:
  ingress:
    enabled: true
    ingressClassName: traefik
    hosts:
    - grafana.34.73.227.173.nip.io
prometheus:
  ingress:
    enabled: true
    ingressClassName: traefik
    hosts:
    - prometheus.34.73.227.173.nip.io
  # prometheusSpec:
  #   additionalScrapeConfigs:
  #   # Istio
  #   - job_name: istiod
  #     kubernetes_sd_configs:
  #     - role: endpoints
  #       namespaces:
  #         names:
  #         - istio-system
  #     relabel_configs:
  #     - source_labels:
  #       - __meta_kubernetes_service_name
  #       - __meta_kubernetes_endpoint_port_name
  #       action: keep
  #       regex: istiod;http-monitoring
  #   - job_name: envoy-stats
  #     metrics_path: /stats/prometheus
  #     kubernetes_sd_configs:
  #     - role: pod
  #     relabel_configs:
  #     - source_labels:
  #       - __meta_kubernetes_pod_container_port_name
  #       action: keep
  #       regex: .*-envoy-prom
  #   # OpenCost
  #   - job_name: opencost
  #     honor_labels: true
  #     scrape_interval: 1m
  #     scrape_timeout: 10s
  #     metrics_path: /metrics
  #     scheme: http
  #     dns_sd_configs:
  #     - names:
  #       - opencost.opencost
  #       type: 'A'
  #       port: 9003



================================================
FILE: velero.nu
================================================
#!/usr/bin/env nu

# Installs Velero backup and restore solution for Kubernetes with provider-specific configuration
def apply_velero [provider: string, storage_name: string] {

    if $provider == "aws" {

        (
            velero install --provider aws
                --plugins velero/velero-plugin-for-aws:v1.10.0
                --bucket $storage_name
                --backup-location-config region=us-east-1
                --snapshot-location-config region=us-east-1
                --secret-file ./aws-creds.conf --output yaml
        )

    } else if $provider == "google" {

        (
            velero install --provider gcp
                --plugins velero/velero-plugin-for-gcp:v1.11.0
                --bucket $storage_name
                --secret-file ./google-creds.json --output yaml
        )

    } else if $provider == "azure" {

        (
            velero install --provider azure
                --plugins velero/velero-plugin-for-microsoft-azure:v1.11.0
                --bucket $storage_name
                --service-account-name velero
                --pod-labels azure.workload.identity/use=true
                --secret-file azure-creds.env
                --backup-location-config $"useAAD='true',resourceGroup=($env.RESOURCE_GROUP),storageAccount=($env.AZURE_SA_ID)"
        )

    } else {

        print $"(ansi red_bold)($provider)(ansi reset) is not a supported."
        exit 1

    }

}



================================================
FILE: .teller.yml
================================================
providers:
  google_secrets_manager:
    kind: google_secretmanager
    maps:
      - id: secrets
        path: projects/vfarcic
        keys:
          anthropic-api-key: ANTHROPIC_API_KEY
          github-token: GITHUB_TOKEN



================================================
FILE: docs/development.md
================================================
# Development Guide

## Starting a Development Session

When starting a new development session with your AI assistant, use the following prompt:

```
Retrieve and process all information from the `memory` MCP knowledge graph to guide our session.
```



================================================
FILE: prompts/create-diagram.md
================================================
Composite resource is in `REPLACE_COMPOSITE_RESOURCE`.

Crossplane Compositions are stored in `package/compositions.yaml`.

Assume that Composite Resource is applied and that Crossplane selects the correct Composition and composes resources.

Think hard how you will generate Mermaid diagram.

Generate Mermaid diagram of resources based on the Crossplane Compositions. I am interested only in `kind`, `apiVersion`, and `name` of resources.

Include all resources into the diagram.

Use references like `matchControllerRef` and `providerConfigRef` to establish relations between resources. When you see those, it means that it is a dependency.

If you cannot find a dependency of some resource, assume that it depends on the Composite resource (the top resource).

Do not put labels on relations. Use full resource name that combines `metadata.name`, `kind`, `api`.

Avoid duplicated references between resources.

If one resource depends on the other, there is no need to reference it to the Composite Resource at the top.

Paint the Composite Resource as blue, AWS, Google Cloud, and Azure resources should be dark orange and all other resources should be purple.

Use `<br>` to separate lines.

Store the output in the file with the same as the Composite Resource but with the `diag-` prefix. Overwrite the existing content in that file if there is any.

Format the content of the output file as follows.

1. Header "dot-sql"
2. Content of the Composite Resource.
3. Mermaid diagram

Test that it renders correctly. Feel free to use https://mermaid.live if that helps testing.



================================================
FILE: prompts/create-service.md
================================================
- Discover all the Custom Resources a user can create in that Kubernetes cluster.
- Limit it to CRDs with the API `devopstoolkit.live`.
- Those CRDs were created by Crossplane Compositions.
- Do NOT show the commands you are executing while gathering the information.
- Do NOT show the output of the commands you are executing while gathering the information.
- Show on the screen only information related to user input (the questions and the options).
- Output numbered list of Composite Resources a user can create and ask them to select one of them.
- Based on the selected Composite Resource, ask the user for information you might need to generate YAML manifest that can be used to create that resource.
- Ensure that the user can select any of the Compositions within the selected Configuration.
- Think hard about all the available options you will present to the user.
- Ask the user one question at a time.
- Ask only questions based on the CRD schema and limit them to `metadata.name`, `metadata.namespace`, and `spec`.
- Take into the account previous choices when presenting questions.
- Include any additional information you think the user might find useful (e.g., the available regions of the provider, PostgreSQL versions available in the selected provider, etc.). Use your internal knowledge base for that (do not try to discover it from the cluster).
- If the input is not mandatory, instruct the user to type `skip` if it is text input or, if they are presented with options, to select the `skip` option.
- When you ask for the Namespace, give the user the option to select one of the existing Namespaces. Include only Namespaces that contain the word `team`.
- After you gather all the information you might need, generate the manifest and ask the user for the path where to save it.
- Always use `spec.crossplane.compositionSelector.matchLabels` to select the Composition in the manifest you are generating.
- Do not include parts of the manifest that are optional and the user did not choose any value.
- If the user selected to work with `SQL`, after creating the manifest, ask the user for the password they would like to assign to that database.
- If the user selected to work with `SQL`, create the Kubernetes secret with that password in the same Namespace. The name of the secret should be the same as the name of the Composite resource with the addition of `-password` suffix.
- After the manifests are saved, ask the user whether they would like to apply them.



================================================
FILE: prompts/observe-service.md
================================================
- Ask the user to select one of the services available in any of the Namespaces of the cluster. Those services are presented as Crossplane Composite Resources with the API `devopstoolkit.live`.
- Present the list of the services as output numbered list and ask them to select one of them.
- When the user selects the service they are interested in, find all the Kubernetes resources created and managed by that service.
- Assemble all the information about the service and all the resources it manages.
- Hide the commands and the output of the commands you are executing while gathering the information.
- Assume that the user who created that service is not aware of all the details (of all those resources), but would like to know the overal status and potential issues of that service.
- Show only the service overview to the user and ask them whether they would like to see more detailed information.
- We do NOT use Claims so do not waste time trying to find those. We always use Composite Resources directly.


================================================
FILE: .cursor/rules/fetch_mcp_memory_instructions.mdc
================================================
---
description: 
globs: 
alwaysApply: false
---
Retrieve and process all information from the `memory` MCP knowledge graph to guide our session.

