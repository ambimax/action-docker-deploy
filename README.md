<h1 align="center">ambimax/action-docker-deploy</h1>

<p align="center">
  GitHub Action to deploy docker images.
</p>

<br>


## Introduction

GitHub Action to deploy docker images.


## Usage

Example workflow:

```yml
name: Deploy

on:
  push:
    branches:
      - master

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v2
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: "*.preview.company.com"
          digitalocean_token: "${{ secrets.DIGITALOCEAN_TOKEN }}"
          digitalocean_cluster: "preview"
          # Add a comment to the commit with the deployed URL.
          enable_commit_comment: true
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

<!-- region:examples start -->
### [kubernetes](test/01-kubernetes)

Deploy a container to a digitalocean kubernetes cluster

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: ${{ secrets.EXAMPLE_HOST }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          enable_commit_comment: true
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### [kubernetes-env](test/02-kubernetes-env)

Deploy a container to a digitalocean kubernetes cluster with environment variables

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          release: env-test
          host: ${{ secrets.EXAMPLE_HOST }}
          env: WHOAMI_NAME
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
        env:
          WHOAMI_NAME: ${{ secrets.EXAMPLE_WHOAMI_NAME }}
```

### [kubernetes-custom-registry](test/03-kubernetes-custom-registry)

Deploy a container to a digitalocean kubernetes cluster

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: ${{ secrets.EXAMPLE_DOCKER_IMAGE }}
          host: ${{ secrets.EXAMPLE_HOST }}
          port: ${{ secrets.EXAMPLE_PORT }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          docker_secret: ${{ secrets.EXAMPLE_PULL_SECRET }}
```

### [kubernetes-undeploy](test/04-kubernetes-undeploy)

Undeploy a container from a digitalocean kubernetes cluster

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: ${{ secrets.EXAMPLE_HOST }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          undeploy: "true"
```

### [kubernetes-env-undeploy](test/05-kubernetes-env-undeploy)

Undeploy a container from a digitalocean kubernetes cluster with environment variables

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          release: env-test
          host: ${{ secrets.EXAMPLE_HOST }}
          env: WHOAMI_NAME
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          undeploy: yes
        env:
          WHOAMI_NAME: ${{ secrets.EXAMPLE_WHOAMI_NAME }}
```

### [kubernetes-custom-registry-undeploy](test/06-kubernetes-custom-registry-undeploy)

Undeploy a container from a digitalocean kubernetes cluster

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: ${{ secrets.EXAMPLE_DOCKER_IMAGE }}
          host: ${{ secrets.EXAMPLE_HOST }}
          port: ${{ secrets.EXAMPLE_PORT }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          docker_secret: ${{ secrets.EXAMPLE_PULL_SECRET }}
          undeploy: "1"
```

### [kubernetes-values](test/07-kubernetes-values)

Deploy a container to a digitalocean kubernetes cluster with custom values from a file

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: ${{ secrets.EXAMPLE_HOST }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          values_file: ./values.yml
```

### [kubernetes-values-undeploy](test/08-kubernetes-values-undeploy)

Undeploy a container to a digitalocean kubernetes cluster with custom values from a file

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: ${{ secrets.EXAMPLE_HOST }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          values_file: ./values.yml
          undeploy: "true"
```

### [kubernetes-namespace](test/09-kubernetes-namespace)

Deploy a container to a digitalocean kubernetes cluster under a different namespace

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: ${{ secrets.EXAMPLE_HOST }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          enable_commit_comment: true
          github_token: ${{ secrets.GITHUB_TOKEN }}
          namespace: kube-system
```

### [kubernetes-namespace-undeploy](test/09-kubernetes-namespace-undeploy)

Deploy a container to a digitalocean kubernetes cluster under a different namespace

```yml
      - uses: ambimax/action-docker-deploy@v2
        with:
          image: containous/whoami
          host: ${{ secrets.EXAMPLE_HOST }}
          digitalocean_token: ${{ secrets.EXAMPLE_DIGITALOCEAN_TOKEN }}
          digitalocean_cluster: ${{ secrets.EXAMPLE_DIGITALOCEAN_CLUSTER }}
          enable_commit_comment: true
          github_token: ${{ secrets.GITHUB_TOKEN }}
          namespace: kube-system
          undeploy: "true"
```
<!-- region:examples end -->


## Available parameters

<!-- region:parameters start -->
| Name | description | required | default |
|-|-|-|-|
| image | The image to deploy. | true |  |
| host | The host under which to deploy the image.<br><br>If the host contains "*" it will be replaced by the full deployment name.<br> | true |  |
| env | A comma separated list of environment variable names to provide to the container.<br> | false |  |
| app | The name of the app.<br><br>If no name is given it will be set to the docker image name (without leading namespaces).<br> | false |  |
| release | The name of the release.<br><br>If no release is given it will be set to the docker image tag.<br> | false |  |
| namespace | The namespace to deploy into.<br><br>If no namespace is given, it defaults to `default`.<br> | false |  |
| port | The port to expose from the image. | false | 80 |
| docker_secret | The secret to use to pull images. | false |  |
| digitalocean_token | The digitalocean token, if you are deploying to digitalocean. | false |  |
| digitalocean_cluster | The name of the digitalocean_cluster if you are deploying to digitalocean. | false |  |
| undeploy | Whether or not to undeploy instead of deploy the container. | false | false |
| enable_commit_comment | Whether or not to add a comment to the commit with the deployment information. | false | false |
| github_token | The github token used to create the commit comment. | false |  |
| values_file | Path to a yaml file that will be used to provide configuration values for the internal helm chart. See the [./k8s/helm](Chart) for more information. | false |  |
<!-- region:parameters end -->


## Development

Clone this repository

```
git clone https://github.com/ambimax/action-docker-deploy
```

Install all dependencies

```
yarn
```

Build the project

```
yarn build
```

Once done, commit the dist folder to a new feature branch and create a pull request.

**NOTE** This project makes heavy use of code generation. You really only want to edit action.yml, src/index.ts and the test folder. Sections in this readme marked with \<!-- region:xyz start -->...\<!-- region:xyz end --> are autogenerated.


## License

[MIT](LICENSE)


## Author Information

- [Tobias Faust](https://github.com/FaustTobias), [ambimax® GmbH](https://ambimax.de)
