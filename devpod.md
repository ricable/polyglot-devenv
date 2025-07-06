# DevPod Documentation

DevPod is an open-source, client-only tool that provides Codespaces-like functionality but with complete freedom to use any IDE and any cloud provider, Kubernetes cluster, or even just localhost Docker.

## Overview

**What is DevPod?**
- Codespaces but open-source, client-only and unopinionated
- Works with any IDE and lets you use any cloud, kubernetes or just localhost docker
- Creates isolated development environments that are reproducible and portable
- No vendor lock-in - you own your development environment

## Installation

### macOS (ARM64/Silicon)
```bash
curl -L -o devpod "https://github.com/loft-sh/devpod/releases/latest/download/devpod-darwin-arm64" && sudo install -c -m 0755 devpod /usr/local/bin && rm -f devpod
```

### Linux (AMD64)
```bash
curl -L -o devpod "https://github.com/loft-sh/devpod/releases/latest/download/devpod-linux-amd64" && sudo install -c -m 0755 devpod /usr/local/bin && rm -f devpod
```

### Ubuntu (Debian Package)
```bash
cd ~/
wget https://github.com/loft-sh/devpod/releases/latest/download/DevPod_linux_amd64.deb -O DevPod_linux_amd64.deb
sudo dpkg -i DevPod_linux_amd64.deb
```

### Windows
```powershell
md -Force "$Env:APPDATA\devpod"; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]'Tls,Tls11,Tls12';
Invoke-WebRequest -URI "https://github.com/loft-sh/devpod/releases/latest/download/devpod-windows-amd64.exe" -OutFile $Env:APPDATA\devpod\devpod.exe;
$env:Path += ";" + $Env:APPDATA + "\devpod";
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User);
```

## Quick Start

### 1. Add a Provider
First, add a provider to DevPod. The Docker provider is great for local development:

**Add Docker Provider:**
```bash
devpod provider add docker
```

**Add Multiple Providers:**
```bash
devpod provider add docker
devpod provider add kubernetes
devpod provider add ssh
devpod provider add aws
devpod provider add azure
devpod provider add gcloud
devpod provider add digitalocean
```

**Set Default Provider:**
```bash
devpod provider use docker
```

**Add Provider with Options:**
```bash
devpod provider add aws -o AWS_DISK_SIZE=120
```

### 2. Create a Workspace
Create a workspace from various sources:

**From Git Repository:**
```bash
# Create from git repository
devpod up github.com/microsoft/vscode-remote-try-node
```

**From Local Path:**
```bash
# Create from a local path
devpod up ./path/to/my-folder
```

**From Docker Image:**
```bash
# Create from a docker image
devpod up ghcr.io/my-org/my-repo:latest
```

**From Specific Git References:**
```bash
# Branch
devpod up github.com/microsoft/vscode-remote-try-node@main

# Commit
devpod up github.com/microsoft/vscode-remote-try-node@sha256:15ba80171af11374143288fd3d54898860107323

# Pull Request (GitHub only)
devpod up github.com/microsoft/vscode-remote-try-node@pull/108/head
```

**From Existing Container:**
```bash
devpod up my-workspace --source container:$CONTAINER_ID 
```

**With Custom DevContainer Path:**
```bash
devpod up github.com/my-org/my-repo --devcontainer-path ./my-git-path-to/a-devcontainer-json-file.json
```

**With Dotfiles:**
```bash
devpod up https://github.com/example/repo --dotfiles https://github.com/my-user/my-dotfiles-repo
```

**With Custom Dotfiles Script:**
```bash
devpod up https://github.com/example/repo --dotfiles https://github.com/my-user/my-dotfiles-repo --dotfiles-script custom/location/install.sh
```

**With Prebuild Repository:**
```bash
devpod up github.com/my-org/my-repo --prebuild-repository ghcr.io/my-org/my-repo
```

### 3. Connect to Your Workspace

**VS Code Desktop:**
```bash
devpod up my-workspace --ide vscode
```

**VS Code Browser:**
```bash
devpod up my-workspace --ide openvscode
```

**JetBrains IDE:**
```bash
devpod up my-workspace --ide goland
devpod up my-workspace --ide goland --ide-option VERSION=2022.3.3
```

**No IDE (Terminal only):**
```bash
devpod up my-workspace --ide none
```

**SSH Access:**
```bash
ssh WORKSPACE_NAME.devpod
```

**Direct SSH Command:**
```bash
devpod ssh my-workspace
devpod ssh my-workspace --command "echo Hello World"
```

**Change Default IDE:**
```bash
devpod ide use vscode
```

**List Available IDEs:**
```bash
devpod ide list
```

## Managing Providers

### List Available Providers
```bash
devpod provider list-available
```

### Add Providers
```bash
# First-party provider
devpod provider add docker

# Community provider
devpod provider add <user/repository>

# Local provider
devpod provider add ../devpod-provider-mock/provider.yaml
```

### Set Default Provider
```bash
devpod provider use <provider-name>
```

### Update Providers
```bash
devpod provider update <provider-name> my-org/my-repo
```

## Workspace Management

### Stop a Workspace
```bash
devpod stop my-workspace
```

### Reset a Workspace
```bash
# Completely reset workspace - creates clean slate
devpod up my-workspace --reset
```

### Recreate a Workspace
```bash
# Apply changes in devcontainer.json while preserving project files
devpod up my-workspace --recreate
```

### Delete a Workspace
```bash
devpod delete my-workspace
```

### Force Delete a Workspace
```bash
# Force delete when regular deletion fails
devpod delete my-workspace --force
```

### Configure IDE Options
```bash
# List IDE options
devpod ide options openvscode

# Set IDE options
devpod ide set-options openvscode -o VERSION=v1.76.2
```

## Docker Provider Setup

### Prerequisites
Ensure Docker is installed and running on your system.

### Basic Docker Provider Configuration

**Add Docker Provider:**
```bash
devpod provider add docker
```

**Set as Default Provider:**
```bash
devpod provider use docker
```

### Docker Provider with Registry Cache
For faster builds, configure registry cache:

**Enable Containerd Snapshotter (Docker daemon.json):**
```json
{
  "features": {
    "containerd-snapshotter": true
  }
}
```

**Set Registry Cache:**
```bash
devpod context set-options -o REGISTRY_CACHE={registry}
```

### WSL Docker Setup (Windows)

**Enable WSL2:**
```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

**Install Ubuntu WSL:**
```powershell
wsl --install Ubuntu-24.04
```

**Install Docker in WSL:**
```bash
#!/bin/bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo -E curl --verbose -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
sudo systemctl enable docker.service
sudo systemctl enable containerd.service

sudo systemctl start docker.service
sudo systemctl start containerd.service
```

**Expose Docker Daemon via TCP (WSL):**
```bash
#!/bin/bash
sudo cp /lib/systemd/system/docker.service /etc/systemd/system/
sudo sed -i 's/\ -H\ fd:\/\//\ -H\ fd:\/\//\ -H\ tcp:\/\/127.0.0.1:2375/g' /etc/systemd/system/docker.service
sudo systemctl daemon-reload
sudo systemctl restart docker.service
```

**Configure Windows Docker Client:**
```powershell
# Create context to connect to WSL Docker daemon
docker context create lin --docker host=tcp://127.0.0.1:2375
docker context use lin
docker run hello-world
```

### Corporate Proxy Configuration (Optional)
For corporate environments with proxy:

```bash
#!/bin/bash
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo touch /etc/systemd/system/docker.service.d/http-proxy.conf
echo "[Service]" | sudo tee -a /etc/systemd/system/docker.service.d/http-proxy.conf
echo "Environment='HTTP_PROXY=$HTTP_PROXY'" | sudo tee -a /etc/systemd/system/docker.service.d/http-proxy.conf
echo "Environment='HTTPS_PROXY=$HTTPS_PROXY'" | sudo tee -a /etc/systemd/system/docker.service.d/http-proxy.conf
echo "Environment='NO_PROXY=$NO_PROXY'" | sudo tee -a /etc/systemd/system/docker.service.d/http-proxy.conf

# restart docker daemon
sudo systemctl daemon-reload
sudo systemctl restart docker.service
sudo systemctl restart containerd.service
```

## Advanced Features

### Prebuilding Workspaces
Speed up workspace creation by prebuilding Docker images:

```bash
# Prebuild and save to registry
devpod build github.com/my-org/my-repo --repository ghcr.io/my-org/my-repo
```

**Configure prebuild in devcontainer.json:**
```json
{
  "name": "my-project",
  "customizations": {
    "devpod": {
      "prebuildRepository": "ghcr.io/my-org/my-repo"
    }
  }
}
```

### Credential Management

**GPG Agent Forwarding:**
```bash
devpod up --gpg-agent-forwarding my-workspace
```

### Machine Management

**List Machines:**
```bash
devpod machine list
```

**Check Machine Status:**
```bash
devpod machine status <name-of-machine>
```

**SSH to Machine:**
```bash
devpod machine ssh <name-of-machine>
```

### Build Optimization

**Set Registry Cache:**
```bash
devpod context set-options -o REGISTRY_CACHE={registry}
```

## Development Container Support (devcontainer.json)

DevPod supports `.devcontainer/devcontainer.json` files for configuring development environments. This file defines the complete development environment including the base image, tools, extensions, and runtime configuration.

### Basic DevContainer Configuration

**Using Docker Image:**
```json
{
    "name": "My Development Environment",
    "image": "ghcr.io/my-org/my-repo:latest"
}
```

**Using Dockerfile:**
```json
{
    "name": "Node.js Development",
    "build": {
        "dockerfile": "Dockerfile",
        "context": ".."
    }
}
```

**Sample Dockerfile:**
```dockerfile
FROM mcr.microsoft.com/vscode/devcontainers/javascript-node:0-16-buster

# Install additional tools
RUN apt-get update && apt-get install -y \
    vim \
    git \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set up user environment
WORKDIR /workspace
USER node
```

### Complete DevContainer Configuration Example

```json
{
    "name": "Full Stack Development Environment",
    "image": "mcr.microsoft.com/devcontainers/javascript-node:${localEnv:NODE_VERSION:-18-bullseye}",
    
    // Features to add to the dev container
    "features": {
        "ghcr.io/devcontainers/features/docker-in-docker:2": {},
        "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {},
        "ghcr.io/devcontainers/features/github-cli:1": {},
        "https://example.com/custom_feature.tar.gz": {}
    },

    // Configure tool-specific properties
    "customizations": {
        "vscode": {
            "extensions": [
                "ms-vscode.vscode-typescript-next",
                "bradlc.vscode-tailwindcss",
                "ms-vscode.vscode-json",
                "esbenp.prettier-vscode"
            ],
            "settings": {
                "typescript.preferences.includePackageJsonAutoImports": "on",
                "editor.defaultFormatter": "esbenp.prettier-vscode",
                "editor.formatOnSave": true
            }
        },
        "devpod": {
            "prebuildRepository": "ghcr.io/my-org/my-repo",
            "featureDownloadHTTPHeaders": {
                "Authorization": "${env:GITHUB_TOKEN}",
                "Custom-Header": "custom-value"
            }
        }
    },

    // Set container environment variables
    "containerEnv": {
        "NODE_ENV": "development",
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/devdb"
    },

    // Runtime arguments for the container
    "runArgs": [
        "--cap-add=SYS_PTRACE",
        "--security-opt", "seccomp=unconfined"
    ],

    // Mount additional volumes
    "mounts": [
        "source=${localWorkspaceFolder}/.devcontainer/scripts,target=/workspace/.devcontainer/scripts,type=bind",
        "source=/var/run/docker.sock,target=/var/run/docker.sock,type=bind"
    ],

    // Forward ports from the container
    "forwardPorts": [3000, 8080, 5432],
    "portsAttributes": {
        "3000": {
            "label": "Frontend",
            "onAutoForward": "notify"
        },
        "8080": {
            "label": "API Server",
            "onAutoForward": "openBrowser"
        }
    },

    // Use 'postCreateCommand' to run commands after the container is created
    "postCreateCommand": "npm install && npm run setup",

    // Use 'postStartCommand' to run commands after the container starts
    "postStartCommand": "npm run dev &",

    // Use 'postAttachCommand' to run commands when VS Code attaches to the container
    "postAttachCommand": "echo 'Welcome to your dev environment!'",

    // Configure the workspace folder inside the container
    "workspaceFolder": "/workspace",
    "workspaceMount": "source=${localWorkspaceFolder},target=/workspace,type=bind,consistency=cached",

    // Configure the remote user
    "remoteUser": "node",
    "updateRemoteUserUID": true
}
```

### DevContainer Lifecycle Commands

DevContainer supports several lifecycle hooks for automation:

```json
{
    "name": "Development Environment with Lifecycle",
    "image": "node:18-bullseye",
    
    // Commands run at different stages
    "onCreateCommand": [
        "echo 'Container created'",
        "npm cache clean --force"
    ],
    
    "updateContentCommand": [
        "echo 'Content updated'",
        "git submodule update --init --recursive"
    ],
    
    "postCreateCommand": [
        "echo 'Running post-create setup'",
        "npm install",
        "pip install -r requirements.txt"
    ],
    
    "postStartCommand": {
        "server": "npm run dev &",
        "database": "docker-compose up -d postgres"
    },
    
    "postAttachCommand": {
        "welcome": "echo 'Welcome! Run npm start to begin development'"
    }
}
```

### Environment Variables in DevContainer

**Using Local Environment Variables:**
```json
{
    "name": "Node.js",
    "image": "mcr.microsoft.com/devcontainers/javascript-node:${localEnv:IMAGE_VERSION}"
}
```

**SSH Configuration for Environment Variables:**
Add to SSH client config (`~/.ssh/config`):
```
Host <REMOTE-SSH-SERVER>
   SetEnv IMAGE_VERSION=0-18-bullseye
```

Add to SSH server config (`/etc/ssh/sshd_config`):
```
AcceptEnv IMAGE_VERSION
```

Restart SSH service:
```bash
systemctl restart ssh.service
```

### Prebuild Configuration

**Configure Prebuild in devcontainer.json:**
```json
{
  "name": "my-project",
  "customizations": {
    "devpod": {
      "prebuildRepository": "ghcr.io/my-org/my-repo"
    }
  }
}
```

### SELinux Compatibility
For systems with SELinux, modify volume mounts:
```json
{
    "workspaceMount": "",
    "workspaceFolder": "/workspaces/${localWorkspaceFolderBasename}",
    "runArgs": [
        "--volume=${localWorkspaceFolder}:/workspaces/${localWorkspaceFolderBasename}:Z"
    ]
}
```

## Kubernetes Provider Setup

### Prerequisites
- Kubernetes cluster access
- kubectl configured
- Persistent storage available

### Basic Kubernetes Provider Configuration

**Add Kubernetes Provider:**
```bash
devpod provider add kubernetes
```

**Provider YAML Configuration:**
```yaml
name: simple-kubernetes
version: v0.0.1
agent:
  containerInactivityTimeout: 300 # Pod will automatically kill itself after timeout
  path: ${DEVPOD}
  driver: kubernetes
  kubernetes:
    # path: /usr/bin/kubectl
    # namespace: my-namespace-for-devpod
    # context: default
    # clusterRole: ""
    # serviceAccount: ""
    buildRepository: "ghcr.io/my-user/my-repo"
    # helperImage: "ubuntu:latest"
    # buildkitImage: "moby/buildkit"
    # buildkitPrivileged: false
    persistentVolumeSize: 20Gi
    createNamespace: true
exec:
  command: |-
    ${DEVPOD} helper sh -c "${COMMAND}"
```

### Setting up Persistent Volume (Minikube)

**Create PV Directory:**
```bash
mkdir /home/dev/devpods/share
```

**Create PV YAML:**
```yaml
kind: PersistentVolume
apiVersion: v1
metadata:
  name: devpod-pv
  labels:
    type: devpod
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  hostPath:
    path: "/home/dev/devpods/share"
```

**Apply PV Configuration:**
```bash
kubectl create -f ~/devpods/devpod-pv.yml
```

**Verify PV Creation:**
```bash
kubectl get pv
```

### Minikube Setup

**Install Minikube:**
```bash
git clone https://github.com/sandervanvugt/ckad.git
cd ./ckad
./minikube-docker-setup.sh
```

**Create Startup Script:**
```bash
cd ~
touch minikube-start.sh
sudo chmod u+x minikube-start.sh
```

**Startup Script Content:**
```bash
#!/bin/bash
minikube start --vm-driver=docker --cni=calico
```

**Start Minikube:**
```bash
~./minikube-start.sh
```

**Verify Installation:**
```bash
kubectl get all
```

## Machine Management

### Create a Machine
```bash
devpod machine create <name-of-machine> --provider <provider-name>
```

### List Machines
```bash
devpod machine list
```

### Check Machine Status
```bash
devpod machine status <name-of-machine>
```

### SSH to Machine
```bash
devpod machine ssh <name-of-machine>
```

### Delete a Machine
```bash
devpod machine delete <name-of-machine>
```

## Troubleshooting

### Linux Issues

**File Ownership:**
After using a workspace, fix file ownership:
```bash
sudo chown -R $USER:$GROUP .
```

**Docker via WSL:**
Install Docker Engine in Ubuntu WSL:
```bash
#!/bin/bash
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo -E curl --verbose -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo \"$VERSION_CODENAME\") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER
sudo systemctl enable docker.service
sudo systemctl enable containerd.service

sudo systemctl start docker.service
sudo systemctl start containerd.service
```

## Key Benefits

1. **Vendor Agnostic**: Use any cloud provider, IDE, or local environment
2. **Open Source**: No vendor lock-in, full control over your development environment
3. **Client-Only**: No server required, everything runs locally or on your chosen infrastructure
4. **IDE Freedom**: Works with VS Code, JetBrains IDEs, or any SSH-compatible editor
5. **Reproducible**: Consistent development environments across team members
6. **Scalable**: From localhost Docker to enterprise Kubernetes clusters

## Use Cases

- **Remote Development**: Develop on powerful cloud instances
- **Team Standardization**: Ensure all team members use identical environments
- **Resource Isolation**: Keep development dependencies isolated from host system
- **Multi-Project Management**: Different environments for different projects
- **Compliance**: Meet security requirements with controlled development environments

## Integration Examples

### Kubernetes with Minikube
```bash
#!/bin/bash
minikube start --vm-driver=docker --cni=calico
```

### Environment Variables
Start with no IDE for automation:
```console
devpod up <GITHUB-REPOSITORY-URL> --ide=none
```

DevPod provides a powerful, flexible alternative to GitHub Codespaces while maintaining complete control and freedom over your development infrastructure.